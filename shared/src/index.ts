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
 * An open-ended metered session on a node.
 *
 * Renting costs a small on-chain gate fee and nothing else up front. The clock
 * then simply runs: usage accrues second by second and is charged **once**, at
 * the end, from the renter's credit. Nobody picks a duration, so nobody gets
 * disconnected at the end of a block they guessed wrong.
 *
 * `expiresAt` is the only limit, and it is not a policy — it is the moment the
 * renter's credit can no longer pay for the next second.
 */
export interface Lease {
  id: string;
  nodeId: string;
  /** Algorand address of the renter (the sandbox user). */
  renterAddr: string;
  /**
   * Address billed for the time used — the sender of the settled gate-fee
   * payment, which is the only identity we trust for this.
   */
  payerAddr: string;
  /** Algorand address the contributor is paid out to on lease end. */
  payToAddr: string;
  /** SSH access details, once the container is ready. */
  access: SandboxAccess | null;
  status: LeaseStatus;
  /** Billing rate snapshotted at lease start, in atomic units per hour. */
  rateAtomicPerHour: number;
  /** The on-chain gate fee paid to open this lease. Not refundable, not usage. */
  gateFeeAtomic: number;
  /** Credit the payer held at lease start — what `expiresAt` was computed from. */
  fundingAtomic: number;
  /** Settled gate-fee txid. */
  paymentTxid: string | null;
  /** Unix ms the sandbox went active (start of the billable window). */
  startedAt: number;
  /**
   * Unix ms the renter's credit runs dry at `rateAtomicPerHour`, projected at
   * lease start. The watchdog stops the sandbox here so usage can never exceed
   * what the credit can pay for.
   */
  expiresAt: number;
  /**
   * Unix ms the sandbox is actually torn down, once credit has run out.
   *
   * Hitting `expiresAt` does not kill the session outright — the renter gets a
   * short grace window (`GRACE_ATOMIC` worth of runtime at their own rate) to
   * save their work first. `null` while the lease is still funded; top up
   * during the window and it clears and the session carries on.
   */
  graceUntil: number | null;
  /**
   * Whether billing this lease may take the payer's balance below zero.
   *
   * `false` (the default, and every SSH session): the charge is clamped to the
   * balance, so watchdog-tick overrun and the grace window come out of the
   * platform, not the renter.
   *
   * `true` (a one-shot `/x402/run`): the job is never killed part-way to protect
   * a balance, so it can finish owing more than was there. The debt is real and
   * blocks renting until it is cleared.
   */
  allowOverdraft: boolean;
  createdAt: number;
}

// ───────────────────────────── Credit ledger ─────────────────────────────
// Credit enters one way: POST /topup. It leaves one way: a closed lease is
// billed for the seconds it actually ran. Both are recorded so an address has a
// full history. The on-chain gate fee never touches this ledger.

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

/**
 * One lease's earnings for a contributor, after the platform fee.
 *
 * Nothing is sent on-chain per lease — the amount is added to the contributor's
 * withdrawable earnings balance, and `txid` is therefore always null here. The
 * on-chain movement happens once, at withdrawal (see `Withdrawal`).
 */
export interface Payout {
  id: number;
  /** Contributor address that earned it. */
  toAddr: string;
  leaseId: string;
  amountAtomic: number;
  /** Always null: per-lease earnings are credited, not sent. */
  txid: string | null;
  createdAt: number;
}

/** A contributor cashing their earnings balance out to their wallet, on-chain. */
export interface Withdrawal {
  id: number;
  toAddr: string;
  amountAtomic: number;
  /** On-chain txid, or null while pending / if the send failed (then refunded). */
  txid: string | null;
  status: "sent" | "failed";
  createdAt: number;
}

/** A contributor API key, as shown in the web UI. The secret is never returned. */
export interface ApiKeyInfo {
  id: number;
  label: string;
  /** First and last few characters, e.g. `tnd_abc…xyz`, to tell keys apart. */
  preview: string;
  createdAt: number;
  lastUsedAt: number | null;
}

/** POST /keys → the one and only time the full key is returned. */
export interface CreateApiKeyResponse {
  key: ApiKeyInfo;
  /** The secret. Shown once; only its hash is stored. */
  secret: string;
}

/** POST /withdraw → what actually left the earnings balance. */
export interface WithdrawResponse {
  amountAtomic: number;
  txid: string;
  /** Earnings balance after the withdrawal (0 — withdrawals are all-or-nothing). */
  earningsAtomic: number;
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
  /** Withdrawable contributor earnings, in atomic units. Separate from credit:
   *  what you earn is cashed out to your wallet, not spent as rent. */
  earningsAtomic: number;
  topups: TopUp[];
  charges: Charge[];
  /** Per-lease earnings credited as a contributor. */
  payouts: Payout[];
  /** Cash-outs of that balance to the wallet. */
  withdrawals: Withdrawal[];
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

/** One step of a cumulative growth series — one point per change, not per day. */
export interface MetricPoint {
  t: number; // epoch ms of the change
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
 * one message.
 *
 * Auth is an API key minted in the web UI by a signed-in wallet. The agent
 * therefore holds no Algorand private key: the key's owner *is* the node's owner
 * and payout address, so neither can be spoofed from the contributor's env.
 */
export interface AgentHelloMsg {
  /** Existing node id to re-attach to, or omit/empty to create a new one. */
  nodeId?: string;
  /** Contributor API key (`tnd_…`) from the web UI's contributor section. */
  apiKey: string;
  /** Advertised node specs. */
  spec: RegisterNodeRequest;
}

/**
 * registry -> agent: hello accepted. Carries the canonical node id plus the
 * settings the contributor no longer configures locally — the backend owns the
 * tunnel and the payout address.
 */
export interface HelloAckMsg {
  nodeId: string;
  /** Wallet that minted the API key — earns for this node. */
  ownerAddr: string;
  /** Reverse-tunnel settings for the sandbox, chosen by the backend. */
  bore: { server: string; secret: string };
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

/**
 * What a node advertises about itself. Owner and payout address are deliberately
 * absent — both come from the API key the agent authenticates with.
 */
export interface RegisterNodeRequest {
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
  /**
   * Present only on a **leaseless** run (`POST /x402/run` with no lease token),
   * where the backend picked a machine, ran the code and billed the time itself.
   * A run inside a lease you already hold bills with that lease, not here.
   */
  execution?: {
    nodeId: string;
    /** Seconds the sandbox was up — what was billed. */
    seconds: number;
    /** Cost of those seconds at the node's rate, in atomic units. */
    costAtomic: string;
    /** Balance afterwards. **May be negative** — a run is never cut off part-way
     *  to protect the balance, so the last one can overdraw. Renting is blocked
     *  until it is back above zero. */
    balance: string;
  };
}

// ───────────────────────── Wallet auth DTOs ─────────────────────────
// Signing in proves address control so an existing credit balance can be read
// and spent. It is NOT how money gets in — that is x402 only (see below).

/** GET /auth/wallet-nonce → a short-lived challenge to sign for wallet login. */
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
  /** Least a contributor may withdraw at once — a floor on dust payouts. */
  minWithdrawAtomic: number;
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

/** What a running lease costs, and what is funding it. */
export interface LeaseBilling {
  /** What the meter charges per hour, in atomic units. */
  rateAtomicPerHour: string;
  /** The on-chain gate fee paid to open the lease. Not usage, not refundable. */
  gateFeeAtomic: string;
  /** Credit available at lease start — what `fundedUntil` was computed from. */
  creditAtomic: string;
  /** How long that credit funds at this rate. `null` when the node is free. */
  fundedSeconds: number | null;
  asset: AssetInfo;
}

/** POST /rent/:nodeId → a running sandbox, metered by the second. */
export interface X402RentResponse {
  leaseId: string;
  /** Opaque bearer token required by /run and /release. */
  leaseToken: string;
  node: {
    id: string;
    cpu: number;
    memoryGb: number;
    gpu: string | null;
    pricePerHourUsd: number;
  };
  ssh: SandboxAccess;
  /** ISO 8601 — when the meter started. */
  startedAt: string;
  /**
   * ISO 8601 — when the renter's credit runs out at this rate, and the watchdog
   * stops the sandbox. Not a chosen duration: top up and it moves out.
   */
  fundedUntil: string;
  billing: LeaseBilling;
  /** The settled gate-fee payment. */
  payment: PaymentReceipt | null;
}

/** DELETE /x402/leases/:leaseId → stop the meter and bill what was used. */
export interface LeaseCloseResponse {
  leaseId: string;
  /** Seconds the sandbox was actually up. */
  usedSeconds: number;
  /** Cost of those seconds, in atomic units. */
  usedAtomic: string;
  /** What was actually taken from credit (clamped to the balance). */
  chargedAtomic: string;
  /** The payer's credit balance after the charge. */
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
 * How many seconds `creditAtomic` funds at `rateAtomicPerHour`.
 *
 * `null` means "as long as you like" — a free node has no rate to run down, so
 * there is nothing for credit to limit. Callers must handle that rather than
 * dividing by zero and getting a lease that expires the instant it opens.
 */
export function fundedSeconds(creditAtomic: number, rateAtomicPerHour: number): number | null {
  if (rateAtomicPerHour <= 0) return null;
  return Math.max(0, Math.floor((creditAtomic / rateAtomicPerHour) * 3600));
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

// ───────────────────────────── Network selection ─────────────────────────────
// One switch picks the chain: `ALGORAND_NETWORK` (backend, contributor, buyer)
// or `VITE_ALGORAND_NETWORK` (web). Everything that differs between testnet and
// mainnet — the CAIP-2 id, the algod endpoint, the USDC asset, the explorer —
// is derived from it here, so the two can never be set to disagree. Each value
// still has its own env override for a private node or a non-USDC asset.

/** CAIP-2 network identifiers, full genesis hash (what a facilitator advertises). */
export const ALGORAND_TESTNET_CAIP2 = "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=";
export const ALGORAND_MAINNET_CAIP2 = "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=";

export type AlgorandNetwork = "testnet" | "mainnet";

/** Everything that changes when you flip the network switch. */
export interface NetworkDefaults {
  network: AlgorandNetwork;
  /** CAIP-2 id, full genesis hash. `@x402/avm` uses a 32-char-truncated form of
   *  the same hash; the two are NOT interchangeable when matching a
   *  facilitator's supported kinds, so keep the full one here.
   *  Typed `namespace:reference` — that shape is what CAIP-2 guarantees and
   *  what the x402 SDK's `Network` type requires. */
  caip2: `${string}:${string}`;
  algodUrl: string;
  /** Block explorer root, e.g. `<root>/transaction/<txid>`. */
  explorerUrl: string;
  /** USDC on this network — the asset every price is denominated in. */
  asset: AssetInfo;
}

const NETWORKS: Record<AlgorandNetwork, NetworkDefaults> = {
  testnet: {
    network: "testnet",
    caip2: ALGORAND_TESTNET_CAIP2,
    algodUrl: "https://testnet-api.algonode.cloud",
    explorerUrl: "https://lora.algokit.io/testnet",
    asset: { id: "10458941", decimals: 6, symbol: "USDC" },
  },
  mainnet: {
    network: "mainnet",
    caip2: ALGORAND_MAINNET_CAIP2,
    algodUrl: "https://mainnet-api.algonode.cloud",
    explorerUrl: "https://lora.algokit.io/mainnet",
    asset: { id: "31566704", decimals: 6, symbol: "USDC" },
  },
};

/**
 * Resolve a network name to its defaults. Unset falls back to testnet — the
 * safe default, since a typo must never quietly move real money. Anything set
 * but unrecognised throws rather than defaulting, because silently running
 * testnet while the operator believes they configured mainnet (or the reverse)
 * is the one failure mode worth crashing at boot over.
 */
export function networkDefaults(name?: string | null): NetworkDefaults {
  const key = (name ?? "testnet").trim().toLowerCase();
  const found = NETWORKS[key as AlgorandNetwork];
  if (!found) {
    throw new Error(
      `unknown Algorand network "${name}" — expected "testnet" or "mainnet"`,
    );
  }
  return found;
}
