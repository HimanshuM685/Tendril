import { nanoid } from "nanoid";
import type { ComputeProvider, Lease, LeaseStatus, RunArtifact, SandboxAccess } from "@tendril/shared";
import { fundedSeconds, proratedCost, JOB_RESULT_MAX_BYTES } from "@tendril/shared";
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
const closing = new Map<string, Promise<LeaseSettlement | null>>();
const settlements = new Map<string, LeaseSettlement>();
const abandoned = new Set<string>();
const cleaned = new Set<string>();
const funded = new Set<string>();

export function confirmLeasePayment(id: string): void {
  const lease = leases.get(id);
  // Runs settle before (one-shot) or after (rent) the sandbox comes up.
  if (!lease || (lease.status !== "starting" && lease.status !== "active")) throw new Error("lease stopped during settlement");
  funded.add(id);
}

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
  payoutBlocked?: boolean;
  capabilities?: Lease["capabilities"];
}

export function createLease(args: NewLease): Lease {
  const now = Date.now();
  const lease: Lease = {
    id: nanoid(12),
    access: null,
    status: "starting",
    startedAt: 0,
    endedAt: null,
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

export function hasLivePayerLease(address: string): boolean {
  return [...leases.values()].some((l) => l.payerAddr === address && (l.status === "starting" || l.status === "active"));
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
  abandoned.add(id);
  await closeLease(id, "abandoned");
}

/**
 * Fail a lease whose gate fee already settled — an async job (notebook run)
 * whose provisioning blew up. Unlike `abandonLease`, the record is kept: a
 * caller is polling this id for status and must still find it afterward.
 */
export async function failLease(id: string): Promise<void> {
  // Same path as any close: the node stays reserved (`stopping`) until the
  // guest acknowledges teardown, then the lease ends `failed`. It never became
  // active (startedAt 0), so no usage is charged.
  await closeLease(id, "provisioning-failed");
}

/** What an async run job (notebook path of `POST /x402/run`) finished with. */
export interface RunJobResult {
  ok: boolean;
  result: string;
  notebook?: Record<string, unknown>;
  artifacts?: RunArtifact[];
  execution?: { nodeId: string; seconds: number; costAtomic: string; balance: string };
  error?: string;
}

// Keyed by lease id (the job id). In-memory like leases themselves — see the
// module doc comment; a job in flight when the backend restarts is lost, same
// as a lease would be.
const RUN_RESULT_TTL_MS = 60 * 60_000;
const RUN_RESULT_CACHE_BYTES = 64_000_000;
const runResults = new Map<string, { result: RunJobResult; bytes: number; storedAt: number }>();
let runResultBytes = 0;

function removeRunResult(id: string): void {
  const entry = runResults.get(id);
  if (!entry) return;
  runResultBytes -= entry.bytes;
  runResults.delete(id);
  const lease = leases.get(id);
  if (lease?.status === "ended" || lease?.status === "failed") leases.delete(id);
}

function pruneRunResults(): void {
  const expiredBefore = Date.now() - RUN_RESULT_TTL_MS;
  for (const [id, entry] of runResults) {
    if (entry.storedAt <= expiredBefore) removeRunResult(id);
  }
  while (runResults.size > 32 || runResultBytes > RUN_RESULT_CACHE_BYTES) {
    removeRunResult(runResults.keys().next().value!);
  }
}

export function setRunResult(leaseId: string, result: RunJobResult): void {
  let bytes = Buffer.byteLength(JSON.stringify(result));
  if (bytes > JOB_RESULT_MAX_BYTES) {
    result = { ok: false, result: "Notebook result exceeded transport limit.", error: "Notebook result exceeded transport limit.", execution: result.execution };
    bytes = Buffer.byteLength(JSON.stringify(result));
  }
  const previous = runResults.get(leaseId);
  if (previous) runResultBytes -= previous.bytes;
  runResults.delete(leaseId);
  runResults.set(leaseId, { result, bytes, storedAt: Date.now() });
  runResultBytes += bytes;
  pruneRunResults();
}

export function getRunResult(leaseId: string): RunJobResult | undefined {
  pruneRunResults();
  return runResults.get(leaseId)?.result;
}

/**
 * Mark a lease active now that its sandbox is up. This starts the paid window:
 * `expiresAt` is set from here, so a slow container start doesn't eat time the
 * renter paid for.
 */
export function activateLease(id: string, access: SandboxAccess | null): boolean {
  const lease = leases.get(id);
  if (!lease || (lease.status !== "starting" && lease.status !== "active")) return false;
  if (lease.status === "active") return true;
  lease.access = access;
  lease.status = "active";
  // The meter starts when the sandbox is actually reachable, so a slow container
  // start is never billed and never eats the renter's funded window.
  lease.startedAt = Date.now();
  lease.expiresAt = fundedUntil(lease.startedAt, lease.fundingAtomic, lease.rateAtomicPerHour);
  return true;
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
  return leasesForNode(nodeId).some((l) => l.status === "starting" || l.status === "active" || l.status === "stopping");
}

/**
 * The lease currently occupying a node, if any. A starting lease counts: the
 * container is reserved even before SSH is known.
 */
export function heldLease(nodeId: string): Lease | undefined {
  return leasesForNode(nodeId).find((l) => l.status === "starting" || l.status === "active" || l.status === "stopping");
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
export function closeLease(
  leaseId: string,
  reason: string,
): Promise<LeaseSettlement | null> {
  const lease = leases.get(leaseId);
  if (!lease) return Promise.resolve(null);
  if (settlements.has(leaseId)) return Promise.resolve(settlements.get(leaseId)!);
  const pending = closing.get(leaseId);
  if (pending) return pending;
  if (lease.status === "ended" || lease.status === "failed") return Promise.resolve(null);
  lease.endedAt ??= Date.now();
  lease.status = "stopping";
  const task = Promise.resolve().then(async () => {
    if (!cleaned.has(leaseId)) {
      await leaseEffects.destroy(lease);
      cleaned.add(leaseId);
    }
    if (abandoned.has(leaseId) || lease.startedAt === 0 || !funded.has(leaseId)) {
      lease.status = "failed";
      return null;
    }
    const usedSeconds = Math.max(0, Math.round((lease.endedAt! - lease.startedAt) / 1000));
    const usedAtomic = proratedCost(lease.rateAtomicPerHour, usedSeconds);
    const { charged, balance } = await leaseEffects.charge({
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
    if (charged > 0 && earnsPayout(lease.provider) && !lease.payoutBlocked) await leaseEffects.payout(lease, charged);
    const result = { usedSeconds, usedAtomic, chargedAtomic: charged, balance };
    settlements.set(leaseId, result);
    lease.status = "ended";
    return result;
  }).finally(() => closing.delete(leaseId));
  closing.set(leaseId, task);
  return task;
}

/** Narrow effect seam used by lifecycle tests; production still uses the ledger. */
export const leaseEffects = { destroy: destroyForLease, charge: chargeUsage, payout: payoutContributor };

/** Contributor leases credit earnings. Hosted Modal leases do not. */
export function earnsPayout(provider: ComputeProvider): boolean {
  return provider === "contributor";
}

/**
 * Credit the contributor their share of what was collected.
 *
 * Nothing goes on-chain per lease. A minute of compute is worth fractions of a
 * cent, and one ASA transfer per lease would spend more in fees and attention
 * than it moves — so the share accrues to a withdrawable balance the contributor
 * cashes out in one transfer (see `POST /withdraw`). A payoutBlocked lease
 * retains its renter charge but skips this earnings credit.
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
  return setInterval(() => void watchdogTick().catch((err) => console.error("[watchdog] close pending:", (err as Error).message)), intervalMs);
}

async function watchdogTick(): Promise<void> {
  pruneRunResults();
  const now = Date.now();
  for (const lease of leases.values()) {
    if (lease.status === "stopping") {
      await closeLease(lease.id, "cleanup-retry").catch(() => undefined);
      continue;
    }
    if (lease.status !== "active") continue;
    if (lease.allowOverdraft || !funded.has(lease.id)) continue;
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
