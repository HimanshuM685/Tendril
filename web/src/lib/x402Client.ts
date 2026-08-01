import { x402Client } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { normalizeAlgorandNetwork } from "@x402/avm";
import { decodePaymentResponseHeader, wrapFetchWithPayment } from "@x402/fetch";
import type { PaymentReceipt } from "@tendril/shared";
import { ALGOD_URL, network } from "./network";

/** use-wallet's signTransactions signature — also exactly `ClientAvmSigner`. */
export type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

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
  const scheme = new ExactAvmScheme(
    { address, signTransactions: serialize(sign) },
    { algodUrl: ALGOD_URL },
  );
  // Both spellings of the network's CAIP-2 id are registered against one scheme:
  // @x402/avm uses the 32-char genesis prefix, our shared constant the full
  // hash. Whichever the registry quotes, a scheme is registered for it.
  const client = new x402Client()
    .register(network.caip2, scheme)
    .register(normalizeAlgorandNetwork(network.caip2), scheme);
  if (onStage) {
    client.onBeforePaymentCreation(async () => void onStage("signing"));
    client.onAfterPaymentCreation(async () => void onStage("settling"));
  }
  const paying = wrapFetchWithPayment(fetch, client) as typeof globalThis.fetch;
  return async (input, init) => {
    try {
      return await paying(input, init);
    } catch (err) {
      throw readableWalletError(err);
    }
  };
}

/**
 * Wallets take one signing request at a time. Pera and Defly reject a second one
 * outright — "Confirmation Failed(4100) … another transaction request in
 * progress" — and since a paid request can be fired from anywhere in the app
 * (top up here, rent there), two can overlap without either caller knowing.
 *
 * So the queue lives at the signer, the single point every payment funnels
 * through, rather than in a `busy` flag on each button. A second payment now
 * waits for the wallet instead of failing.
 */
let walletQueue: Promise<unknown> = Promise.resolve();

function serialize(sign: SignTransactions): SignTransactions {
  return (txns, indexesToSign) => {
    // `.then(f, f)` rather than `.then(f)`: a rejected predecessor (the user hit
    // reject) must hand the wallet on, not wedge the queue behind it.
    const run = walletQueue.then(
      () => sign(txns, indexesToSign),
      () => sign(txns, indexesToSign),
    );
    walletQueue = run.catch(() => undefined);
    return run;
  };
}

/** Turn wallet error codes into something a person can act on. */
function readableWalletError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (/\b4100\b|another transaction request in progress/i.test(message)) {
    return new Error(
      "Your wallet already has a signing request open. Approve or dismiss it and try again — " +
        "if you can't see one, disconnect and reconnect the wallet to clear it.",
    );
  }
  if (/\b4001\b|user rejected|request rejected|cancelled by user/i.test(message)) {
    return new Error("Payment cancelled in the wallet.");
  }
  return err instanceof Error ? err : new Error(message);
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
