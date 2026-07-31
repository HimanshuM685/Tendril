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
  /** Algorand address that receives ALGO payments for this node. */
  payToAddr: string;
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
>;

export type LeaseStatus = "starting" | "active" | "ended" | "failed";

/** How a renter reaches a running sandbox. Currently SSH only. */
export interface SandboxAccess {
  kind: "ssh";
  /** Host to SSH to (e.g. a bore endpoint, or 127.0.0.1 in local mode). */
  host: string;
  port: number;
  username: string;
  /** SSH password — set to the renter's own Algorand address. */
  password: string;
  /** Ready-to-copy connect command, e.g. "ssh root@bore.pub -p 12345". */
  command: string;
}

/** A metered session on a node, billed from the renter's prepaid wallet. */
export interface Lease {
  id: string;
  nodeId: string;
  /** Algorand address of the renter (whose wallet balance is billed). */
  renterAddr: string;
  /** Algorand address the contributor is paid out to on lease end. */
  payToAddr: string;
  /** SSH access details, once the container is ready. */
  access: SandboxAccess | null;
  status: LeaseStatus;
  /** Billing rate snapshotted at lease start, in microALGO per hour. */
  rateMicroAlgosPerHour: number;
  /** Unix ms the sandbox went active (start of the billable window). */
  startedAt: number;
  /**
   * Projected Unix ms when the wallet runs dry at the current rate, computed
   * once at lease start from the affordable time. The lease ends when the
   * balance is used up; usage is billed once, at the end. Used by the UI to
   * show "time left".
   */
  expiresAt: number;
  createdAt: number;
}

// ───────────────────────────── Prepaid wallet ─────────────────────────────
// Users top up a custodial ALGO balance once, then renting a node meters time
// and debits that balance. Top-ups (deposits) and charges (metered usage) are
// both recorded so the user has a full history.

/** A user's prepaid balance, keyed by their Algorand address. */
export interface Wallet {
  address: string;
  balanceMicroAlgos: number;
  updatedAt: number;
}

/** A confirmed on-chain deposit that credited a wallet. */
export interface TopUp {
  txid: string;
  address: string;
  amountMicroAlgos: number;
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
  amountMicroAlgos: number;
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
  amountMicroAlgos: number;
  /** On-chain transaction id of the payout, or null if it failed/skipped. */
  txid: string | null;
  createdAt: number;
}

/** Lifetime aggregates for an address (computed server-side, not capped). */
export interface WalletStats {
  /** Total ALGO ever spent on compute. */
  totalSpentMicroAlgos: number;
  /** Total ALGO ever deposited. */
  totalToppedUpMicroAlgos: number;
  /** Total billed compute time across all leases, in seconds. */
  totalLeaseSeconds: number;
  /** Number of leases that were billed. */
  leaseCount: number;
  /** Total ALGO earned as a contributor (payouts received). */
  totalEarnedMicroAlgos: number;
  /** Number of payouts received as a contributor. */
  payoutCount: number;
}

/** Wallet + its deposit/spend history, contributor earnings, and lifetime stats. */
export interface WalletSummary {
  address: string;
  balanceMicroAlgos: number;
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
  value: number; // microALGO, or seconds, or a count — depends on the board
}

export interface Metrics {
  usersOverTime: MetricPoint[];
  activeOverTime: MetricPoint[];
  totalUsers: number;
  totalActive: number;
  /** Renter leaderboards. topup=microALGO, leaseTime=seconds, leaseSpan=lease count. */
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
  /** SSH password to set inside the sandbox (the renter's address). */
  sshPassword: string;
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

/** POST /rent/:nodeId response: SSH access + the hourly rate + lease token. */
export interface RentResponse {
  leaseId: string;
  access: SandboxAccess;
  expiresAt: number;
  rateMicroAlgosPerHour: number;
  leaseToken: string;
}

export interface RunRequest {
  payload: string;
}

export interface RunResponse {
  jobId: string;
  ok: boolean;
  result: string;
}

// ───────────────────────── Wallet auth + top-up DTOs ─────────────────────────
// Native ALGO. The user proves control of their address by signing a login
// challenge, then tops up a custodial balance over x402: POST /wallet/topup
// answers HTTP 402 with a challenge, the client signs a `pay` txn to the
// platform address and retries with `X-PAYMENT`. Both use the wallet's existing
// signTransactions — no ASA, no opt-in, no facilitator.

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
  balanceMicroAlgos: number;
}

/** The platform address top-ups are sent to (GET /platform). */
export interface PlatformInfo {
  /** Algorand address that receives custodial top-ups. */
  payTo: string;
  /** CAIP-2 network id (see ALGORAND_TESTNET_CAIP2). */
  network: string;
  /** USD per 1 ALGO, for showing prices in ALGO. */
  algoUsdPrice: number;
}

/**
 * POST /wallet/topup, step 1 → ask for a challenge for `amountMicroAlgos`.
 * Answered with HTTP 402 + a `PaymentRequired` challenge.
 */
export interface TopUpRequest {
  amountMicroAlgos: number;
}

/** One way to pay a 402 challenge. Tendril only offers native ALGO. */
export interface PaymentOption {
  scheme: "exact";
  /** CAIP-2 network id (see ALGORAND_TESTNET_CAIP2). */
  network: string;
  /** Algorand address the payment must go to. */
  payTo: string;
  /** Amount in microALGO, as a string (x402 sends amounts as strings). */
  amount: string;
  /** Native ALGO — no ASA, no opt-in. */
  asset: "ALGO";
  description: string;
  maxTimeoutSeconds: number;
}

/** Body (and base64 `PAYMENT-REQUIRED` header) of an HTTP 402 response. */
export interface PaymentRequired {
  x402Version: 2;
  error: string;
  accepts: PaymentOption[];
}

/**
 * POST /wallet/topup, step 2 → retry with header
 * `X-PAYMENT: <base64 signed pay txn>` matching the challenge. On success the
 * deposit is confirmed on-chain and credited (idempotently, keyed by txid).
 */
export interface TopUpResponse {
  txid: string;
  balanceMicroAlgos: number;
}

/** Convert a USD amount to microALGO at `algoUsdPrice` (USD per 1 ALGO). */
export function usdToMicroAlgos(usdAmount: number, algoUsdPrice: number): number {
  return Math.round((usdAmount / algoUsdPrice) * 1e6);
}

/** A node's per-hour rate in microALGO (its USD price converted at `algoUsdPrice`). */
export function microAlgosPerHour(pricePerHourUsd: number, algoUsdPrice: number): number {
  return usdToMicroAlgos(pricePerHourUsd, algoUsdPrice);
}

/** Prorated cost in microALGO for `seconds` of usage at a per-hour rate. */
export function proratedCost(rateMicroAlgosPerHour: number, seconds: number): number {
  return Math.round((seconds / 3600) * rateMicroAlgosPerHour);
}

/** Format microALGO for display, e.g. 100000 -> "0.1000 ALGO". */
export function formatAlgo(microAlgos: number): string {
  return `${(microAlgos / 1e6).toFixed(4)} ALGO`;
}

/** A node is online if it has beat within the timeout window. */
export function isOnline(lastHeartbeat: number, timeoutMs: number, now = Date.now()): boolean {
  return now - lastHeartbeat <= timeoutMs;
}

/** Algorand testnet CAIP-2 network identifier. */
export const ALGORAND_TESTNET_CAIP2 = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
