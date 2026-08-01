/**
 * The credit ledger — the ONE place credit is read or written.
 *
 * Every balance in Tendril lives in `credits.amount_atomic`, in atomic units of
 * the configured asset. It moves in exactly three ways:
 *
 *   1. `creditTopUp` — a settled POST /topup payment.
 *   2. `chargeUsage` — a closed lease, billed for the seconds it actually ran.
 *
 * Renting takes nothing up front (the gate fee is on-chain and never touches
 * this ledger), so a session's whole cost lands in exactly one place.
 *
 * Both endpoints and the sign-in balance reader go through here so there is a
 * single definition of "what does this address have".
 */
import type { PoolClient } from "pg";
import pool, { q } from "../db.js";
import { config } from "../config.js";

/** Current credit balance for an address, in atomic units. 0 if never seen. */
export async function creditBalance(address: string): Promise<number> {
  const rows = await q<{ amount_atomic: number }>(
    "SELECT amount_atomic FROM credits WHERE address = $1",
    [address],
  );
  return rows[0]?.amount_atomic ?? 0;
}

/**
 * Credit a settled top-up payment, idempotently: `topups.txid` is the primary
 * key, so replaying the same settled payment credits nothing a second time.
 * Returns the balance after (unchanged on a replay).
 */
export async function creditTopUp(
  address: string,
  amountAtomic: number,
  txid: string,
): Promise<number> {
  return inTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO topups (txid, address, amount_micro, asset_id, created_at)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (txid) DO NOTHING RETURNING txid`,
      [txid, address, amountAtomic, Number(config.assetId), Date.now()],
    );
    if (ins.rowCount === 0) {
      const cur = await client.query("SELECT amount_atomic FROM credits WHERE address = $1", [
        address,
      ]);
      return Number(cur.rows[0]?.amount_atomic ?? 0);
    }
    return addCredit(client, address, amountAtomic);
  });
}

/**
 * Bill a closed lease for the time it actually ran, once, in one `charges` row.
 *
 * Nothing is taken when the lease opens — a rent pays only the on-chain gate
 * fee — so this is the single moment compute is charged for.
 *
 * The debit is **clamped to the balance** rather than throwing. The watchdog
 * stops a lease when its funding runs out, but it only ticks every
 * `METER_INTERVAL_MS`, so a lease can legitimately overrun by up to one tick.
 * That is a rounding error the platform absorbs, not a reason to fail a close
 * and leave the sandbox billed-but-not-torn-down.
 *
 * Idempotent per lease: `charges.lease_id` is unique, so a concurrent release
 * and watchdog tick cannot bill the same session twice.
 */
export async function chargeUsage(args: {
  address: string;
  leaseId: string;
  payToAddr: string;
  usedAtomic: number;
  usedSeconds: number;
}): Promise<{ charged: number; balance: number }> {
  const { address, leaseId, payToAddr, usedAtomic, usedSeconds } = args;
  return inTransaction(async (client) => {
    const cur = await client.query(
      "SELECT amount_atomic FROM credits WHERE address = $1 FOR UPDATE",
      [address],
    );
    const balance = Number(cur.rows[0]?.amount_atomic ?? 0);
    const charged = Math.max(0, Math.min(usedAtomic, balance));

    const ins = await client.query(
      `INSERT INTO charges (address, lease_id, pay_to, amount_micro, asset_id, seconds, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (lease_id) DO NOTHING
       RETURNING id`,
      [address, leaseId, payToAddr, charged, Number(config.assetId), usedSeconds, Date.now()],
    );
    // Already billed by a concurrent close — leave the balance alone.
    if (ins.rowCount === 0) return { charged: 0, balance };

    if (charged <= 0) return { charged: 0, balance };
    return { charged, balance: await addCredit(client, address, -charged) };
  });
}

// ─────────────────────────────── internals ───────────────────────────────

async function addCredit(client: PoolClient, address: string, deltaAtomic: number): Promise<number> {
  const res = await client.query(
    `INSERT INTO credits (address, amount_atomic, updated_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (address) DO UPDATE SET
       amount_atomic = credits.amount_atomic + $2, updated_at = $3
     RETURNING amount_atomic`,
    [address, deltaAtomic, Date.now()],
  );
  return Number(res.rows[0].amount_atomic);
}


async function inTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
