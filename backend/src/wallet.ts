import algosdk from "algosdk";
import nacl from "tweetnacl";
import { config } from "./config.js";

// Public Algod node — used to read asset opt-ins and to send contributor payouts.
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

// Deposits are not confirmed here any more. Money enters only through
// POST /x402/topup, where the facilitator verifies and settles the payment
// group; see x402/server.ts.
