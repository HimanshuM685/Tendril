import { x402Client } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { ALGORAND_TESTNET_CAIP2 as AVM_TESTNET_CAIP2 } from "@x402/avm";
import { decodePaymentResponseHeader, wrapFetchWithPayment } from "@x402/fetch";
import { ALGORAND_TESTNET_CAIP2, type PaymentReceipt } from "@tendril/shared";

/** use-wallet's signTransactions signature — also exactly `ClientAvmSigner`. */
export type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

const ALGOD_URL =
  (import.meta.env.VITE_ALGOD_URL as string | undefined) ?? "https://testnet-api.algonode.cloud";

/**
 * Where a paid request is, so the UI can say more than "working…". Settling
 * takes seconds on-chain, and silence reads as failure.
 */
export type PayStage = "signing" | "settling";

/**
 * A `fetch` that pays x402 challenges with the connected wallet.
 *
 * The browser is an x402 client like any other: on a 402 it reads `accepts`,
 * builds the atomic group (asset transfer + the facilitator's unsigned fee-payer
 * txn when `extra.feePayer` is set), signs only our transaction, and retries
 * with `PAYMENT-SIGNATURE`. That is the same code path the headless buyer runs,
 * so both produce byte-identical payloads for the same purchase.
 *
 * Wallet popups: exactly one, and only when the server actually asks for money.
 * A request the credit balance covers never sees a 402, so it never signs.
 */
export function payingFetch(
  address: string,
  sign: SignTransactions,
  onStage?: (stage: PayStage) => void,
): typeof globalThis.fetch {
  const scheme = new ExactAvmScheme({ address, signTransactions: sign }, { algodUrl: ALGOD_URL });
  // The two spellings of testnet's CAIP-2 id are registered against one scheme:
  // @x402/avm uses the 32-char genesis prefix, our shared constant the full
  // hash. Whichever the registry quotes, a scheme is registered for it.
  const client = new x402Client()
    .register(AVM_TESTNET_CAIP2, scheme)
    .register(ALGORAND_TESTNET_CAIP2, scheme);
  if (onStage) {
    client.onBeforePaymentCreation(async () => void onStage("signing"));
    client.onAfterPaymentCreation(async () => void onStage("settling"));
  }
  return wrapFetchWithPayment(fetch, client) as typeof globalThis.fetch;
}

/** The settled-payment receipt a paid response carries, or null if it was free. */
export function receiptFrom(res: Response): PaymentReceipt | null {
  const header = res.headers.get("PAYMENT-RESPONSE");
  if (!header) return null;
  try {
    const settled = decodePaymentResponseHeader(header);
    return settled.transaction
      ? { txid: settled.transaction, network: String(settled.network) }
      : null;
  } catch {
    // A receipt we can't parse is not worth failing a successful purchase over.
    return null;
  }
}
