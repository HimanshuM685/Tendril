import pg from "pg";
import type { Charge, Metrics, Payout, TopUp, WalletStats, WalletSummary } from "@tendril/shared";
import { config } from "./config.js";
import { creditBalance } from "./x402/credit.js";

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

    CREATE TABLE IF NOT EXISTS payouts (
      id           BIGSERIAL PRIMARY KEY,
      to_addr      TEXT NOT NULL,
      lease_id     TEXT NOT NULL,
      amount_micro BIGINT NOT NULL,
      asset_id     BIGINT NOT NULL,
      txid         TEXT,
      created_at   BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS topups_address_idx ON topups (address, created_at DESC);
    CREATE INDEX IF NOT EXISTS charges_address_idx ON charges (address, created_at DESC);
    CREATE INDEX IF NOT EXISTS payouts_addr_idx ON payouts (to_addr, created_at DESC);
    CREATE INDEX IF NOT EXISTS x402_payments_payer_idx ON x402_payments (payer, created_at DESC);
  `);
}

/** Record a contributor payout (txid null if the on-chain send failed/skipped). */
export async function recordPayout(
  toAddr: string,
  leaseId: string,
  amountAtomic: number,
  txid: string | null,
): Promise<void> {
  await q(
    `INSERT INTO payouts (to_addr, lease_id, amount_micro, asset_id, txid, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [toAddr, leaseId, amountAtomic, Number(config.assetId), txid, Date.now()],
  );
}

export async function walletSummary(address: string): Promise<WalletSummary> {
  const [balance, topupRows, chargeRows, payoutRows, chargeAgg, topupAgg, payoutAgg] = await Promise.all([
    creditBalance(address),
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
  const stats: WalletStats = {
    totalSpentAtomic: chargeAgg[0]?.spent ?? 0,
    totalToppedUpAtomic: topupAgg[0]?.topped ?? 0,
    totalLeaseSeconds: chargeAgg[0]?.secs ?? 0,
    leaseCount: chargeAgg[0]?.cnt ?? 0,
    totalEarnedAtomic: payoutAgg[0]?.earned ?? 0,
    payoutCount: payoutAgg[0]?.pcnt ?? 0,
  };
  return { address, balanceAtomic: balance, topups, charges, payouts, stats };
}

// ─────────────────────────────── platform metrics ───────────────────────────────

/** Bucket first-seen timestamps into a cumulative daily user count. */
function cumulativeByDay(firsts: number[]): { date: string; count: number }[] {
  const perDay = new Map<string, number>();
  for (const ms of firsts) {
    const day = new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  let running = 0;
  return [...perDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, n]) => ({ date, count: (running += n) }));
}

/**
 * Platform-wide leaderboards + growth series, all derived from topups/charges.
 * Public (no PII beyond the addresses users already broadcast on-chain).
 */
export async function metrics(): Promise<Metrics> {
  const [userFirsts, activeFirsts, topup, leaseTime, leaseSpan, timeServed, timesServed] =
    await Promise.all([
      q<{ first: number }>("SELECT MIN(created_at)::bigint AS first FROM topups GROUP BY address"),
      q<{ first: number }>("SELECT MIN(created_at)::bigint AS first FROM charges GROUP BY address"),
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

  const usersOverTime = cumulativeByDay(userFirsts.map((r) => r.first));
  const activeOverTime = cumulativeByDay(activeFirsts.map((r) => r.first));
  return {
    usersOverTime,
    activeOverTime,
    totalUsers: usersOverTime.at(-1)?.count ?? 0,
    totalActive: activeOverTime.at(-1)?.count ?? 0,
    topUsers: { topup, leaseTime, leaseSpan },
    topContributors: { timeServed, timesServed },
  };
}

export default pool;
