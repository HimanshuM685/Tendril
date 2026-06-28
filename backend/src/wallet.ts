import algosdk from "algosdk";
import nacl from "tweetnacl";
import { config } from "./config.js";

// Public Algod node — used to broadcast + confirm top-up deposits and payouts.
export const algod = new algosdk.Algodv2("", config.algodUrl, "");

function decodeSigned(paymentB64: string): { raw: Uint8Array; signed: algosdk.SignedTransaction } {
  const raw = new Uint8Array(Buffer.from(paymentB64, "base64"));
  return { raw, signed: algosdk.decodeSignedTransaction(raw) };
}

function noteText(txn: algosdk.Transaction): string {
  return txn.note ? Buffer.from(txn.note).toString("utf8") : "";
}

/**
 * Verify a login proof: a `pay` txn signed by `address` with `note == nonce`.
 * We check the ed25519 signature directly (no on-chain submit needed — a 0-ALGO
 * self-payment never has to settle), proving the user controls the address.
 */
export function verifyLoginSignature(address: string, paymentB64: string, nonce: string): boolean {
  let signed: algosdk.SignedTransaction;
  let txn: algosdk.Transaction;
  try {
    ({ signed } = decodeSigned(paymentB64));
    txn = signed.txn;
  } catch {
    return false;
  }
  if (!signed.sig) return false;
  if (txn.type !== algosdk.TransactionType.pay) return false;
  if (txn.sender.toString() !== address) return false;
  if (noteText(txn) !== nonce) return false;
  try {
    const pk = algosdk.decodeAddress(address).publicKey;
    return nacl.sign.detached.verify(txn.bytesToSign(), signed.sig, pk);
  } catch {
    return false;
  }
}

export interface SettledTopUp {
  txid: string;
  amountMicroAlgos: number;
}

/**
 * Broadcast + confirm a top-up: a `pay` txn from `address` to the platform
 * custodial address. Returns the txid + amount so the caller can credit the
 * wallet (idempotently, keyed by txid). Throws on any mismatch or settle error.
 */
export async function settleTopUp(address: string, paymentB64: string): Promise<SettledTopUp> {
  if (!config.platformPayTo) {
    throw new Error("PLATFORM_PAYTO is not configured on the server");
  }
  const { raw, signed } = decodeSigned(paymentB64);
  const txn = signed.txn;

  if (
    txn.type !== algosdk.TransactionType.pay ||
    !txn.payment ||
    txn.sender.toString() !== address ||
    txn.payment.receiver.toString() !== config.platformPayTo ||
    txn.payment.amount <= 0n
  ) {
    throw new Error("top-up transaction must pay ALGO from your wallet to the platform address");
  }

  const txid = txn.txID();
  // Tolerate "already submitted" on a retry — what matters is that it confirms.
  await algod.sendRawTransaction(raw).do().catch(() => undefined);
  await algosdk.waitForConfirmation(algod, txid, 8);

  return { txid, amountMicroAlgos: Number(txn.payment.amount) };
}
