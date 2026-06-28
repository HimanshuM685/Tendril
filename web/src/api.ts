import type {
  ComputeNode,
  ExplorerNode,
  Lease,
  PlatformInfo,
  RunResponse,
  SandboxAccess,
  WalletSummary,
} from "@tendril/shared";

export const REGISTRY_URL =
  (import.meta.env.VITE_REGISTRY_URL as string | undefined) ?? "http://localhost:4000";

export type ActiveLease = {
  leaseId: string;
  access: SandboxAccess;
  expiresAt: number;
  rateMicroAlgosPerHour: number;
  leaseToken: string;
  nodeId: string;
  label: string;
};

export async function fetchExplorer(): Promise<ExplorerNode[]> {
  const res = await fetch(`${REGISTRY_URL}/explorer`);
  if (!res.ok) throw new Error(`explorer failed: ${res.status}`);
  return (await res.json()).nodes as ExplorerNode[];
}

/** Where to send top-ups + the USD→ALGO rate used to show prices in ALGO. */
export async function fetchPlatform(): Promise<PlatformInfo> {
  const res = await fetch(`${REGISTRY_URL}/platform`);
  if (!res.ok) throw new Error(`platform failed: ${res.status}`);
  return res.json();
}

export async function fetchMyNodes(owner: string): Promise<ComputeNode[]> {
  const res = await fetch(`${REGISTRY_URL}/nodes?owner=${owner}`);
  if (!res.ok) throw new Error(`nodes failed: ${res.status}`);
  return (await res.json()).nodes as ComputeNode[];
}

/** The signed-in wallet's balance + deposit/spend history. */
export async function fetchWallet(token: string): Promise<WalletSummary> {
  const res = await fetch(`${REGISTRY_URL}/wallet`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`wallet failed: ${res.status}`);
  return res.json();
}

/** Rent a node — spends the prepaid balance, no per-rent signing. */
export async function rentNode(
  token: string,
  nodeId: string,
): Promise<Omit<ActiveLease, "nodeId" | "label">> {
  const res = await fetch(`${REGISTRY_URL}/rent/${nodeId}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`rent failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Poll a lease to refresh its projected expiry + status as the meter bills it. */
export async function fetchLease(leaseId: string, leaseToken: string): Promise<Lease> {
  const res = await fetch(`${REGISTRY_URL}/lease/${leaseId}`, {
    headers: { authorization: `Bearer ${leaseToken}` },
  });
  if (!res.ok) throw new Error(`lease failed: ${res.status}`);
  return (await res.json()).lease as Lease;
}

export async function runJob(
  leaseId: string,
  leaseToken: string,
  payload: string,
): Promise<RunResponse> {
  const res = await fetch(`${REGISTRY_URL}/lease/${leaseId}/run`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${leaseToken}` },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error(`run failed: ${res.status}`);
  return res.json();
}

export async function releaseLease(leaseId: string, leaseToken: string): Promise<void> {
  await fetch(`${REGISTRY_URL}/lease/${leaseId}/release`, {
    method: "POST",
    headers: { authorization: `Bearer ${leaseToken}` },
  });
}
