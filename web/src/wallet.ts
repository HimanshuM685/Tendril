import algosdk from "algosdk";
import type {
  PaymentRequired,
  TopUpResponse,
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

/** Where a top-up currently is, so the UI can say more than "working…". */
export type TopUpStage = "signing" | "confirming";

/**
 * Top up: send `amountAlgo` ALGO from the wallet to the platform custodial
 * address. The backend confirms it on-chain and credits the balance.
 * `onStage` fires as it moves between waiting on the wallet and waiting on the
 * chain — confirmation takes seconds, and silence reads as failure.
 */
export async function topUp(
  token: string,
  address: string,
  sign: SignTransactions,
  amountAlgo: number,
  onStage?: (stage: TopUpStage) => void,
): Promise<TopUpResponse> {
  const auth = { authorization: `Bearer ${token}` };

  // x402 step 1 — ask for the bill; expect HTTP 402 + a payment challenge.
  const challengeRes = await fetch(`${REGISTRY_URL}/wallet/topup`, {
    method: "POST",
    headers: { "content-type": "application/json", ...auth },
    body: JSON.stringify({ amountMicroAlgos: Math.round(amountAlgo * 1e6) }),
  });
  if (challengeRes.status !== 402) throw await apiError(challengeRes, "top-up");
  const { accepts } = (await challengeRes.json()) as PaymentRequired;
  const option = accepts[0];
  if (!option?.payTo) throw new Error("platform deposit address is not configured on the server");

  // x402 step 2 — sign exactly what the challenge asked for and retry.
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: option.payTo,
    amount: BigInt(option.amount),
    suggestedParams,
  });
  onStage?.("signing");
  const [signed] = await sign([txn.toByte()]);
  if (!signed) throw new Error("top-up was not signed");

  onStage?.("confirming");
  const res = await fetch(`${REGISTRY_URL}/wallet/topup`, {
    method: "POST",
    headers: { ...auth, "x-payment": toB64(signed) },
  });
  if (!res.ok) throw await apiError(res, "top-up");
  return res.json();
}
