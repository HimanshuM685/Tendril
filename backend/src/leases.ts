import { nanoid } from "nanoid";
import type { Lease, LeaseStatus, SandboxAccess } from "@tendril/shared";
import { proratedCost } from "@tendril/shared";
import { recordPayout } from "./db.js";
import { refundUnused } from "./x402/credit.js";
import { payContributor, payoutsEnabled } from "./payout.js";
import { getNode } from "./registry.js";
import { destroyContainer } from "./ws.js";
import { config } from "./config.js";

/**
 * In-memory lease store. Leases track a live sandbox session; like nodes, they
 * don't survive a restart (the sockets they depend on don't either), so they
 * stay in memory and never touch the DB on the hot path.
 *
 * A lease is a *prepaid block*: the renter buys `paidSeconds` up front, and the
 * time they don't use comes back as credit when the lease closes.
 */
const leases = new Map<string, Lease>();

export interface NewLease {
  nodeId: string;
  renterAddr: string;
  payerAddr: string;
  payToAddr: string;
  rateAtomicPerHour: number;
  paidSeconds: number;
  quoteAtomic: number;
  creditAppliedAtomic: number;
  paymentTxid: string | null;
}

export function createLease(args: NewLease): Lease {
  const now = Date.now();
  const lease: Lease = {
    id: nanoid(12),
    access: null,
    status: "starting",
    startedAt: 0,
    // Real window opens at activation; until then it is the worst case.
    expiresAt: now + args.paidSeconds * 1000,
    createdAt: now,
    ...args,
  };
  leases.set(lease.id, lease);
  return lease;
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
  lease.startedAt = Date.now();
  lease.expiresAt = lease.startedAt + lease.paidSeconds * 1000;
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

/** What a closed lease actually consumed, and what came back to the payer. */
export interface LeaseSettlement {
  usedSeconds: number;
  usedAtomic: number;
  refundAtomic: number;
  balance: number;
}

/**
 * Close a lease exactly once and settle the prepaid block. Idempotent: flips
 * status synchronously before the async work so a concurrent release and
 * watchdog tick can't settle twice.
 *
 *   usedSeconds  = min(elapsed, paidSeconds)      -- never bill past the block
 *   usedAtomic   = prorated cost of usedSeconds
 *   refund       = quote - usedAtomic             -> back to the payer's credit
 *   payout       = usedAtomic minus the platform fee -> contributor, on-chain
 *
 * The sandbox is always torn down, even if the money side throws.
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

  const elapsed = wasActive ? Math.max(0, Math.round((Date.now() - lease.startedAt) / 1000)) : 0;
  const usedSeconds = Math.min(elapsed, lease.paidSeconds);
  const usedAtomic = Math.min(lease.quoteAtomic, proratedCost(lease.rateAtomicPerHour, usedSeconds));
  const refundAtomic = lease.quoteAtomic - usedAtomic;

  try {
    const balance = await refundUnused({
      address: lease.payerAddr,
      leaseId: lease.id,
      usedAtomic,
      usedSeconds,
      refundAtomic,
    });
    console.log(
      `[bill] lease ${lease.id} (${reason}): used ${usedSeconds}/${lease.paidSeconds}s ` +
        `= ${usedAtomic}, refunded ${refundAtomic} to ${lease.payerAddr}`,
    );
    if (usedAtomic > 0) await payoutContributor(lease, usedAtomic);
    return { usedSeconds, usedAtomic, refundAtomic, balance };
  } catch (err) {
    console.error(`[bill] failed to settle lease ${lease.id}:`, (err as Error).message);
    return null;
  }
}

/** Pay the contributor their share of the used time on-chain; record it either way. */
async function payoutContributor(lease: Lease, usedAtomic: number): Promise<void> {
  const fee = Math.floor((usedAtomic * config.platformFeePct) / 100);
  const contributorCut = usedAtomic - fee;
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
 * The watchdog — enforcement half of prepaid billing. It does not bill per tick;
 * it ends leases whose paid block has run out. No DB writes per tick.
 */
export function startWatchdog(intervalMs = config.meterIntervalMs): NodeJS.Timeout {
  return setInterval(() => void watchdogTick(), intervalMs);
}

async function watchdogTick(): Promise<void> {
  const now = Date.now();
  for (const lease of leases.values()) {
    if (lease.status !== "active") continue;
    if (now >= lease.expiresAt) {
      console.log(`[watchdog] paid time used up — ending lease ${lease.id}`);
      await closeLease(lease.id, "expired");
    }
  }
}
