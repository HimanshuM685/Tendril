import { createHash, randomUUID } from "node:crypto";
import { inTransaction, q } from "./db.js";
import { pinAfterFailure, pinIsLocked, type PinLockRow } from "./pinLock.js";
import { payloadHash, type SignRow, type SignStatus } from "./signIntent.js";

const EXPORT_HOUR_MS = 60 * 60 * 1000;
const EXPORT_COOLDOWN_MS = 30 * 1000;
const EXPORT_MAX_PER_HOUR = 3;

interface SignDb {
  id: string;
  user_id: string;
  action: string;
  payload_json: string;
  payload_hash: string;
  summary: string;
  details: string;
  status: SignStatus;
  expires_at: number;
  consumed_at: number | null;
  created_at: number;
  client_request_id: string | null;
}

function toSign(row: SignDb): SignRow {
  return {
    id: row.id,
    userId: row.user_id,
    action: row.action,
    payloadJson: row.payload_json,
    payloadHash: row.payload_hash,
    summary: row.summary,
    details: row.details,
    status: row.status,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
    clientRequestId: row.client_request_id,
  };
}

export async function insertSignRequest(row: SignRow): Promise<SignRow> {
  if (row.clientRequestId) {
    const existing = await q<SignDb>(
      `SELECT * FROM custodial_sign_requests
       WHERE user_id = $1 AND client_request_id = $2 AND status = 'pending' AND expires_at > $3`,
      [row.userId, row.clientRequestId, Date.now()],
    );
    if (existing[0]) return toSign(existing[0]);
  }
  try {
    const inserted = await q<SignDb>(
      `INSERT INTO custodial_sign_requests
         (id, user_id, action, payload_json, payload_hash, summary, details, status, expires_at, consumed_at, created_at, client_request_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        row.id,
        row.userId,
        row.action,
        row.payloadJson,
        row.payloadHash,
        row.summary,
        row.details,
        row.status,
        row.expiresAt,
        row.consumedAt,
        row.createdAt,
        row.clientRequestId,
      ],
    );
    return toSign(inserted[0]);
  } catch (err) {
    if ((err as { code?: string }).code === "23505" && row.clientRequestId) {
      const existing = await q<SignDb>(
        `SELECT * FROM custodial_sign_requests
         WHERE user_id = $1 AND client_request_id = $2 AND status = 'pending' AND expires_at > $3`,
        [row.userId, row.clientRequestId, Date.now()],
      );
      if (existing[0]) return toSign(existing[0]);
    }
    throw err;
  }
}

/** One winner. Wrong PIN must not call this. */
export async function consumeSignRequest(id: string, userId: string, now = Date.now()): Promise<SignRow | null> {
  const rows = await q<SignDb>(
    `UPDATE custodial_sign_requests
     SET status = 'consumed', consumed_at = $3
     WHERE id = $1 AND user_id = $2 AND status = 'pending' AND expires_at > $3
     RETURNING *`,
    [id, userId, now],
  );
  return rows[0] ? toSign(rows[0]) : null;
}

export async function expireSignRequests(userId: string, now = Date.now()): Promise<void> {
  await q(
    `UPDATE custodial_sign_requests
     SET status = 'expired', consumed_at = $2
     WHERE user_id = $1 AND status = 'pending'`,
    [userId, now],
  );
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function createExportChallenge(userId: string, state: string, expiresAt: number): Promise<void> {
  await q(
    `INSERT INTO export_challenges (id, user_id, provider, state_hash, grant_hash, expires_at, consumed_at, created_at)
     VALUES ($1,$2,'google',$3,NULL,$4,NULL,$5)`,
    [randomUUID(), userId, sha256(state), expiresAt, Date.now()],
  );
}

/** Bind a one-time grant to a still-open Google state. Returns false if the state was already used. */
export async function bindExportGrant(state: string, grant: string, expiresAt: number): Promise<boolean> {
  const rows = await q<{ id: string }>(
    `UPDATE export_challenges
     SET grant_hash = $2, expires_at = $3
     WHERE state_hash = $1 AND grant_hash IS NULL AND consumed_at IS NULL AND expires_at > $4
     RETURNING id`,
    [sha256(state), sha256(grant), expiresAt, Date.now()],
  );
  return rows.length > 0;
}

export async function consumeExportGrant(grant: string, userId: string, now = Date.now()): Promise<boolean> {
  const rows = await q<{ id: string }>(
    `UPDATE export_challenges
     SET consumed_at = $3
     WHERE grant_hash = $1 AND user_id = $2 AND consumed_at IS NULL AND expires_at > $3
     RETURNING id`,
    [sha256(grant), userId, now],
  );
  return rows.length > 0;
}

/** Atomically enforce export limits and reserve one export slot. */
export async function claimExport(userId: string, now = Date.now()): Promise<"ok" | "cooldown" | "limit"> {
  return inTransaction(async (client) => {
    // Serialize export attempts for one user. Without this, concurrent requests
    // can all pass the read-before-insert limit check.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);
    const rows = await client.query<{ created_at: number }>(
      `SELECT created_at FROM export_events WHERE user_id = $1 AND created_at > $2 ORDER BY created_at DESC`,
      [userId, now - EXPORT_HOUR_MS],
    );
    if (rows.rows.length >= EXPORT_MAX_PER_HOUR) return "limit";
    if (rows.rows[0] && now - rows.rows[0].created_at < EXPORT_COOLDOWN_MS) return "cooldown";
    await client.query(`INSERT INTO export_events (id, user_id, created_at) VALUES ($1,$2,$3)`, [
      randomUUID(),
      userId,
      now,
    ]);
    return "ok";
  });
}

/** Validate and consume a Google export grant in the same transaction as its rate-limit slot. */
export async function claimGoogleExport(
  userId: string,
  grant: string,
  now = Date.now(),
): Promise<"ok" | "invalid" | "cooldown" | "limit"> {
  return inTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);
    const challenge = await client.query<{ id: string }>(
      `SELECT id FROM export_challenges
       WHERE grant_hash = $1 AND user_id = $2 AND consumed_at IS NULL AND expires_at > $3
       FOR UPDATE`,
      [sha256(grant), userId, now],
    );
    if (!challenge.rows[0]) return "invalid";

    const events = await client.query<{ created_at: number }>(
      `SELECT created_at FROM export_events WHERE user_id = $1 AND created_at > $2 ORDER BY created_at DESC`,
      [userId, now - EXPORT_HOUR_MS],
    );
    if (events.rows.length >= EXPORT_MAX_PER_HOUR) return "limit";
    if (events.rows[0] && now - events.rows[0].created_at < EXPORT_COOLDOWN_MS) return "cooldown";

    await client.query(`UPDATE export_challenges SET consumed_at = $2 WHERE id = $1`, [challenge.rows[0].id, now]);
    await client.query(`INSERT INTO export_events (id, user_id, created_at) VALUES ($1,$2,$3)`, [
      randomUUID(),
      userId,
      now,
    ]);
    return "ok";
  });
}

interface PinDb {
  subject: string;
  window_started_at: number;
  failure_count: number;
  locked_until: number | null;
}

function toLock(row: PinDb | undefined): PinLockRow | null {
  if (!row) return null;
  return {
    windowStartedAt: row.window_started_at,
    failureCount: row.failure_count,
    lockedUntil: row.locked_until,
  };
}

async function readLock(subject: string): Promise<PinLockRow | null> {
  const rows = await q<PinDb>(`SELECT * FROM pin_attempts WHERE subject = $1`, [subject]);
  return toLock(rows[0]);
}

export async function pinSubjectLocked(subject: string, now = Date.now()): Promise<number | null> {
  const row = await readLock(subject);
  if (!pinIsLocked(row, now)) return null;
  return row?.lockedUntil ?? null;
}

export async function recordPinFailure(subject: string, now = Date.now()): Promise<void> {
  await inTransaction(async (client) => {
    // Lock per subject so simultaneous bad attempts cannot overwrite each
    // other's failure count and bypass the five-attempt threshold.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [subject]);
    const rows = await client.query<PinDb>(`SELECT * FROM pin_attempts WHERE subject = $1 FOR UPDATE`, [subject]);
    const next = pinAfterFailure(toLock(rows.rows[0]), now);
    await client.query(
      `INSERT INTO pin_attempts (subject, window_started_at, failure_count, locked_until)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (subject) DO UPDATE
          SET window_started_at = EXCLUDED.window_started_at,
              failure_count = EXCLUDED.failure_count,
              locked_until = EXCLUDED.locked_until`,
      [subject, next.windowStartedAt, next.failureCount, next.lockedUntil],
    );
  });
}

export async function clearPinFailures(subject: string): Promise<void> {
  await q(`DELETE FROM pin_attempts WHERE subject = $1`, [subject]);
}

export async function bumpAuthEpoch(userId: string): Promise<number> {
  const rows = await q<{ auth_epoch: number }>(
    `UPDATE users SET auth_epoch = auth_epoch + 1 WHERE id = $1 RETURNING auth_epoch`,
    [userId],
  );
  return rows[0]?.auth_epoch ?? 0;
}

export { payloadHash };
