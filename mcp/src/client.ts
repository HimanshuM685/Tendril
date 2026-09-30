/**
 * Registry HTTP + x402 paying fetch for the MCP.
 *
 * Same path as example-buyer: on a 402, wrapFetchWithPayment builds the atomic
 * group, signs only our transfer, and retries. Stdio MCP must not write to
 * stdout — keep noise on stderr.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";
import { x402Client } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { normalizeAlgorandNetwork } from "@x402/avm";
import { wrapFetchWithPayment } from "@x402/fetch";
import type { Network } from "@x402/core/types";
import { networkDefaults, type PlatformInfo, type WalletLoginResponse } from "@tendril/shared";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });
loadEnv({ path: resolve(repoRoot, ".env") });

const DEFAULT_REGISTRY = "https://tendrilregister.007575.xyz";
const DEFAULT_MAX_ATOMIC = 1_000_000;

export function registryUrl(): string {
  return (process.env.REGISTRY_URL ?? DEFAULT_REGISTRY).replace(/\/+$/, "");
}

export function maxAtomic(): number {
  const n = Number(process.env.TENDRIL_MAX_ATOMIC ?? DEFAULT_MAX_ATOMIC);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_ATOMIC;
}

let address = "";
let sk: Uint8Array | null = null;
let paying: typeof fetch | null = null;
let algod: algosdk.Algodv2 | null = null;
let sessionToken: string | null = null;

function loadWallet(): { address: string; sk: Uint8Array } {
  if (sk && address) return { address, sk };
  const raw = process.env.AVM_PRIVATE_KEY ?? "";
  if (!raw) {
    throw new Error(
      "AVM_PRIVATE_KEY is required for paid tools (base64 64-byte Algorand secret). Free tools (tendril_platform, tendril_list_nodes) do not need it.",
    );
  }
  sk = new Uint8Array(Buffer.from(raw, "base64"));
  if (sk.byteLength !== 64) {
    throw new Error("AVM_PRIVATE_KEY must be a base64-encoded 64-byte secret key");
  }
  address = algosdk.encodeAddress(sk.slice(32));
  return { address, sk };
}

export function walletAddress(): string {
  return loadWallet().address;
}

function signer(addr: string, secret: Uint8Array) {
  return {
    address: addr,
    async signTransactions(txns: Uint8Array[], indexesToSign?: number[]) {
      const wanted = indexesToSign ?? txns.map((_, i) => i);
      return txns.map((bytes, i) =>
        wanted.includes(i) ? algosdk.decodeUnsignedTransaction(bytes).signTxn(secret) : null,
      );
    },
  };
}

function networkName(caip2: string): "testnet" | "mainnet" {
  const env = process.env.ALGORAND_NETWORK;
  if (env === "mainnet" || env === "testnet") return env;
  return caip2.includes("wGHE") ? "mainnet" : "testnet";
}

async function ensurePay(): Promise<typeof fetch> {
  if (paying) return paying;
  const wallet = loadWallet();
  const platform = (await plainJson(`${registryUrl()}/platform`)) as PlatformInfo;
  const algodUrl = process.env.ALGOD_URL ?? networkDefaults(networkName(platform.network)).algodUrl;
  algod = new algosdk.Algodv2("", algodUrl, "");
  const scheme = new ExactAvmScheme(signer(wallet.address, wallet.sk), { algodUrl });
  const client = new x402Client()
    .register(platform.network as Network, scheme)
    .register(normalizeAlgorandNetwork(platform.network), scheme);
  paying = wrapFetchWithPayment(fetch, client) as typeof fetch;
  return paying;
}

async function fail(res: Response, label: string): Promise<never> {
  const text = await res.text();
  let detail = text;
  try {
    const body = JSON.parse(text) as { error?: string; detail?: string };
    detail = [body.error, body.detail].filter(Boolean).join(": ") || text;
  } catch {
    /* raw */
  }
  throw new Error(`${label} → ${res.status} ${detail}`);
}

export async function plainJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) await fail(res, url);
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Probe for a 402, refuse if the quote is above TENDRIL_MAX_ATOMIC, then pay.
 */
export async function paidJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const headers = { "content-type": "application/json", ...(init.headers ?? {}) };
  const probe = await fetch(url, { ...init, headers });
  if (probe.status === 402) {
    const body = (await probe.json()) as { accepts?: Array<{ amount?: string }> };
    const amount = Number(body.accepts?.[0]?.amount ?? 0);
    const cap = maxAtomic();
    if (amount > cap) {
      throw new Error(
        `quoted ${amount} atomic exceeds TENDRIL_MAX_ATOMIC=${cap}. Raise the cap or pick a cheaper call.`,
      );
    }
  } else if (!probe.ok) {
    await fail(probe, url);
  } else {
    return probe.json();
  }

  const pay = await ensurePay();
  const res = await pay(url, { ...init, headers });
  if (!res.ok) await fail(res, url);
  return res.json();
}

export async function session(): Promise<string> {
  if (sessionToken) return sessionToken;
  const wallet = loadWallet();
  await ensurePay();
  if (!algod) throw new Error("algod not initialised");

  const nonceRes = (await plainJson(
    `${registryUrl()}/auth/wallet-nonce?address=${encodeURIComponent(wallet.address)}`,
  )) as { nonce: string };

  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: wallet.address,
    receiver: wallet.address,
    amount: 0n,
    note: new TextEncoder().encode(nonceRes.nonce),
    suggestedParams,
  });
  const signed = txn.signTxn(wallet.sk);
  const login = (await plainJson(`${registryUrl()}/auth/wallet-login`, {
    method: "POST",
    body: JSON.stringify({
      address: wallet.address,
      nonce: nonceRes.nonce,
      payment: Buffer.from(signed).toString("base64"),
    }),
  })) as WalletLoginResponse;
  sessionToken = login.token;
  return sessionToken;
}

export function clearSession(): void {
  sessionToken = null;
}

export async function authedJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const token = await session();
  try {
    return await plainJson(url, {
      ...init,
      headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` },
    });
  } catch (err) {
    if (!/\b401\b/.test((err as Error).message)) throw err;
    clearSession();
    const retry = await session();
    return plainJson(url, {
      ...init,
      headers: { ...(init.headers ?? {}), authorization: `Bearer ${retry}` },
    });
  }
}

export async function paidAuthedJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const token = await session();
  return paidJson(url, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${token}` },
  });
}
