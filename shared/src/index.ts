/**
 * @tendril/shared — types, contracts, and helpers shared across the registry,
 * the contributor agent, and the autonomous consumer agent.
 */

// ───────────────────────────── Domain models ─────────────────────────────

export type NodeStatus = "online" | "offline";

/** A compute node advertised by a contributor. */
export interface ComputeNode {
  id: string;
  /** Algorand address of the node owner (used for auth + display). */
  ownerAddr: string;
  /** Algorand address that receives USDC payouts for this node. */
  payToAddr: string;
  /**
   * True when `payToAddr` has not opted into the payment ASA, so on-chain
   * payouts for this node cannot land. The node still runs and still earns —
   * payouts are recorded unpaid until the address opts in.
   */
  payoutBlocked: boolean;
  label: string;
  cpuCores: number;
  ramMb: number;
  /** GPU model string, or null if none. */
  gpu: string | null;
  /** Advertised price per hour, in USD (industry-standard hourly billing). */
  pricePerHourUsd: number;
  status: NodeStatus;
  /** Unix ms of the last heartbeat. */
  lastHeartbeat: number;
  createdAt: number;
}

/** Public view of a node returned by GET /explorer (no internal fields). */
export type ExplorerNode = Pick<
  ComputeNode,
  | "id"
  | "ownerAddr"
  | "payToAddr"
  | "label"
  | "cpuCores"
  | "ramMb"
  | "gpu"
  | "pricePerHourUsd"
  | "status"
  | "payoutBlocked"
>;

export type LeaseStatus = "starting" | "active" | "ended" | "failed";

/** How a renter reaches a running sandbox. Currently SSH only. */
export interface SandboxAccess {
  kind: "ssh";
  /** Host to SSH to (e.g. a bore endpoint, or 127.0.0.1 in local mode). */
  host: string;
  port: number;
  username: string;
  /**
   * `"publickey"` when the renter supplied an `sshPubKey` — the only option
   * that works without a session, since there is no address to use as a
   * password. `"password"` is the signed-in web flow.
   */
  authMethod: "password" | "publickey";
  /** SSH password (the renter's address), or null under `"publickey"`. */
  password: string | null;
  /** Ready-to-copy connect command, e.g. "ssh root@bore.pub -p 12345". */
  command: string;
}

/**
 * A prepaid block of time on a node. The renter buys `paidSeconds` up front;
 * at lease end the unused remainder comes back as credit (see `proratedCost`).
 */
export interface Lease {
  id: string;
  nodeId: string;
  /** Algorand address of the renter (the sandbox user). */
  renterAddr: string;
  /**
   * Address the block was paid from and any refund goes back to — the sender
   * of the settled payment, or the session address when credit covered it all.
   */
  payerAddr: string;
  /** Algorand address the contributor is paid out to on lease end. */
  payToAddr: string;
  /** SSH access details, once the container is ready. */
  access: SandboxAccess | null;
  status: LeaseStatus;
  /** Billing rate snapshotted at lease start, in atomic units per hour. */
  rateAtomicPerHour: number;
  /** Seconds of runtime bought up front. */
  paidSeconds: number;
  /** Full prepaid price of the block, in atomic units. */
  quoteAtomic: number;
  /** Portion of `quoteAtomic` taken from existing credit rather than paid on-chain. */
  creditAppliedAtomic: number;
  /** Settled payment txid, or null when credit covered the whole quote. */
  paymentTxid: string | null;
  /** Unix ms the sandbox went active (start of the billable window). */
  startedAt: number;
  /** Unix ms the paid block runs out; the watchdog kills the sandbox here. */
  expiresAt: number;
  createdAt: number;
}

// ───────────────────────────── Credit ledger ─────────────────────────────
// Credit enters only two ways: POST /x402/topup, and the refund of unused time
// when a lease closes. It leaves only by paying for a lease. Top-ups and
// charges are both recorded so an address has a full history.

/** An address's credit balance. */
export interface Wallet {
  address: string;
  balanceAtomic: number;
  updatedAt: number;
}

/** A confirmed on-chain deposit that credited a wallet. */
export interface TopUp {
  txid: string;
  address: string;
  amountAtomic: number;
  createdAt: number;
}

/** A metered deduction from a wallet for compute usage (billed once, at end). */
export interface Charge {
  id: number;
  /** Renter address that was charged (the payer). */
  address: string;
  leaseId: string;
  /** Contributor / compute-owner address this usage was paid for. */
  payToAddr: string;
  amountAtomic: number;
  /** Seconds of usage this charge covers (the billed duration). */
  seconds: number;
  createdAt: number;
}

/** An on-chain payout to a contributor for compute they provided. */
export interface Payout {
  id: number;
  /** Contributor address that received the payout. */
  toAddr: string;
  leaseId: string;
  amountAtomic: number;
  /** On-chain transaction id of the payout, or null if it failed/skipped. */
  txid: string | null;
  createdAt: number;
}

/** Lifetime aggregates for an address (computed server-side, not capped). */
export interface WalletStats {
  /** Total ever spent on compute, in atomic units. */
  totalSpentAtomic: number;
  /** Total ever topped up, in atomic units. */
  totalToppedUpAtomic: number;
  /** Total billed compute time across all leases, in seconds. */
  totalLeaseSeconds: number;
  /** Number of leases that were billed. */
  leaseCount: number;
  /** Total earned as a contributor (payouts received), in atomic units. */
  totalEarnedAtomic: number;
  /** Number of payouts received as a contributor. */
  payoutCount: number;
}

/** Wallet + its deposit/spend history, contributor earnings, and lifetime stats. */
export interface WalletSummary {
  address: string;
  balanceAtomic: number;
  topups: TopUp[];
  charges: Charge[];
  /** Payouts received as a contributor (earnings history). */
  payouts: Payout[];
  stats: WalletStats;
}

export interface Job {
  id: string;
  leaseId: string;
  /** Code/script to execute inside the sandbox. */
  payload: string;
  result: string | null;
  status: "pending" | "running" | "done" | "error";
}

// ───────────────────────── Platform metrics (GET /metrics) ─────────────────────────

/** One point of a cumulative daily growth series. */
export interface MetricPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

/** One leaderboard row: an address and its ranked value (units are per-board). */
export interface RankRow {
  address: string;
  value: number; // atomic units, or seconds, or a count — depends on the board
}

export interface Metrics {
  usersOverTime: MetricPoint[];
  activeOverTime: MetricPoint[];
  totalUsers: number;
  totalActive: number;
  /** Renter leaderboards. topup=atomic units, leaseTime=seconds, leaseSpan=lease count. */
  topUsers: { topup: RankRow[]; leaseTime: RankRow[]; leaseSpan: RankRow[] };
  /** Contributor leaderboards. timeServed=seconds, timesServed=lease count. */
  topContributors: { timeServed: RankRow[]; timesServed: RankRow[] };
}

// ───────────────────────── WebSocket contract ─────────────────────────
// The contributor agent connects to the registry over socket.io. These are
// the message names + payloads exchanged on that channel.

/** Resource caps the registry asks the agent to enforce on a container. */
export interface SandboxLimits {
  memory: string; // e.g. "2g"
  cpus: number;
  gpus: string; // "all" or "" (none)
}

/**
 * agent -> registry: authenticate the socket, registering (or re-attaching to)
 * a node. Carries the node's advertised specs so registration + auth happen in
 * one signed message.
 */
export interface AgentHelloMsg {
  /** Existing node id to re-attach to, or omit/empty to create a new one. */
  nodeId?: string;
  ownerAddr: string;
  /** Base64 algosdk.signBytes signature over `nonce`, proving ownership of ownerAddr. */
  signature: string;
  nonce: string;
  /** Advertised node specs. */
  spec: RegisterNodeRequest;
}

/** registry -> agent: hello accepted; the canonical node id to use henceforth. */
export interface HelloAckMsg {
  nodeId: string;
}

/** agent -> registry: periodic liveness ping. */
export interface HeartbeatMsg {
  nodeId: string;
}

/** registry -> agent: spin up a sandbox for a paid lease. */
export interface StartContainerMsg {
  leaseId: string;
  image: string;
  limits: SandboxLimits;
  /** SSH password to set inside the sandbox (the renter's address), or null. */
  sshPassword: string | null;
  /**
   * OpenSSH public key to write to the sandbox's `authorized_keys`. Takes
   * precedence over `sshPassword` and is the only option that works for a
   * renter with no session (nothing to use as a password).
   */
  sshPubKey: string | null;
}

/** agent -> registry: the sandbox is up and reachable for SSH at host:port. */
export interface ContainerReadyMsg {
  leaseId: string;
  /** SSH host (bore endpoint, or 127.0.0.1 in local mode). */
  host: string;
  /** SSH port. */
  port: number;
}

/** agent -> registry: the sandbox failed to start. */
export interface ContainerFailedMsg {
  leaseId: string;
  error: string;
}

/** registry -> agent: tear down the sandbox for a lease. */
export interface DestroyContainerMsg {
  leaseId: string;
}

/** registry -> agent: run a job inside an existing lease's sandbox. */
export interface RunJobMsg {
  leaseId: string;
  jobId: string;
  payload: string;
}

/** agent -> registry: job finished (or errored). */
export interface JobResultMsg {
  jobId: string;
  ok: boolean;
  result: string;
}

/** Socket.io event names, centralized to avoid typos across processes. */
export const WS = {
  hello: "hello",
  helloAck: "hello-ack",
  heartbeat: "heartbeat",
  startContainer: "start-container",
  containerReady: "container-ready",
  containerFailed: "container-failed",
  destroyContainer: "destroy-container",
  runJob: "run-job",
  jobResult: "job-result",
} as const;

// ───────────────────────────── HTTP DTOs ─────────────────────────────

export interface RegisterNodeRequest {
  ownerAddr: string;
  payToAddr: string;
  label: string;
  cpuCores: number;
  ramMb: number;
  gpu: string | null;
  pricePerHourUsd: number;
}

export interface RunRequest {
  payload: string;
}

export interface RunResponse {
  jobId: string;
  ok: boolean;
  result: string;
}

// ───────────────────────── Wallet auth DTOs ─────────────────────────
// Signing in proves address control so an existing credit balance can be read
// and spent. It is NOT how money gets in — that is x402 only (see below).

/** GET /auth/nonce → a short-lived challenge to sign for wallet login. */
export interface WalletNonceResponse {
  nonce: string;
}

/** POST /auth/login → prove address control with a signed 0-ALGO self-txn. */
export interface WalletLoginRequest {
  address: string;
  /** Base64 signed `pay` txn (0 ALGO, self→self, note = nonce). */
  payment: string;
  nonce: string;
}

/** POST /auth/login response: a session token + the current balance. */
export interface WalletLoginResponse {
  token: string;
  address: string;
  balanceAtomic: number;
}

/** What the platform charges in, and where (GET /platform). */
export interface PlatformInfo {
  /** Algorand address that receives x402 payments. */
  payTo: string;
  /** CAIP-2 network id (see ALGORAND_TESTNET_CAIP2). */
  network: string;
  /** The ASA every price is denominated in. */
  asset: AssetInfo;
  /** Facilitator that verifies + settles payments (and sponsors the fee). */
  facilitatorUrl: string;
  /** Top-up bounds, in atomic units, enforced by POST /x402/topup. */
  minTopUpAtomic: number;
  maxTopUpAtomic: number;
}

// ───────────────────────── x402 endpoint DTOs ─────────────────────────
// The only two ways money enters Tendril. Both speak x402 V2 / `exact` / AVM:
// an unpaid request gets HTTP 402 + `PaymentRequired`, the client builds and
// signs the payment group and retries with `PAYMENT-SIGNATURE`. The browser
// and a headless agent run the same code path.

/** The ASA an amount is denominated in. */
export interface AssetInfo {
  /** ASA id as a string, e.g. "10458941" (testnet USDC). */
  id: string;
  decimals: number;
  symbol: string;
}

/** Settled-payment receipt echoed in successful x402 responses. */
export interface PaymentReceipt {
  txid: string;
  /** CAIP-2 network the payment settled on. */
  network: string;
}

/** POST /x402/topup?amount=<atomic> → credit the *paying* address. */
export interface X402TopUpResponse {
  /** The payer, taken from the settled transaction — never from the request. */
  address: string;
  /** Atomic units credited by this payment (string: amounts cross the wire as strings). */
  credited: string;
  /** The address's credit balance after crediting. */
  balance: string;
  asset: AssetInfo;
  payment: PaymentReceipt;
}

/** What a lease cost and how it was paid for. */
export interface LeaseBilling {
  /** Full prepaid price of the block. */
  quoteAtomic: string;
  /** Portion covered by existing credit. */
  creditApplied: string;
  /** Portion paid on-chain now (`quote - creditApplied`). */
  paidAtomic: string;
  asset: AssetInfo;
}

/** POST /x402/rent/:nodeId?seconds=<n> → a running, prepaid sandbox. */
export interface X402RentResponse {
  leaseId: string;
  /** Opaque bearer token required by /run, /release and /extend. */
  leaseToken: string;
  node: {
    id: string;
    cpu: number;
    memoryGb: number;
    gpu: string | null;
    pricePerHourUsd: number;
  };
  ssh: SandboxAccess;
  paidSeconds: number;
  /** ISO 8601. */
  startedAt: string;
  /** ISO 8601 — when the watchdog kills the sandbox unless extended. */
  paidUntil: string;
  billing: LeaseBilling;
  /** Absent when the whole quote was covered by credit (no on-chain payment). */
  payment: PaymentReceipt | null;
}

/** DELETE /x402/leases/:leaseId → early close, unused time refunded as credit. */
export interface LeaseCloseResponse {
  leaseId: string;
  usedSeconds: number;
  /** Atomic units actually consumed. */
  usedAtomic: string;
  /** Atomic units returned to the payer's credit balance. */
  refundedAtomic: string;
  /** The payer's credit balance after the refund. */
  balance: string;
  asset: AssetInfo;
}

// ───────────────────────── Money (USDC atomic units) ─────────────────────────
// Every amount in Tendril is an integer count of USDC atomic units (6 decimals).
// USD prices convert with a fixed 1e6 — USDC is a dollar, so there is no
// exchange rate to set anywhere and nothing to keep up to date.

/** USDC has 6 decimals: 1 USDC = 1_000_000 atomic units. */
export const USDC_DECIMALS = 6;
export const USDC_UNIT = 1_000_000;

/** Convert a USD amount to USDC atomic units. */
export function usdToAtomic(usdAmount: number): number {
  return Math.round(usdAmount * USDC_UNIT);
}

/** A node's per-hour rate in USDC atomic units. */
export function atomicPerHour(pricePerHourUsd: number): number {
  return usdToAtomic(pricePerHourUsd);
}

/**
 * Prorated cost for `seconds` at a per-hour rate, rounded **up**.
 * Always rounding up keeps the platform from ever undercharging by a
 * sub-unit, and keeps `quote - used` a non-negative refund.
 */
export function proratedCost(rateAtomicPerHour: number, seconds: number): number {
  return Math.ceil((seconds / 3600) * rateAtomicPerHour);
}

/**
 * How much of an address's credit may be applied to a quote.
 *
 * With a session the answer is "all of it" — the token proves the address.
 * Without one, the payer is only a hint on the URL, so the discount is clamped
 * to leave at least `minPayableAtomic` to pay on-chain: settling that payment
 * from the hinted address is what proves control of it. Drop the floor and
 * `?payer=<victim>` becomes a way to spend a stranger's balance for free.
 */
export function applicableCredit(
  quoteAtomic: number,
  creditAtomic: number,
  opts: { authenticated: boolean; minPayableAtomic: number },
): number {
  const ceiling = opts.authenticated
    ? quoteAtomic
    : Math.max(0, quoteAtomic - opts.minPayableAtomic);
  return Math.max(0, Math.min(creditAtomic, ceiling));
}

/** Full USDC precision, e.g. 100000 -> "0.100000 USDC". Ledgers and tooltips. */
export function formatUsdcExact(atomic: number): string {
  return `${(atomic / USDC_UNIT).toFixed(USDC_DECIMALS)} USDC`;
}

/**
 * Compact display: 60000000 -> "60 USDC", 10384700 -> "10.38 USDC".
 * Sub-1 amounts keep 4dp — a prorated charge of 0.0042 must not read "0.00".
 * Use `formatUsdcExact` where the exact figure matters (ledger rows, tooltips).
 */
export function formatUsdc(atomic: number): string {
  const usdc = atomic / USDC_UNIT;
  const fixed = Math.abs(usdc) < 1 ? usdc.toFixed(4) : usdc.toFixed(2);
  const trimmed = fixed.replace(/\.?0+$/, "");
  // A few atomic units still round to "0" at 4dp — never print a real amount as zero.
  if (trimmed === "0" && atomic !== 0) return `${atomic < 0 ? "-" : ""}<0.0001 USDC`;
  return `${trimmed} USDC`;
}

/** A node is online if it has beat within the timeout window. */
export function isOnline(lastHeartbeat: number, timeoutMs: number, now = Date.now()): boolean {
  return now - lastHeartbeat <= timeoutMs;
}

/** Algorand testnet CAIP-2 network identifier. */
export const ALGORAND_TESTNET_CAIP2 = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
