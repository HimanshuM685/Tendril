import type {
  CreateApiKeyResponse,
  LeaseCloseResponse,
  PlatformInfo,
  RunResponse,
  RunJobResponse,
  WalletSummary,
  WithdrawResponse,
  X402RentResponse,
  X402TopUpResponse,
} from "@tendril/shared";
import { NOTEBOOK_MAX_BYTES, notebookError } from "@tendril/shared";
import {
  authedJson,
  paidAuthedJson,
  paidJson,
  plainJson,
  registryUrl,
  walletAddress,
} from "./client.js";

const api = () => registryUrl();

export async function platform(): Promise<PlatformInfo> {
  return (await plainJson(`${api()}/platform`)) as PlatformInfo;
}

export async function listNodes(): Promise<unknown> {
  return plainJson(`${api()}/explorer`);
}

export async function account(): Promise<WalletSummary> {
  return (await authedJson(`${api()}/wallet`)) as WalletSummary;
}

export async function topup(amountAtomic: number): Promise<X402TopUpResponse> {
  if (!Number.isInteger(amountAtomic) || amountAtomic <= 0) {
    throw new Error("amountAtomic must be a positive integer (USDC atomic units)");
  }
  return (await paidJson(`${api()}/x402/topup?amount=${amountAtomic}`, {
    method: "POST",
  })) as X402TopUpResponse;
}

export async function run(payload: string, leaseToken?: string): Promise<RunResponse> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (leaseToken) headers.authorization = `Bearer ${leaseToken}`;
  return (await paidJson(`${api()}/x402/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ payload }),
  })) as RunResponse;
}

/** Start an asynchronous notebook job. Poll with its returned jobToken. */
export async function runNotebook(notebook: Record<string, unknown>, lane?: "contributor" | "priority"): Promise<RunJobResponse> {
  const invalid = notebookError(notebook);
  if (invalid) throw new Error(invalid);
  if (Buffer.byteLength(JSON.stringify(notebook)) > NOTEBOOK_MAX_BYTES) {
    throw new Error("notebook must be under 1.5 MB");
  }
  return (await paidJson(`${api()}/x402/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ notebook, lane }),
  })) as RunJobResponse;
}

export async function notebookJob(jobId: string, jobToken: string): Promise<RunJobResponse> {
  return (await plainJson(`${api()}/x402/run/${encodeURIComponent(jobId)}`, {
    headers: { authorization: `Bearer ${jobToken}` },
  })) as RunJobResponse;
}

export async function rent(nodeId: string, sshPubKey?: string): Promise<X402RentResponse> {
  if (!nodeId) throw new Error("nodeId required");
  return (await paidJson(`${api()}/x402/rent?nodeId=${encodeURIComponent(nodeId)}`, {
    method: "POST",
    body: JSON.stringify(sshPubKey ? { sshPubKey } : {}),
  })) as X402RentResponse;
}

export async function lease(leaseId: string, leaseToken: string): Promise<unknown> {
  return plainJson(`${api()}/lease/${encodeURIComponent(leaseId)}`, {
    headers: { authorization: `Bearer ${leaseToken}` },
  });
}

export async function release(leaseId: string, leaseToken: string): Promise<LeaseCloseResponse> {
  return (await plainJson(`${api()}/x402/leases/${encodeURIComponent(leaseId)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${leaseToken}` },
  })) as LeaseCloseResponse;
}

export async function myNodes(): Promise<unknown> {
  return plainJson(`${api()}/nodes?owner=${encodeURIComponent(walletAddress())}`);
}

export async function listKeys(): Promise<unknown> {
  return authedJson(`${api()}/keys`);
}

export async function mintKey(label?: string): Promise<CreateApiKeyResponse> {
  return (await paidAuthedJson(`${api()}/x402/keys`, {
    method: "POST",
    body: JSON.stringify({ label: (label ?? "").slice(0, 64) }),
  })) as CreateApiKeyResponse;
}

export async function revokeKey(id: number): Promise<unknown> {
  return authedJson(`${api()}/keys/${id}`, { method: "DELETE" });
}

export async function withdraw(): Promise<WithdrawResponse> {
  return (await authedJson(`${api()}/withdraw`, { method: "POST" })) as WithdrawResponse;
}
