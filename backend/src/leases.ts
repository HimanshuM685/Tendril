import { nanoid } from "nanoid";
import type { Lease, LeaseStatus, SandboxAccess } from "@tendril/shared";
import { fundedSeconds, proratedCost } from "@tendril/shared";
import { recordPayout } from "./db.js";
import { chargeUsage, creditBalance } from "./x402/credit.js";
import { payContributor, payoutsEnabled } from "./payout.js";
import { getNode } from "./registry.js";
import { destroyContainer } from "./ws.js";
import { config } from "./config.js";

/**
 * In-memory lease store. Leases track a live sandbox session; like nodes, they
 * don't survive a restart (the sockets they depend on don't either), so they
 * stay in memory and never touch the DB on the hot path.
 *
 * A lease is an open-ended metered session. Nothing is bought up front — the
 * renter pays a small on-chain gate fee, the clock starts, and the time actually
 * used is billed once when the session ends.
 */
const leases = new Map<string, Lease>();

export interface NewLease {
  nodeId: string;
  renterAddr: string;
  payerAddr: string;
  payToAddr: string;
  rateAtomicPerHour: number;
  gateFeeAtomic: number;
  /** The payer's credit at lease start — what the funding window is computed from. */
  fundingAtomic: number;
  paymentTxid: string | null;
  /** See `Lease.allowOverdraft`. Off unless the caller says otherwise. */
  allowOverdraft?: boolean;
}

export function createLease(args: NewLease): Lease {
  const now = Date.now();
  const lease: Lease = {
    id: nanoid(12),
    access: null,
    status: "starting",
    startedAt: 0,
    expiresAt: fundedUntil(now, args.fundingAtomic, args.rateAtomicPerHour),
    graceUntil: null,
    createdAt: now,
    ...args,
    allowOverdraft: args.allowOverdraft ?? false,
  };
  leases.set(lease.id, lease);
  return lease;
}

/**
 * When credit runs dry at this rate. A free node (`rate <= 0`) has nothing to
 * run down, so it gets `Infinity` — the watchdog then never stops it and the
 * renter closes when they are done, which is the honest answer for a lease that
 * costs nothing.
 */
function fundedUntil(from: number, creditAtomic: number, rateAtomicPerHour: number): number {
  const seconds = fundedSeconds(creditAtomic, rateAtomicPerHour);
  return seconds === null ? Number.POSITIVE_INFINITY : from + seconds * 1000;
}

export function getLease(id: string): Lease | undefined {
  return leases.get(id);
}

export function setLeaseStatus(id: string, status: LeaseStatus): void {
  const lease = leases.get(id);
  if (lease) lease.status = status;
}

/**
 * Drop a lease that was never paid for — provisioning failed, or settlement did.
 * Tears the sandbox down and frees the node, but touches no money: there is no
 * charge to correct and nothing to refund, and running the normal close path
 * here would credit the payer for a payment that never settled.
 */
export function abandonLease(id: string): void {
  const lease = leases.get(id);
  if (!lease) return;
  destroyContainer(lease.nodeId, lease.id); // best-effort; may never have started
  leases.delete(id);
}

/**
 * Mark a lease active now that its sandbox is up. This starts the paid window:
 * `expiresAt` is set from here, so a slow container start doesn't eat time the
 * renter paid for.
 */
export function activateLease(id: string, access: SandboxAccess): void {
  const lease = leases.get(id);
  if (!lease) return;
  lease.access = access;
  lease.status = "active";
  // The meter starts when the sandbox is actually reachable, so a slow container
  // start is never billed and never eats the renter's funded window.
  lease.startedAt = Date.now();
  lease.expiresAt = fundedUntil(lease.startedAt, lease.fundingAtomic, lease.rateAtomicPerHour);
}

export function leasesForNode(nodeId: string): Lease[] {
  return [...leases.values()].filter((l) => l.nodeId === nodeId);
}

/**
 * True if the node already has a lease starting or running on it. Creating a
 * lease *is* the reservation — there is no separate hold, so a caller who is
 * away paying a 402 challenge can lose the node to someone faster. That is the
 * intended trade: better a 409 on the retry than a settled payment for a node
 * that was reserved and never used.
 */
export function nodeBusy(nodeId: string): boolean {
  return leasesForNode(nodeId).some((l) => l.status === "starting" || l.status === "active");
}

/** What a closed lease actually used, and what it cost. */
export interface LeaseSettlement {
  usedSeconds: number;
  /** Cost of those seconds at the lease's rate. */
  usedAtomic: number;
  /** What was actually taken from credit — clamped to the balance. */
  chargedAtomic: number;
  balance: number;
}

/**
 * Close a lease exactly once and bill the time it ran. Idempotent: flips status
 * synchronously before the async work so a concurrent release and watchdog tick
 * can't bill twice.
 *
 *   usedSeconds = wall-clock seconds the sandbox was up
 *   usedAtomic  = prorated cost of those seconds
 *   charged     = min(usedAtomic, balance)   -> taken from the payer's credit
 *   payout      = charged minus the platform fee -> contributor, on-chain USDC
 *
 * There is no refund step, because nothing was taken up front. The sandbox is
 * always torn down, even if the money side throws.
 */
export async function closeLease(
  leaseId: string,
  reason: string,
): Promise<LeaseSettlement | null> {
  const lease = leases.get(leaseId);
  if (!lease) return null;
  if (lease.status === "ended" || lease.status === "failed") return null;

  const wasActive = lease.status === "active" && lease.startedAt > 0;
  lease.status = "ended"; // claim it synchronously to prevent re-entry

  destroyContainer(lease.nodeId, lease.id); // best-effort teardown

  const usedSeconds = wasActive
    ? Math.max(0, Math.round((Date.now() - lease.startedAt) / 1000))
    : 0;
  const usedAtomic = proratedCost(lease.rateAtomicPerHour, usedSeconds);

  try {
    const { charged, balance } = await chargeUsage({
      address: lease.payerAddr,
      leaseId: lease.id,
      payToAddr: lease.payToAddr,
      usedAtomic,
      usedSeconds,
      allowOverdraft: lease.allowOverdraft,
    });
    console.log(
      `[bill] lease ${lease.id} (${reason}): ran ${usedSeconds}s = ${usedAtomic}, ` +
        `charged ${charged} to ${lease.payerAddr} (balance ${balance})`,
    );
    // Pay the contributor out of what was actually collected, never out of what
    // was merely owed — otherwise an overrun would be funded by the platform.
    if (charged > 0) await payoutContributor(lease, charged);
    return { usedSeconds, usedAtomic, chargedAtomic: charged, balance };
  } catch (err) {
    console.error(`[bill] failed to bill lease ${lease.id}:`, (err as Error).message);
    return null;
  }
}

/** Pay the contributor their share of what was collected; record it either way. */
async function payoutContributor(lease: Lease, chargedAtomic: number): Promise<void> {
  const fee = Math.floor((chargedAtomic * config.platformFeePct) / 100);
  const contributorCut = chargedAtomic - fee;
  if (contributorCut <= 0) return;

  // Two ways a payout can't go out: we hold no signing key, or the contributor
  // never opted into the asset. Both record the debt rather than dropping it.
  const blocked = getNode(lease.nodeId)?.payoutBlocked ?? false;
  if (!payoutsEnabled() || blocked) {
    console.warn(
      `[payout] ${blocked ? `${lease.payToAddr} has not opted into asset ${config.assetId}` : "PLATFORM_PRIVATE_KEY not set"}` +
        ` — recording unpaid ${contributorCut} to ${lease.payToAddr}`,
    );
    await recordPayout(lease.payToAddr, lease.id, contributorCut, null);
    return;
  }

  try {
    const txid = await payContributor(lease.payToAddr, contributorCut);
    await recordPayout(lease.payToAddr, lease.id, contributorCut, txid);
    console.log(`[payout] ${contributorCut} → ${lease.payToAddr} (fee ${fee}, txid ${txid})`);
  } catch (err) {
    await recordPayout(lease.payToAddr, lease.id, contributorCut, null);
    console.error(`[payout] failed to pay ${lease.payToAddr}: ${(err as Error).message}`);
  }
}

/**
 * The watchdog — the only thing that ends a lease the renter didn't. It does not
 * bill per tick; it stops a session once the renter's credit can no longer pay
 * for it. No DB writes per tick.
 */
export function startWatchdog(intervalMs = config.meterIntervalMs): NodeJS.Timeout {
  return setInterval(() => void watchdogTick(), intervalMs);
}

async function watchdogTick(): Promise<void> {
  const now = Date.now();
  for (const lease of leases.values()) {
    if (lease.status !== "active") continue;
    if (now < lease.expiresAt) continue;

    // `expiresAt` is only a projection made at lease start, so before acting on
    // it, ask the ledger what the payer actually holds now. A top-up mid-session
    // lands here and extends the window instead of being ignored until the next
    // rent — including one made *during* the grace window, which is the whole
    // point of giving one.
    const decision = expiredLeaseAction(lease, await creditBalance(lease.payerAddr), now);
    switch (decision.action) {
      case "extend":
        lease.expiresAt = decision.expiresAt;
        if (lease.graceUntil !== null) {
          console.log(`[watchdog] lease ${lease.id} topped up — grace cleared`);
          lease.graceUntil = null;
        }
        break;
      case "grace":
        lease.graceUntil = decision.graceUntil;
        console.log(
          `[watchdog] credit exhausted on lease ${lease.id} — ` +
            `${Math.round((decision.graceUntil - now) / 1000)}s grace to save work`,
        );
        break;
      case "wait": // grace window still open — leave them to it
        break;
      case "close":
        console.log(`[watchdog] lease ${lease.id} out of time — ending`);
        await closeLease(lease.id, "credit-exhausted");
        break;
    }
  }
}

export type WatchdogAction =
  | { action: "extend"; expiresAt: number }
  | { action: "grace"; graceUntil: number }
  | { action: "wait" }
  | { action: "close" };

/**
 * What to do with a lease that has run past `expiresAt`, given the payer's live
 * balance. Pure, so the money decision can be tested without a ledger.
 *
 * Running out of credit does not cut the session off mid-keystroke: the renter
 * first gets `GRACE_ATOMIC` worth of runtime **at their own rate** to save their
 * work, and only then is the sandbox destroyed. That time is unfunded and the
 * platform absorbs it — `chargeUsage` clamps the close to the balance, which by
 * that point is spent.
 */
export function expiredLeaseAction(
  lease: Pick<Lease, "rateAtomicPerHour" | "startedAt" | "graceUntil">,
  balanceAtomic: number,
  now: number,
): WatchdogAction {
  const elapsed = Math.max(0, Math.round((now - lease.startedAt) / 1000));
  const owed = proratedCost(lease.rateAtomicPerHour, elapsed);
  if (balanceAtomic > owed) {
    return { action: "extend", expiresAt: fundedUntil(now, balanceAtomic - owed, lease.rateAtomicPerHour) };
  }
  if (lease.graceUntil === null) {
    const seconds = fundedSeconds(config.graceAtomic, lease.rateAtomicPerHour);
    // A free node never gets here (its window is Infinity); a rate so high that
    // the grace rounds to nothing gets no window rather than a zero-length one.
    if (seconds !== null && seconds > 0) return { action: "grace", graceUntil: now + seconds * 1000 };
    return { action: "close" };
  }
  // Grace already running: let it run out. Anything else here would re-grant it
  // every tick and the session would never end.
  return now >= lease.graceUntil ? { action: "close" } : { action: "wait" };
}
