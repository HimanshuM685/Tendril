import algosdk from "algosdk";
import { config } from "./config.js";
import { algod } from "./wallet.js";

/**
 * Load the platform's custodial signing key from PLATFORM_PRIVATE_KEY (a base64
 * 64-byte ed25519 key, seed||pubkey — same format the contributor uses). Lazily
 * decoded so the backend can still boot for read-only/dev use without it.
 */
function loadPlatformKey(): { addr: string; sk: Uint8Array } {
  if (!config.platformPrivateKey) {
    throw new Error("PLATFORM_PRIVATE_KEY is not configured — cannot pay contributors");
  }
  const sk = new Uint8Array(Buffer.from(config.platformPrivateKey, "base64"));
  if (sk.length !== 64) {
    throw new Error(
      `PLATFORM_PRIVATE_KEY must be a base64 64-byte key (got ${sk.length} bytes)`,
    );
  }
  return { addr: algosdk.encodeAddress(sk.slice(32)), sk };
}

/** True if the backend is configured to send on-chain payouts. */
export function payoutsEnabled(): boolean {
  return !!config.platformPrivateKey;
}

/**
 * Send `amountMicroAlgos` from the platform custodial wallet to a contributor's
 * payout address, on-chain. Returns the confirmed txid. Throws on any failure
 * (the caller logs it and records the payout as failed — usage is still billed).
 */
export async function payContributor(toAddr: string, amountMicroAlgos: number): Promise<string> {
  if (amountMicroAlgos <= 0) {
    throw new Error("payout amount must be positive");
  }
  const { addr, sk } = loadPlatformKey();
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: addr,
    receiver: toAddr,
    amount: amountMicroAlgos,
    suggestedParams,
  });
  const signed = txn.signTxn(sk);
  const { txid } = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, txid, 8);
  return txid;
}
