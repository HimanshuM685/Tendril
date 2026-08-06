import type {
  AdminDashboard,
  AdminGasRequest,
  AdminSessionResponse,
  GasRequestStatus,
} from "@tendril/shared";

export const REGISTRY_URL =
  (import.meta.env.VITE_REGISTRY_URL as string | undefined) ?? "http://localhost:4000";

export const EXPLORER_URL =
  (import.meta.env.VITE_EXPLORER_URL as string | undefined) ??
  "https://lora.algokit.io/testnet";

export const explorerTxUrl = (txid: string) => `${EXPLORER_URL}/transaction/${txid}`;
export const explorerAddrUrl = (address: string) => `${EXPLORER_URL}/account/${address}`;

const SESSION_KEY = "tendril.admin.session";

export function loadToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

async function apiError(res: Response, what: string): Promise<Error> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      detail = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      detail = text;
    }
  } catch {
    /* ignore */
  }
  return new Error(`${what} failed: ${res.status}${detail ? ` — ${detail}` : ""}`);
}

function authHeaders(token: string) {
  return { authorization: `Bearer ${token}`, "content-type": "application/json" };
}

export async function fetchAdminEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${REGISTRY_URL}/admin/auth/enabled`);
    if (!res.ok) return false;
    return !!((await res.json()) as { enabled?: boolean }).enabled;
  } catch {
    return false;
  }
}

export function adminLoginUrl(): string {
  return `${REGISTRY_URL}/admin/auth/google`;
}

export async function exchangeAdminCode(code: string): Promise<AdminSessionResponse> {
  const res = await fetch(`${REGISTRY_URL}/admin/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw await apiError(res, "admin sign-in");
  return res.json();
}

export async function fetchDashboard(token: string): Promise<AdminDashboard> {
  const res = await fetch(`${REGISTRY_URL}/admin/dashboard`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await apiError(res, "dashboard");
  return res.json();
}

export async function fetchGasRequests(
  token: string,
  status?: GasRequestStatus,
): Promise<AdminGasRequest[]> {
  const q = status ? `?status=${status}` : "";
  const res = await fetch(`${REGISTRY_URL}/admin/gas-requests${q}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await apiError(res, "gas requests");
  return ((await res.json()) as { requests: AdminGasRequest[] }).requests;
}

export async function acceptGasRequest(token: string, id: string): Promise<AdminGasRequest> {
  const res = await fetch(`${REGISTRY_URL}/admin/gas-requests/${id}/accept`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await apiError(res, "accept");
  return ((await res.json()) as { request: AdminGasRequest }).request;
}

export async function rejectGasRequest(
  token: string,
  id: string,
  note?: string,
): Promise<AdminGasRequest> {
  const res = await fetch(`${REGISTRY_URL}/admin/gas-requests/${id}/reject`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw await apiError(res, "reject");
  return ((await res.json()) as { request: AdminGasRequest }).request;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  address: string;
  createdAt: number;
  lastLoginAt: number;
}

export async function fetchAdminUsers(
  token: string,
  offset = 0,
): Promise<{ users: AdminUserRow[]; total: number }> {
  const res = await fetch(`${REGISTRY_URL}/admin/users?offset=${offset}&limit=50`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await apiError(res, "users");
  return res.json();
}

export async function fetchTreasury(token: string) {
  const res = await fetch(`${REGISTRY_URL}/admin/treasury`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await apiError(res, "treasury");
  return res.json() as Promise<{
    address: string;
    algoMicro: number;
    usdcAtomic: number;
    usdcOptedIn: boolean;
    gasGrantMicroAlgos: number;
  }>;
}
