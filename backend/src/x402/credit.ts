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
 *
 * The contributor side of the money lives here too, in its own `earnings`
 * ledger: a closed lease credits the contributor's post-fee share, and they
 * withdraw it to their wallet in one on-chain transfer.
 */
import type { PoolClient } from "pg";
import { q, inTransaction, ledger } from "../db.js";
import { config } from "../config.js";

/** Current credit balance for an address, in atomic units. 0 if never seen. */
export async function creditBalance(address: string): Promise<number> {
  const rows = await q<{ amount_atomic: number }>(
    `SELECT amount_atomic FROM ${ledger("credits")} WHERE address = $1`,
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
      `INSERT INTO ${ledger("topups")} (txid, address, amount_micro, asset_id, created_at)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (txid) DO NOTHING RETURNING txid`,
      [txid, address, amountAtomic, Number(config.assetId), Date.now()],
    );
    if (ins.rowCount === 0) {
      const cur = await client.query(`SELECT amount_atomic FROM ${ledger("credits")} WHERE address = $1`, [
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
 * `allowOverdraft` lifts the clamp and lets the balance go **negative**. It is
 * for the one-shot `/x402/run`, where there is no watchdog to stop the work
 * early: the job is billed for what it actually took even if that is more than
 * the caller had. The debt is real — renting is refused until it is cleared —
 * and the contributor is still paid, so the platform carries it in the interim.
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
  allowOverdraft?: boolean;
}): Promise<{ charged: number; balance: number }> {
  const { address, leaseId, payToAddr, usedAtomic, usedSeconds } = args;
  return inTransaction(async (client) => {
    const cur = await client.query(
      `SELECT amount_atomic FROM ${ledger("credits")} WHERE address = $1 FOR UPDATE`,
      [address],
    );
    const balance = Number(cur.rows[0]?.amount_atomic ?? 0);
    const charged = args.allowOverdraft
      ? Math.max(0, usedAtomic)
      : Math.max(0, Math.min(usedAtomic, balance));

    const ins = await client.query(
      `INSERT INTO ${ledger("charges")} (address, lease_id, pay_to, amount_micro, asset_id, seconds, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (lease_id) DO NOTHING
       RETURNING id`,
      [address, leaseId, payToAddr, charged, Number(config.assetId), usedSeconds, Date.now()],
    );
    // Replay the original amount so a failed earnings credit can be retried.
    // Never recalculate/debit using the payer's new balance on a replay.
    if (ins.rowCount === 0) {
      const prior = await client.query<{ amount_micro: string | number }>(
        "SELECT amount_micro FROM charges WHERE lease_id = $1", [leaseId],
      );
      return { charged: Number(prior.rows[0]?.amount_micro ?? 0), balance };
    }

    if (charged <= 0) return { charged: 0, balance };
    return { charged, balance: await addCredit(client, address, -charged) };
  });
}

// ─────────────────────────── contributor earnings ───────────────────────────
// A second ledger, deliberately separate from `credits`. What a contributor
// earns is cashed out to their wallet; what a renter tops up is spent on rent.
// One balance for both would let earnings be spent as credit (and vice versa).

/** Withdrawable earnings for a contributor address, in atomic units. */
export async function earningsBalance(address: string): Promise<number> {
  const rows = await q<{ amount_atomic: number }>(
    `SELECT amount_atomic FROM ${ledger("earnings")} WHERE address = $1`,
    [address],
  );
  return rows[0]?.amount_atomic ?? 0;
}

/**
 * Credit a closed lease's post-fee share to the contributor's earnings balance.
 * Nothing goes on-chain here — that happens once, at withdrawal.
 *
 * Idempotent per lease: the `payouts` row is the record *and* the lock, so a
 * concurrent release and watchdog tick can't pay the same lease twice.
 */
export async function creditEarnings(
  toAddr: string,
  leaseId: string,
  amountAtomic: number,
): Promise<number> {
  return inTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO ${ledger("payouts")} (to_addr, lease_id, amount_micro, asset_id, txid, created_at)
       VALUES ($1,$2,$3,$4,NULL,$5) ON CONFLICT (lease_id) DO NOTHING RETURNING id`,
      [toAddr, leaseId, amountAtomic, Number(config.assetId), Date.now()],
    );
    if (ins.rowCount === 0) {
      const cur = await client.query(`SELECT amount_atomic FROM ${ledger("earnings")} WHERE address = $1`, [
        toAddr,
      ]);
      return Number(cur.rows[0]?.amount_atomic ?? 0);
    }
    return addEarnings(client, toAddr, amountAtomic);
  });
}

/**
 * Take the whole earnings balance for a withdrawal, atomically. Returns the
 * amount debited, or 0 if it is below `min` (or nothing is there).
 *
 * Debiting *before* the on-chain send is deliberate: a crash mid-send loses the
 * balance rather than paying it twice, and the caller refunds explicitly when
 * the send is known to have failed.
 */
export async function debitAllEarnings(address: string, min: number): Promise<number> {
  return inTransaction(async (client) => {
    const cur = await client.query(
      `SELECT amount_atomic FROM ${ledger("earnings")} WHERE address = $1 FOR UPDATE`,
      [address],
    );
    const balance = Number(cur.rows[0]?.amount_atomic ?? 0);
    if (balance < min || balance <= 0) return 0;
    await addEarnings(client, address, -balance);
    return balance;
  });
}

/** Put a failed withdrawal back. */
export async function refundEarnings(address: string, amountAtomic: number): Promise<void> {
  await inTransaction((client) => addEarnings(client, address, amountAtomic));
}

// ─────────────────────────────── internals ───────────────────────────────

async function addCredit(client: PoolClient, address: string, deltaAtomic: number): Promise<number> {
  const res = await client.query(
    `INSERT INTO ${ledger("credits")} AS c (address, amount_atomic, updated_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (address) DO UPDATE SET
       amount_atomic = c.amount_atomic + $2, updated_at = $3
     RETURNING amount_atomic`,
    [address, deltaAtomic, Date.now()],
  );
  return Number(res.rows[0].amount_atomic);
}


async function addEarnings(
  client: PoolClient,
  address: string,
  deltaAtomic: number,
): Promise<number> {
  const res = await client.query(
    `INSERT INTO ${ledger("earnings")} AS e (address, amount_atomic, updated_at)
     VALUES ($1,$2,$3)
     ON CONFLICT (address) DO UPDATE SET
       amount_atomic = e.amount_atomic + $2, updated_at = $3
     RETURNING amount_atomic`,
    [address, deltaAtomic, Date.now()],
  );
  return Number(res.rows[0].amount_atomic);
}

