import algosdk from "algosdk";
import type {
  PlatformInfo,
  WalletLoginResponse,
  WalletNonceResponse,
} from "@tendril/shared";
import { REGISTRY_URL, apiError } from "./api";

/** use-wallet's signTransactions signature (encoded txns + optional indexes). */
type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

const ALGOD_URL =
  (import.meta.env.VITE_ALGOD_URL as string | undefined) ?? "https://testnet-api.algonode.cloud";
const algod = new algosdk.Algodv2("", ALGOD_URL, "");

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Sign in: prove control of `address` by signing the login nonce as the note of
 * a 0-ALGO self-payment (never broadcast — just verified). Returns a session
 * token + the current balance.
 */
export async function loginWithWallet(
  address: string,
  sign: SignTransactions,
): Promise<WalletLoginResponse> {
  const { nonce } = (await (
    await fetch(`${REGISTRY_URL}/auth/wallet-nonce?address=${address}`)
  ).json()) as WalletNonceResponse;

  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    amount: 0n,
    note: new TextEncoder().encode(nonce),
    suggestedParams,
  });
  const [signed] = await sign([txn.toByte()]);
  if (!signed) throw new Error("login was not signed");

  const res = await fetch(`${REGISTRY_URL}/auth/wallet-login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, nonce, payment: toB64(signed) }),
  });
  if (!res.ok) throw await apiError(res, "sign-in");
  return res.json();
}

/**
 * Top up: send `amountAlgo` ALGO from the wallet to the platform custodial
 * address. The backend confirms it on-chain and credits the balance.
 */
export async function topUp(
  token: string,
  address: string,
  sign: SignTransactions,
  amountAlgo: number,
): Promise<{ txid: string; balanceMicroAlgos: number }> {
  const platform = (await (await fetch(`${REGISTRY_URL}/platform`)).json()) as PlatformInfo;
  if (!platform.payTo) throw new Error("platform deposit address is not configured on the server");

  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: platform.payTo,
    amount: BigInt(Math.round(amountAlgo * 1e6)),
    suggestedParams,
  });
  const [signed] = await sign([txn.toByte()]);
  if (!signed) throw new Error("top-up was not signed");

  const res = await fetch(`${REGISTRY_URL}/wallet/topup`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ payment: toB64(signed) }),
  });
  if (!res.ok) throw await apiError(res, "top-up");
  return res.json();
}
