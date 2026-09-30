import type {
  ApiKeyInfo,
  ComputeNode,
  CreateApiKeyResponse,
  ExplorerNode,
  Lease,
  LeaseBilling,
  LeaseCloseResponse,
  Metrics,
  PlatformInfo,
  RunResponse,
  SandboxAccess,
  WalletSummary,
  WithdrawResponse,
  X402RentResponse,
} from "@tendril/shared";
import { payingFetch, type PayStage, type SignTransactions } from "./lib/x402Client";
import { EXPLORER_URL } from "./lib/network";

export const REGISTRY_URL = (
  (import.meta.env.VITE_REGISTRY_URL as string | undefined) ?? "http://localhost:4000"
).replace(/\/+$/, "");

export const explorerTxUrl = (txid: string) => `${EXPLORER_URL}/transaction/${txid}`;
export const explorerAddrUrl = (address: string) => `${EXPLORER_URL}/account/${address}`;

export type ActiveLease = {
  leaseId: string;
  leaseToken: string;
  access: SandboxAccess;
  /**
   * Unix ms the renter's credit runs out at this rate (`fundedUntil`, parsed),
   * or `Infinity` on a free node. Not a chosen duration — top up and it moves.
   */
  expiresAt: number;
  rateAtomicPerHour: number;
  /** The rate, the gate fee paid, and how long the credit funds. */
  billing: LeaseBilling;
  nodeId: string;
  label: string;
};

/**
 * Turn a failed response into a human-readable Error. Backend errors arrive as
 * `{"error": "..."}` — surface that message instead of dumping raw JSON into
 * the UI. The status code stays in the message so 401 handling keeps working.
 */
export async function apiError(res: Response, what: string): Promise<Error> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      detail = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      detail = text;
    }
  } catch {
    /* body unreadable — status alone will have to do */
  }
  detail = detail.trim();
  return new Error(`${what} failed: ${res.status}${detail ? ` — ${detail}` : ""}`);
}

export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("Failed"))) {
      throw new Error(
        `Unable to connect to backend API at ${REGISTRY_URL}. Ensure backend server is running and VITE_REGISTRY_URL is configured correctly.`
      );
    }
    throw err;
  }
}

export async function fetchExplorer(): Promise<ExplorerNode[]> {
  const res = await safeFetch(`${REGISTRY_URL}/explorer`);
  if (!res.ok) throw await apiError(res, "explorer");
  return (await res.json()).nodes as ExplorerNode[];
}

/** Where to send top-ups + the USD→ALGO rate used to show prices in ALGO. */
export async function fetchPlatform(): Promise<PlatformInfo> {
  const res = await safeFetch(`${REGISTRY_URL}/platform`);
  if (!res.ok) throw await apiError(res, "platform");
  return res.json();
}

export async function fetchMetrics(): Promise<Metrics> {
  const res = await safeFetch(`${REGISTRY_URL}/metrics`);
  if (!res.ok) throw await apiError(res, "metrics");
  return res.json();
}

export async function fetchMyNodes(owner: string): Promise<ComputeNode[]> {
  const res = await safeFetch(`${REGISTRY_URL}/nodes?owner=${owner}`);
  if (!res.ok) throw await apiError(res, "nodes");
  return (await res.json()).nodes as ComputeNode[];
}

/** The signed-in wallet's balance + deposit/spend history. */
export async function fetchWallet(token: string): Promise<WalletSummary> {
  const res = await safeFetch(`${REGISTRY_URL}/wallet`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "wallet");
  return res.json();
}

// ─────────────────────── contributor keys + earnings ───────────────────────
// All session-gated: the key belongs to the signed-in wallet, and so do the
// earnings it accrues.

export async function fetchApiKeys(token: string): Promise<ApiKeyInfo[]> {
  const res = await safeFetch(`${REGISTRY_URL}/keys`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "keys");
  return (await res.json()).keys as ApiKeyInfo[];
}

/** Mint a key. Pays flatMintKeyAtomic on-chain via x402. Secret shown once. */
export async function createApiKey(
  token: string,
  address: string,
  sign: SignTransactions,
  label: string,
  onStage?: (stage: PayStage) => void,
): Promise<CreateApiKeyResponse> {
  const res = await payingFetch(address, sign, onStage)(`${REGISTRY_URL}/x402/keys`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw await apiError(res, "create key");
  return res.json();
}

export async function revokeApiKey(token: string, id: number): Promise<void> {
  const res = await safeFetch(`${REGISTRY_URL}/keys/${id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "revoke key");
}

/** Cash the whole earnings balance out to the signed-in wallet, on-chain. */
export async function withdrawEarnings(token: string): Promise<WithdrawResponse> {
  const res = await safeFetch(`${REGISTRY_URL}/withdraw`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "withdraw");
  return res.json();
}

/**
 * Rent a node over x402: `POST /x402/rent?nodeId=<id>`.
 *
 * The node id is a query parameter, not a path segment, so every rent is the
 * same resource URL and the Bazaar lists one endpoint instead of one per node.
 *
 * Every rent pays a flat gate fee (0.01 USDC) on-chain via x402 — the wallet
 * always opens. After the gate fee settles, the compute cost is deducted from
 * the renter's credit balance on the backend.
 */
export async function rentNode(
  token: string | null,
  address: string,
  sign: SignTransactions,
  nodeId: string,
  onStage?: (stage: PayStage) => void,
  surface?: "ssh" | "jupyter",
): Promise<X402RentResponse> {
  const q = new URLSearchParams({ nodeId });
  if (surface) q.set("surface", surface);
  const res = await payingFetch(address, sign, onStage)(
    `${REGISTRY_URL}/x402/rent?${q.toString()}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(surface ? { surface } : {}),
    },
  );
  if (!res.ok) throw await apiError(res, "rent");
  return res.json();
}

/** Map a rent response into the shape the lease panel renders. */
export function toActiveLease(r: X402RentResponse, label: string): ActiveLease {
  const access = r.jupyter ?? r.ssh;
  if (!access) throw new Error("rent returned no access details");
  return {
    leaseId: r.leaseId,
    leaseToken: r.leaseToken,
    access,
    expiresAt: r.fundedUntil === "never" ? Infinity : Date.parse(r.fundedUntil),
    rateAtomicPerHour: Number(r.billing.rateAtomicPerHour),
    billing: r.billing,
    nodeId: r.node.id,
    label,
  };
}

/** Poll a lease to refresh its projected expiry + status as the meter bills it. */
export async function fetchLease(leaseId: string, leaseToken: string): Promise<Lease> {
  const res = await safeFetch(`${REGISTRY_URL}/lease/${leaseId}`, {
    headers: { authorization: `Bearer ${leaseToken}` },
  });
  if (!res.ok) throw await apiError(res, "lease");
  return (await res.json()).lease as Lease;
}

/**
 * Execute an uploaded notebook with no lease: `POST /x402/run` `{ notebook }`.
 * The executed notebook and any files it wrote come back in the response.
 * Seconds are billed from credit after the run, same as a Python payload.
 */
export async function runNotebook(
  token: string | null,
  address: string,
  sign: SignTransactions,
  notebook: Record<string, unknown>,
  onStage?: (stage: PayStage) => void,
): Promise<RunResponse> {
  const res = await payingFetch(address, sign, onStage)(`${REGISTRY_URL}/x402/run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ notebook }),
  });
  if (!res.ok) throw await apiError(res, "run");
  return res.json();
}

/**
 * Execute one job in the sandbox: `POST /x402/run`. Flat-priced per call, so
 * this answers 402 and `payingFetch` settles it — one wallet approval per run.
 * The job runs before the payment settles: a job that fails costs nothing.
 *
 * The lease is named by `leaseToken`, never by the path — one URL, one Bazaar
 * entry, however many leases run jobs through it.
 */
export async function runJob(
  leaseToken: string,
  payload: string,
  address: string,
  sign: SignTransactions,
  onStage?: (stage: PayStage) => void,
): Promise<RunResponse> {
  const res = await payingFetch(address, sign, onStage)(`${REGISTRY_URL}/x402/run`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${leaseToken}` },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw await apiError(res, "run");
  return res.json();
}

/**
 * Close a lease early: `DELETE /x402/leases/:leaseId`. Unused seconds come back
 * as credit on the payer's address, which is what makes their next 402 smaller.
 * Returns null when the lease was already gone server-side (nothing to refund).
 */
export async function releaseLease(
  leaseId: string,
  leaseToken: string,
): Promise<LeaseCloseResponse | null> {
  const res = await safeFetch(`${REGISTRY_URL}/x402/leases/${leaseId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${leaseToken}` },
  });
  // 404/410 = the lease is already gone server-side — that's the state the user
  // wanted, so only a live failure (5xx, auth) should block closing the panel.
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw await apiError(res, "release");
  return res.json();
}
