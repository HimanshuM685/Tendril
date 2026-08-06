import type {
  GasRequestInfo,
  GoogleAccountResponse,
  GoogleSessionResponse,
  SignPrepareResponse,
} from "@tendril/shared";
import { REGISTRY_URL, apiError } from "../api";

export type CustodialAction =
  | { action: "topup"; amountAtomic: number }
  | { action: "optin" }
  | { action: "rent"; nodeId: string; sshPubKey?: string | null }
  | { action: "run"; code: string; minRamMb?: number }
  | { action: "release"; leaseId: string; leaseToken: string }
  | { action: "mintkey"; label?: string };

export async function fetchGoogleEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${REGISTRY_URL}/auth/google/enabled`);
    if (!res.ok) return false;
    const body = (await res.json()) as { enabled?: boolean };
    return !!body.enabled;
  } catch {
    return false;
  }
}

export function googleLoginUrl(): string {
  return `${REGISTRY_URL}/auth/google`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleSessionResponse> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw await apiError(res, "Google sign-in");
  return res.json();
}

export async function fetchGoogleAccount(token: string): Promise<GoogleAccountResponse> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/account`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "account");
  return res.json();
}

export async function prepareCustodial(
  token: string,
  body: CustodialAction,
): Promise<SignPrepareResponse> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/prepare`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await apiError(res, "prepare");
  return res.json();
}

export async function confirmCustodial<T = unknown>(
  token: string,
  requestId: string,
): Promise<T> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/confirm`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ requestId }),
  });
  if (!res.ok) throw await apiError(res, "confirm");
  return res.json();
}

export async function fetchGasRequest(token: string): Promise<GasRequestInfo | null> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/gas-request`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "gas request");
  return res.json();
}

export async function submitGasRequest(token: string): Promise<GasRequestInfo> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/gas-request`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "gas request");
  return res.json();
}

export async function exportGoogleMnemonic(token: string): Promise<string> {
  const res = await fetch(`${REGISTRY_URL}/auth/google/export-key`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ confirmed: true }),
  });
  if (!res.ok) throw await apiError(res, "export");
  const body = (await res.json()) as { mnemonic: string };
  return body.mnemonic;
}
