/**
 * The credit ledger — the ONE place credit is read or written.
 *
 * Every balance in Tendril lives in `credits.amount_atomic`, in atomic units of
 * the configured asset. It moves in exactly three ways:
 *
 *   1. `creditTopUp`  — a settled POST /x402/topup payment.
 *   2. `debitForLease` — renting spends the portion of a quote that credit covered.
 *   3. `refundUnused` — closing a lease returns the time that was paid for but
 *      not used, which is what makes the *next* 402 for that address smaller.
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
 * Charge a lease. Writes ONE `charges` row for the FULL quote (that is what the
 * usage cost, regardless of how it was funded) and takes `creditAppliedAtomic`
 * out of the balance — the rest arrived on-chain and never touched the ledger.
 *
 * Fails loudly rather than clamping: the caller has already checked the balance
 * and settled a payment sized against it, so a shortfall here is a bug, not a
 * user error to paper over.
 */
export async function debitForLease(args: {
  address: string;
  leaseId: string;
  payToAddr: string;
  quoteAtomic: number;
  creditAppliedAtomic: number;
  seconds: number;
}): Promise<number> {
  const { address, leaseId, payToAddr, quoteAtomic, creditAppliedAtomic, seconds } = args;
  return inTransaction(async (client) => {
    await client.query(
      `INSERT INTO charges (address, lease_id, pay_to, amount_micro, asset_id, seconds, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [address, leaseId, payToAddr, quoteAtomic, Number(config.assetId), seconds, Date.now()],
    );
    if (creditAppliedAtomic <= 0) return currentBalance(client, address);

    const cur = await client.query(
      "SELECT amount_atomic FROM credits WHERE address = $1 FOR UPDATE",
      [address],
    );
    const balance = Number(cur.rows[0]?.amount_atomic ?? 0);
    if (balance < creditAppliedAtomic) {
      throw new Error(
        `credit underflow for ${address}: have ${balance}, need ${creditAppliedAtomic}`,
      );
    }
    return addCredit(client, address, -creditAppliedAtomic);
  });
}

/**
 * Return the unused part of a prepaid lease to the payer, and correct the
 * lease's charge row down to what was actually consumed.
 *
 * This is the hinge between the two endpoints: the refund lands in `credits`,
 * and the next 402 for that address is smaller by exactly this amount.
 */
export async function refundUnused(args: {
  address: string;
  leaseId: string;
  usedAtomic: number;
  usedSeconds: number;
  refundAtomic: number;
}): Promise<number> {
  const { address, leaseId, usedAtomic, usedSeconds, refundAtomic } = args;
  return inTransaction(async (client) => {
    // The charge was written for the whole prepaid block at rent time; bring it
    // back down so spend totals reflect usage rather than what was fronted.
    await client.query(
      "UPDATE charges SET amount_micro = $2, seconds = $3 WHERE lease_id = $1",
      [leaseId, usedAtomic, usedSeconds],
    );
    if (refundAtomic <= 0) return currentBalance(client, address);
    return addCredit(client, address, refundAtomic);
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

async function currentBalance(client: PoolClient, address: string): Promise<number> {
  const cur = await client.query("SELECT amount_atomic FROM credits WHERE address = $1", [address]);
  return Number(cur.rows[0]?.amount_atomic ?? 0);
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
