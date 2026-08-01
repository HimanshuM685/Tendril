import algosdk from "algosdk";
import type {
  WalletLoginResponse,
  WalletNonceResponse,
  X402TopUpResponse,
} from "@tendril/shared";
import { usdToAtomic } from "@tendril/shared";
import { REGISTRY_URL, apiError } from "./api";
import { payingFetch, type PayStage, type SignTransactions } from "./lib/x402Client";

export type { SignTransactions };

const ALGOD_URL =
  (import.meta.env.VITE_ALGOD_URL as string | undefined) ?? "https://testnet-api.algonode.cloud";
const algod = new algosdk.Algodv2("", ALGOD_URL, "");

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Sign in: prove control of `address` by signing the login nonce as the note of
 * a 0-ALGO self-payment (never broadcast — just verified). This is NOT how money
 * gets in; it only unlocks reading and spending an existing credit balance.
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

export type TopUpStage = PayStage;

/**
 * Top up over x402: `POST /x402/topup?amount=<atomic>`. The endpoint takes no
 * session — the payment itself proves who is paying, and the credit lands on
 * the *sending* address, so this must be signed by a wallet the user controls.
 */
export async function topUp(
  address: string,
  sign: SignTransactions,
  amountUsdc: number,
  onStage?: (stage: TopUpStage) => void,
): Promise<X402TopUpResponse> {
  const amount = usdToAtomic(amountUsdc);
  const res = await payingFetch(address, sign, onStage)(
    `${REGISTRY_URL}/x402/topup?amount=${amount}`,
    { method: "POST" },
  );
  if (!res.ok) throw await apiError(res, "top-up");
  return res.json();
}
