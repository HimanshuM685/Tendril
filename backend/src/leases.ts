import { nanoid } from "nanoid";
import type { ComputeProvider, Lease, LeaseStatus, SandboxAccess } from "@tendril/shared";
import { fundedSeconds, proratedCost } from "@tendril/shared";
import { chargeUsage, creditBalance, creditEarnings } from "./x402/credit.js";
import { destroyForLease } from "./providers/index.js";
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
  provider: ComputeProvider;
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
export async function abandonLease(id: string): Promise<void> {
  const lease = leases.get(id);
  if (!lease) return;
  leases.delete(id);
  await destroyForLease(lease);
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
 * Sessions whose meter is running right now, for the platform metrics series.
 * A charge row is only written at close, so these are invisible to the DB —
 * without them the active-users chart flatlines while the platform is busy.
 * "starting" leases are excluded: their sandbox isn't up, so `startedAt` is 0.
 */
export function liveSessions(): { address: string; start: number; end: null }[] {
  return [...leases.values()]
    .filter((l) => l.status === "active" && l.startedAt > 0)
    .map((l) => ({ address: l.renterAddr, start: l.startedAt, end: null }));
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

/**
 * The lease currently occupying a node, if any. A starting lease counts: the
 * container is reserved even before SSH is known.
 */
export function heldLease(nodeId: string): Lease | undefined {
  return leasesForNode(nodeId).find((l) => l.status === "starting" || l.status === "active");
}

/** Live session opened by this gate-fee payment, if it is still up. */
export function leaseByPayment(txid: string): Lease | undefined {
  return [...leases.values()].find(
    (l) =>
      l.paymentTxid === txid &&
      (l.status === "starting" || l.status === "active") &&
      !l.allowOverdraft,
  );
}

/**
 * Wait until a lease has access details, or until it ends / times out.
 * Used when a second rent hits a session that is still booting, so the caller
 * gets the SSH (or Jupyter) details instead of a bare conflict.
 */
export function waitForLeaseAccess(id: string, timeoutMs: number): Promise<SandboxAccess | null> {
  const current = getLease(id);
  if (!current) return Promise.resolve(null);
  if (current.access && current.status === "active") return Promise.resolve(current.access);

  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const lease = getLease(id);
      if (lease?.access && lease.status === "active") {
        clearInterval(timer);
        resolve(lease.access);
        return;
      }
      const dead = !lease || lease.status === "ended" || lease.status === "failed";
      if (dead || Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, 250);
  });
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
 *   payout      = charged minus the platform fee -> contributor's earnings balance
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

  try {
    await destroyForLease(lease);
  } catch (err) {
    console.error(`[sandbox] teardown ${lease.id} failed:`, (err as Error).message);
  }

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
    // Modal compute is platform inventory. The charge stays; no payout row.
    if (charged > 0 && earnsPayout(lease.provider)) await payoutContributor(lease, charged);
    return { usedSeconds, usedAtomic, chargedAtomic: charged, balance };
  } catch (err) {
    console.error(`[bill] failed to bill lease ${lease.id}:`, (err as Error).message);
    return null;
  }
}

/** Contributor leases credit earnings. Hosted Modal leases do not. */
export function earnsPayout(provider: ComputeProvider): boolean {
  return provider !== "modal";
}

/**
 * Credit the contributor their share of what was collected.
 *
 * Nothing goes on-chain per lease. A minute of compute is worth fractions of a
 * cent, and one ASA transfer per lease would spend more in fees and attention
 * than it moves — so the share accrues to a withdrawable balance the contributor
 * cashes out in one transfer (see `POST /withdraw`). That also means an
 * unopted-in address can still earn: the opt-in is only needed to withdraw.
 */
async function payoutContributor(lease: Lease, chargedAtomic: number): Promise<void> {
  const fee = Math.floor((chargedAtomic * config.platformFeePct) / 100);
  const contributorCut = chargedAtomic - fee;
  if (contributorCut <= 0) return;

  const balance = await creditEarnings(lease.payToAddr, lease.id, contributorCut);
  console.log(
    `[earn] +${contributorCut} to ${lease.payToAddr} (fee ${fee}, balance ${balance})`,
  );
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
