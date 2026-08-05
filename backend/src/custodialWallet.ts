import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import algosdk from "algosdk";
import { config } from "./config.js";
import type { DbUser } from "./db.js";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function encryptionKey(): Buffer {
  if (!config.walletEncryptionKey) {
    throw new Error("WALLET_ENCRYPTION_KEY is not configured");
  }
  const key = Buffer.from(config.walletEncryptionKey, "base64");
  if (key.length !== 32) {
    throw new Error("WALLET_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  }
  return key;
}

/** Encrypt a mnemonic for storage. Returns `iv:tag:ciphertext` (base64 segments). */
export function encryptMnemonic(mnemonic: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(mnemonic, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

/** Decrypt a stored mnemonic. */
export function decryptMnemonic(blob: string): string {
  const [ivB64, tagB64, dataB64] = blob.split(":");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("corrupt encrypted mnemonic");
  const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export interface CustodialAccount {
  address: string;
  mnemonic: string;
  secretKey: Uint8Array;
}

export function generateCustodialAccount(): { address: string; encryptedMnemonic: string } {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  return {
    address: account.addr.toString(),
    encryptedMnemonic: encryptMnemonic(mnemonic),
  };
}

export function accountFromUser(user: DbUser): CustodialAccount {
  const mnemonic = decryptMnemonic(user.encrypted_mnemonic);
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  return { address: account.addr.toString(), mnemonic, secretKey: account.sk };
}

export function signTransactions(
  account: CustodialAccount,
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
): (Uint8Array | null)[] {
  const toSign = indexesToSign ?? txnGroup.map((_, i) => i);
  return txnGroup.map((txnBytes, i) => {
    if (!toSign.includes(i)) return null;
    return algosdk.decodeUnsignedTransaction(txnBytes).signTxn(account.secretKey);
  });
}
