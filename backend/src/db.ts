import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import pg from "pg";
import type {
  ApiKeyInfo,
  Charge,
  MetricPoint,
  Metrics,
  Payout,
  TopUp,
  WalletStats,
  WalletSummary,
  Withdrawal,
} from "@tendril/shared";
import { config } from "./config.js";
import { creditBalance, earningsBalance } from "./x402/credit.js";

// Neon is plain Postgres over TLS. A pool suits the long-running registry.
// Only money state lives here: wallets + their history. Nodes and leases are
// ephemeral and kept in memory (see registry.ts / leases.ts).
/**
 * Testnet and mainnet money never mix.
 *
 * Each network gets its own Postgres schema and the connection's `search_path`
 * points at it, so every unqualified query in this process resolves to that
 * network's tables. Two consequences worth spelling out:
 *
 *  - Table names stay the same everywhere. No query says `credits_testnet`, so
 *    a table added later is scoped automatically with no extra work — which is
 *    the whole reason to do it with schemas rather than name prefixes.
 *  - Testnet play money can never be read as a mainnet balance. The isolation
 *    is at the connection, not at each call site, so there is no query left to
 *    forget to filter.
 *
 * `config.network` comes from `networkDefaults`, which throws on anything but
 * "testnet"/"mainnet", so this is a closed set and safe to interpolate.
 */
const SCHEMA = config.network;
if (!/^[a-z]+$/.test(SCHEMA)) {
  throw new Error(`refusing to use "${SCHEMA}" as a schema name`);
}

// The search_path is set in the connection startup packet rather than by a
// `SET` in a `connect` handler: the handler races the first real query on that
// client (pg warns about exactly this and will make it an error in pg@9),
// whereas a startup option is applied by the server before the client is
// usable at all. `public` stays on the path so extensions there still resolve.
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
  options: `-c search_path=${SCHEMA},public`,
});

// int8/bigint comes back as a string by default; we store epoch-ms + atomic
// units (well within Number's safe range here) so parse them to numbers.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

type Row = Record<string, unknown>;
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

/**
 * Create this network's schema and its tables if they don't exist. Call once at
 * startup before serving.
 *
 * Switching ALGORAND_NETWORK therefore starts from an empty ledger rather than
 * inheriting the other network's rows — a testnet balance must never be
 * spendable as mainnet USDC.
 */
export async function initDb(): Promise<void> {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is not set — point it at your Neon Postgres connection string");
  }
  // Must exist before the CREATE TABLEs below: `search_path` tolerates naming a
  // schema that isn't there, but the tables would then land in `public` and the
  // two networks would silently share one ledger.
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
  await pool.query(`
    -- Prepaid credit, in atomic units of the configured asset. Fed by
    -- POST /x402/topup and by refunds of unused lease time; spent by renting.
    CREATE TABLE IF NOT EXISTS credits (
      address       TEXT PRIMARY KEY,
      amount_atomic BIGINT NOT NULL DEFAULT 0,
      updated_at    BIGINT NOT NULL
    );

    -- Every x402 payment we have seen, keyed by its on-chain txid. The row is
    -- written 'pending' before settle() and flipped to 'settled' after, so a
    -- crash in between leaves a marker a reconciliation job can pick up.
    CREATE TABLE IF NOT EXISTS x402_payments (
      txid          TEXT PRIMARY KEY,
      intent_hash   TEXT UNIQUE NOT NULL,
      payer         TEXT NOT NULL,
      route         TEXT NOT NULL,
      amount_atomic BIGINT NOT NULL,
      asset_id      BIGINT NOT NULL,
      status        TEXT NOT NULL,
      created_at    BIGINT NOT NULL,
      settled_at    BIGINT
    );

    -- Settled top-up payments. asset_id is stored per row rather than assumed,
    -- because a schema outlives any one X402_ASSET_ID setting.
    CREATE TABLE IF NOT EXISTS topups (
      txid         TEXT PRIMARY KEY,
      address      TEXT NOT NULL,
      amount_micro BIGINT NOT NULL,
      asset_id     BIGINT NOT NULL,
      created_at   BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charges (
      id           BIGSERIAL PRIMARY KEY,
      address      TEXT NOT NULL,
      lease_id     TEXT NOT NULL,
      pay_to       TEXT NOT NULL DEFAULT '',
      amount_micro BIGINT NOT NULL,
      asset_id     BIGINT NOT NULL,
      seconds      INTEGER NOT NULL,
      created_at   BIGINT NOT NULL
    );

    -- What a contributor earned per lease, after the platform fee. Credited to
    -- the earnings table, never sent on its own — see withdrawals.
    CREATE TABLE IF NOT EXISTS payouts (
      id           BIGSERIAL PRIMARY KEY,
      to_addr      TEXT NOT NULL,
      lease_id     TEXT NOT NULL,
      amount_micro BIGINT NOT NULL,
      asset_id     BIGINT NOT NULL,
      txid         TEXT,
      created_at   BIGINT NOT NULL
    );

    -- Withdrawable contributor earnings. Deliberately NOT the same ledger as
    -- credits: money earned is cashed out to a wallet, money topped up is spent
    -- on rent, and mixing them would let one be used as the other.
    CREATE TABLE IF NOT EXISTS earnings (
      address       TEXT PRIMARY KEY,
      amount_atomic BIGINT NOT NULL DEFAULT 0,
      updated_at    BIGINT NOT NULL
    );

    -- Cash-outs of an earnings balance to the contributor's wallet, on-chain.
    CREATE TABLE IF NOT EXISTS withdrawals (
      id           BIGSERIAL PRIMARY KEY,
      to_addr      TEXT NOT NULL,
      amount_micro BIGINT NOT NULL,
      asset_id     BIGINT NOT NULL,
      txid         TEXT,
      status       TEXT NOT NULL,
      created_at   BIGINT NOT NULL
    );

    -- Contributor API keys, minted in the web UI by a signed-in wallet. Only the
    -- sha256 of the key is stored, so a database leak cannot impersonate a node.
    CREATE TABLE IF NOT EXISTS api_keys (
      id           BIGSERIAL PRIMARY KEY,
      owner_addr   TEXT NOT NULL,
      key_hash     TEXT UNIQUE NOT NULL,
      preview      TEXT NOT NULL,
      label        TEXT NOT NULL DEFAULT '',
      created_at   BIGINT NOT NULL,
      last_used_at BIGINT,
      revoked_at   BIGINT
    );

    -- One charge per lease: usage is billed once, when the lease closes, and a
    -- concurrent release + watchdog tick must not bill the same session twice.
    -- Dedupe legacy rows first so an existing database adopts this without a
    -- manual migration.
    DELETE FROM charges a USING charges b WHERE a.lease_id = b.lease_id AND a.id > b.id;
    CREATE UNIQUE INDEX IF NOT EXISTS charges_lease_uniq ON charges (lease_id);

    -- Same for earnings: a lease credits the contributor exactly once, and the
    -- insert is what makes creditEarnings idempotent. Dedupe legacy rows first.
    DELETE FROM payouts a USING payouts b WHERE a.lease_id = b.lease_id AND a.id > b.id;
    CREATE UNIQUE INDEX IF NOT EXISTS payouts_lease_uniq ON payouts (lease_id);

    CREATE INDEX IF NOT EXISTS topups_address_idx ON topups (address, created_at DESC);
    CREATE INDEX IF NOT EXISTS charges_address_idx ON charges (address, created_at DESC);
    CREATE INDEX IF NOT EXISTS payouts_addr_idx ON payouts (to_addr, created_at DESC);
    CREATE INDEX IF NOT EXISTS withdrawals_addr_idx ON withdrawals (to_addr, created_at DESC);
    CREATE INDEX IF NOT EXISTS api_keys_owner_idx ON api_keys (owner_addr, created_at DESC);
    CREATE INDEX IF NOT EXISTS x402_payments_payer_idx ON x402_payments (payer, created_at DESC);

    -- Google OAuth custodial accounts: maps Google identity → generated Algorand
    -- address. Mnemonic stored encrypted; never raw secret key.
    CREATE TABLE IF NOT EXISTS users (
      id                 TEXT PRIMARY KEY,
      google_sub         TEXT UNIQUE NOT NULL,
      email              TEXT NOT NULL,
      name               TEXT,
      address            TEXT UNIQUE NOT NULL,
      encrypted_mnemonic TEXT NOT NULL,
      created_at         BIGINT NOT NULL,
      last_login_at      BIGINT NOT NULL,
      gas_grant_eligible BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE INDEX IF NOT EXISTS users_address_idx ON users (address);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gas_grant_eligible BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

    CREATE TABLE IF NOT EXISTS platform_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gas_requests (
      id            TEXT PRIMARY KEY,
      user_id       TEXT UNIQUE NOT NULL,
      email         TEXT NOT NULL,
      name          TEXT,
      address       TEXT NOT NULL,
      amount_micro  BIGINT NOT NULL,
      status        TEXT NOT NULL,
      txid          TEXT,
      reviewed_by   TEXT,
      reviewed_at   BIGINT,
      review_note   TEXT,
      created_at    BIGINT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS gas_requests_status_idx ON gas_requests (status, created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS gas_requests_address_idx ON gas_requests (address);

    -- Connected-wallet gas grant eligibility (mirrors users.gas_grant_eligible).
    CREATE TABLE IF NOT EXISTS wallet_gas_state (
      address             TEXT PRIMARY KEY,
      gas_grant_eligible  BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);
}

export interface DbUser {
  id: string;
  google_sub: string | null;
  email: string;
  name: string | null;
  address: string;
  encrypted_mnemonic: string;
  password_hash: string | null;
  created_at: number;
  last_login_at: number;
  gas_grant_eligible: boolean;
}

export async function findUserByGoogleSub(sub: string): Promise<DbUser | null> {
  const rows = await q<DbUser>("SELECT * FROM users WHERE google_sub = $1", [sub]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const rows = await q<DbUser>("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await q<DbUser>("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  return rows[0] ?? null;
}

export async function createUser(row: {
  id: string;
  googleSub: string;
  email: string;
  name: string | null;
  address: string;
  encryptedMnemonic: string;
}): Promise<DbUser> {
  const now = Date.now();
  const rows = await q<DbUser>(
    `INSERT INTO users (id, google_sub, email, name, address, encrypted_mnemonic, created_at, last_login_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,
    [row.id, row.googleSub, row.email, row.name, row.address, row.encryptedMnemonic, now],
  );
  return rows[0];
}

export async function createEmailUser(row: {
  id: string;
  email: string;
  passwordHash: string;
  address: string;
  encryptedMnemonic: string;
}): Promise<DbUser> {
  const now = Date.now();
  const rows = await q<DbUser>(
    `INSERT INTO users (id, google_sub, email, name, address, encrypted_mnemonic, password_hash, created_at, last_login_at)
     VALUES ($1, NULL, $2, NULL, $3, $4, $5, $6, $6) RETURNING *`,
    [row.id, row.email, row.address, row.encryptedMnemonic, row.passwordHash, now],
  );
  return rows[0];
}

const EMAIL_AUTH_SETTING = "email_auth_enabled";

export async function isEmailAuthEnabled(): Promise<boolean> {
  const rows = await q<{ value: string }>(
    "SELECT value FROM platform_settings WHERE key = $1",
    [EMAIL_AUTH_SETTING],
  );
  if (rows[0]) return rows[0].value === "true";
  return process.env.EMAIL_AUTH_DEFAULT === "true";
}

export async function setEmailAuthEnabled(enabled: boolean): Promise<void> {
  await q(
    `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [EMAIL_AUTH_SETTING, enabled ? "true" : "false"],
  );
}

export async function touchUserLogin(id: string): Promise<void> {
  await q("UPDATE users SET last_login_at = $1 WHERE id = $2", [Date.now(), id]);
}

export async function setGasGrantIneligible(userId: string): Promise<void> {
  await q("UPDATE users SET gas_grant_eligible = FALSE WHERE id = $1", [userId]);
}

export async function isWalletGasGrantEligible(address: string): Promise<boolean> {
  const rows = await q<{ gas_grant_eligible: boolean }>(
    "SELECT gas_grant_eligible FROM wallet_gas_state WHERE address = $1",
    [address],
  );
  return rows[0]?.gas_grant_eligible ?? true;
}

export async function setWalletGasGrantIneligible(address: string): Promise<void> {
  await q(
    `INSERT INTO wallet_gas_state (address, gas_grant_eligible) VALUES ($1, FALSE)
     ON CONFLICT (address) DO UPDATE SET gas_grant_eligible = FALSE`,
    [address],
  );
}

// ─────────────────────────── gas requests ───────────────────────────

export type GasRequestStatus = "pending" | "accepted" | "rejected";

export interface DbGasRequest {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  address: string;
  amount_micro: number;
  status: GasRequestStatus;
  txid: string | null;
  reviewed_by: string | null;
  reviewed_at: number | null;
  review_note: string | null;
  created_at: number;
}

export async function findGasRequestByUserId(userId: string): Promise<DbGasRequest | null> {
  const rows = await q<DbGasRequest>("SELECT * FROM gas_requests WHERE user_id = $1", [userId]);
  return rows[0] ?? null;
}

export async function findGasRequestByAddress(address: string): Promise<DbGasRequest | null> {
  const rows = await q<DbGasRequest>("SELECT * FROM gas_requests WHERE address = $1", [address]);
  return rows[0] ?? null;
}

export async function findGasRequestById(id: string): Promise<DbGasRequest | null> {
  const rows = await q<DbGasRequest>("SELECT * FROM gas_requests WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export async function createGasRequest(row: {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  address: string;
  amountMicro: number;
}): Promise<DbGasRequest> {
  const now = Date.now();
  const rows = await q<DbGasRequest>(
    `INSERT INTO gas_requests (id, user_id, email, name, address, amount_micro, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'pending',$7) RETURNING *`,
    [row.id, row.userId, row.email, row.name, row.address, row.amountMicro, now],
  );
  return rows[0];
}

export async function listGasRequests(status?: GasRequestStatus): Promise<DbGasRequest[]> {
  if (status) {
    return q<DbGasRequest>(
      "SELECT * FROM gas_requests WHERE status = $1 ORDER BY created_at DESC",
      [status],
    );
  }
  return q<DbGasRequest>("SELECT * FROM gas_requests ORDER BY created_at DESC");
}

export async function countGasRequestsByStatus(status: GasRequestStatus): Promise<number> {
  const rows = await q<{ n: number }>(
    "SELECT COUNT(*)::bigint AS n FROM gas_requests WHERE status = $1",
    [status],
  );
  return rows[0]?.n ?? 0;
}

export async function resolveGasRequest(
  id: string,
  status: "accepted" | "rejected",
  reviewedBy: string,
  opts: { txid?: string; note?: string },
): Promise<DbGasRequest | null> {
  const rows = await q<DbGasRequest>(
    `UPDATE gas_requests
     SET status = $2, reviewed_by = $3, reviewed_at = $4, txid = $5, review_note = $6
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id, status, reviewedBy, Date.now(), opts.txid ?? null, opts.note ?? null],
  );
  return rows[0] ?? null;
}

export async function listGoogleUsers(limit = 50, offset = 0): Promise<DbUser[]> {
  return q<DbUser>(
    "SELECT * FROM users ORDER BY last_login_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
}

export async function countGoogleUsers(): Promise<number> {
  const rows = await q<{ n: number }>("SELECT COUNT(*)::bigint AS n FROM users");
  return rows[0]?.n ?? 0;
}

export async function walletSummary(address: string): Promise<WalletSummary> {
  const [
    balance,
    earnings,
    topupRows,
    chargeRows,
    payoutRows,
    withdrawalRows,
    chargeAgg,
    topupAgg,
    payoutAgg,
  ] = await Promise.all([
    creditBalance(address),
    earningsBalance(address),
    q<{ txid: string; address: string; amount_micro: number; created_at: number }>(
      "SELECT * FROM topups WHERE address = $1 ORDER BY created_at DESC LIMIT 50",
      [address],
    ),
    q<{ id: number; address: string; lease_id: string; pay_to: string; amount_micro: number; seconds: number; created_at: number }>(
      "SELECT * FROM charges WHERE address = $1 ORDER BY created_at DESC LIMIT 50",
      [address],
    ),
    q<{ id: number; to_addr: string; lease_id: string; amount_micro: number; txid: string | null; created_at: number }>(
      "SELECT * FROM payouts WHERE to_addr = $1 ORDER BY created_at DESC LIMIT 50",
      [address],
    ),
    q<{ id: number; to_addr: string; amount_micro: number; txid: string | null; status: string; created_at: number }>(
      "SELECT * FROM withdrawals WHERE to_addr = $1 ORDER BY created_at DESC LIMIT 50",
      [address],
    ),
    // Lifetime aggregates (not capped by the history LIMITs above). SUM(bigint)
    // is numeric, so cast back to bigint for the int8→Number parser.
    q<{ spent: number; secs: number; cnt: number }>(
      `SELECT COALESCE(SUM(amount_micro),0)::bigint AS spent,
              COALESCE(SUM(seconds),0)::bigint AS secs,
              COUNT(*)::bigint AS cnt
         FROM charges WHERE address = $1`,
      [address],
    ),
    q<{ topped: number }>(
      "SELECT COALESCE(SUM(amount_micro),0)::bigint AS topped FROM topups WHERE address = $1",
      [address],
    ),
    q<{ earned: number; pcnt: number }>(
      `SELECT COALESCE(SUM(amount_micro),0)::bigint AS earned, COUNT(*)::bigint AS pcnt
         FROM payouts WHERE to_addr = $1`,
      [address],
    ),
  ]);
  const topups: TopUp[] = topupRows.map((t) => ({
    txid: t.txid,
    address: t.address,
    amountAtomic: t.amount_micro,
    createdAt: t.created_at,
  }));
  const charges: Charge[] = chargeRows.map((c) => ({
    id: c.id,
    address: c.address,
    leaseId: c.lease_id,
    payToAddr: c.pay_to,
    amountAtomic: c.amount_micro,
    seconds: c.seconds,
    createdAt: c.created_at,
  }));
  const payouts: Payout[] = payoutRows.map((p) => ({
    id: p.id,
    toAddr: p.to_addr,
    leaseId: p.lease_id,
    amountAtomic: p.amount_micro,
    txid: p.txid,
    createdAt: p.created_at,
  }));
  const withdrawals: Withdrawal[] = withdrawalRows.map((w) => ({
    id: w.id,
    toAddr: w.to_addr,
    amountAtomic: w.amount_micro,
    txid: w.txid,
    status: w.status === "sent" ? "sent" : "failed",
    createdAt: w.created_at,
  }));
  const stats: WalletStats = {
    totalSpentAtomic: chargeAgg[0]?.spent ?? 0,
    totalToppedUpAtomic: topupAgg[0]?.topped ?? 0,
    totalLeaseSeconds: chargeAgg[0]?.secs ?? 0,
    leaseCount: chargeAgg[0]?.cnt ?? 0,
    totalEarnedAtomic: payoutAgg[0]?.earned ?? 0,
    payoutCount: payoutAgg[0]?.pcnt ?? 0,
  };
  return {
    address,
    balanceAtomic: balance,
    earningsAtomic: earnings,
    topups,
    charges,
    payouts,
    withdrawals,
    stats,
  };
}

// ─────────────────────────── contributor API keys ───────────────────────────
// The key replaces the private key a contributor used to keep in their .env:
// the agent authenticates with it, and the wallet that minted it is the node's
// owner and payout address. Only the hash is stored, so the plaintext exists in
// exactly two places — the contributor's .env and the one response that made it.

const hashKey = (secret: string) => createHash("sha256").update(secret).digest("hex");

/** Mint a key for `ownerAddr`. Returns the row plus the plaintext, shown once. */
export async function createApiKey(
  ownerAddr: string,
  label: string,
): Promise<{ key: ApiKeyInfo; secret: string }> {
  const secret = `tnd_${nanoid(32)}`;
  const preview = `${secret.slice(0, 8)}…${secret.slice(-4)}`;
  const rows = await q<{ id: number; created_at: number }>(
    `INSERT INTO api_keys (owner_addr, key_hash, preview, label, created_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
    [ownerAddr, hashKey(secret), preview, label, Date.now()],
  );
  return {
    secret,
    key: { id: rows[0].id, label, preview, createdAt: rows[0].created_at, lastUsedAt: null },
  };
}

export async function listApiKeys(ownerAddr: string): Promise<ApiKeyInfo[]> {
  const rows = await q<{
    id: number;
    label: string;
    preview: string;
    created_at: number;
    last_used_at: number | null;
  }>(
    `SELECT id, label, preview, created_at, last_used_at FROM api_keys
      WHERE owner_addr = $1 AND revoked_at IS NULL ORDER BY created_at DESC`,
    [ownerAddr],
  );
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    preview: r.preview,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

/** Revoke one of `ownerAddr`'s keys. Scoped by owner so an id guess is useless. */
export async function revokeApiKey(ownerAddr: string, id: number): Promise<boolean> {
  const rows = await q<{ id: number }>(
    "DELETE FROM api_keys WHERE id = $1 AND owner_addr = $2 RETURNING id",
    [id, ownerAddr],
  );
  return rows.length > 0;
}

/** The wallet a live API key belongs to, or null. Also stamps `last_used_at`. */
export async function ownerOfApiKey(secret: string): Promise<string | null> {
  if (!secret) return null;
  const rows = await q<{ owner_addr: string }>(
    `UPDATE api_keys SET last_used_at = $1
      WHERE key_hash = $2 AND revoked_at IS NULL
      RETURNING owner_addr`,
    [Date.now(), hashKey(secret)],
  );
  return rows[0]?.owner_addr ?? null;
}

/** Record a withdrawal attempt (txid null when the on-chain send failed). */
export async function recordWithdrawal(
  toAddr: string,
  amountAtomic: number,
  txid: string | null,
): Promise<void> {
  await q(
    `INSERT INTO withdrawals (to_addr, amount_micro, asset_id, txid, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [toAddr, amountAtomic, Number(config.assetId), txid, txid ? "sent" : "failed", Date.now()],
  );
}

// ─────────────────────────────── platform metrics ───────────────────────────────

/**
 * Cumulative user count, one point per join rather than one per day. Day
 * buckets collapse a young platform into a single point (and a flat chart);
 * a point per change plots the same way whether growth spans hours or years.
 */
function cumulativeByChange(firsts: number[]): MetricPoint[] {
  let running = 0;
  return [...firsts].sort((a, b) => a - b).map((t) => ({ t, count: ++running }));
}

/** A session on compute: who, when it started, when it ended (null = still running). */
export interface ActiveWindow {
  address: string;
  start: number;
  end: number | null;
}

/**
 * How many distinct users were on compute at each moment something changed.
 *
 * This is a concurrency series, not a cumulative one: it goes down when a
 * session ends. That distinction is the whole point of the chart — a running
 * total of everyone who ever rented can only ever rise, so it says nothing
 * about how busy the platform is *now*.
 *
 * Counted per address, not per lease, so one user holding two sandboxes is one
 * active user: an address only moves the running total when its own depth
 * crosses 0. Ends are applied after starts at the same instant, so a user who
 * closes one lease and opens another in the same millisecond never dips to 0.
 */
export function activeUsersByChange(windows: ActiveWindow[]): MetricPoint[] {
  const events = windows.flatMap((w) =>
    w.end === null
      ? [{ t: w.start, delta: 1, address: w.address }]
      : [
          { t: w.start, delta: 1, address: w.address },
          { t: w.end, delta: -1, address: w.address },
        ],
  );
  events.sort((a, b) => a.t - b.t || b.delta - a.delta);

  const depth = new Map<string, number>();
  const points: MetricPoint[] = [];
  let running = 0;
  for (const e of events) {
    const before = depth.get(e.address) ?? 0;
    const after = before + e.delta;
    depth.set(e.address, after);
    // Only a 0↔1 crossing changes the user count; a user's second overlapping
    // lease is already represented.
    if (before === 0 && after === 1) running += 1;
    else if (before === 1 && after === 0) running -= 1;
    else continue;
    const last = points[points.length - 1];
    if (last && last.t === e.t) last.count = running;
    else points.push({ t: e.t, count: running });
  }
  return points;
}

/**
 * Platform-wide leaderboards + growth series, all derived from topups/charges.
 * Public (no PII beyond the addresses users already broadcast on-chain).
 */
export async function metrics(live: ActiveWindow[] = []): Promise<Metrics> {
  const [userFirsts, closedWindows, topup, leaseTime, leaseSpan, timeServed, timesServed] =
    await Promise.all([
      // A user is anyone who has ever paid us, whether that was a top-up or a
      // lease paid for directly — counting only top-ups misses the second kind
      // entirely and undercounts the platform.
      q<{ first: number }>(
        `SELECT MIN(created_at)::bigint AS first FROM (
           SELECT address, created_at FROM topups
           UNION ALL
           SELECT address, created_at FROM charges
         ) paid GROUP BY address`,
      ),
      // A charge is written once, at close, and carries the billed duration —
      // so the session's window is [close - seconds, close]. `seconds` is int4
      // and must be widened before the multiply or a ~25-day lease overflows it.
      q<{ address: string; start: number; finish: number }>(
        `SELECT address,
                (created_at - seconds::bigint * 1000)::bigint AS start,
                created_at::bigint AS finish
           FROM charges`,
      ),
      q<{ address: string; value: number }>(
        "SELECT address, SUM(amount_micro)::bigint AS value FROM topups GROUP BY address ORDER BY value DESC LIMIT 20",
      ),
      q<{ address: string; value: number }>(
        "SELECT address, SUM(seconds)::bigint AS value FROM charges GROUP BY address ORDER BY value DESC LIMIT 20",
      ),
      q<{ address: string; value: number }>(
        "SELECT address, COUNT(DISTINCT lease_id)::bigint AS value FROM charges GROUP BY address ORDER BY value DESC LIMIT 20",
      ),
      q<{ address: string; value: number }>(
        "SELECT pay_to AS address, SUM(seconds)::bigint AS value FROM charges WHERE pay_to <> '' GROUP BY pay_to ORDER BY value DESC LIMIT 20",
      ),
      q<{ address: string; value: number }>(
        "SELECT pay_to AS address, COUNT(DISTINCT lease_id)::bigint AS value FROM charges WHERE pay_to <> '' GROUP BY pay_to ORDER BY value DESC LIMIT 20",
      ),
    ]);

  const usersOverTime = cumulativeByChange(userFirsts.map((r) => r.first));
  // Closed sessions come from the ledger; the ones running right now only exist
  // in memory, and without them the series stops at the last close and a busy
  // platform reads as empty.
  const activeOverTime = activeUsersByChange([
    ...closedWindows.map((r) => ({ address: r.address, start: r.start, end: r.finish })),
    ...live,
  ]);
  return {
    usersOverTime,
    activeOverTime,
    totalUsers: usersOverTime.at(-1)?.count ?? 0,
    totalActive: new Set(live.map((w) => w.address)).size,
    topUsers: { topup, leaseTime, leaseSpan },
    topContributors: { timeServed, timesServed },
  };
}

export default pool;
