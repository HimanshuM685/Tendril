import algosdk from "algosdk";
import type { CustomProvider } from "@txnlab/use-wallet";
import type { WalletAccount } from "@txnlab/use-wallet";
import { getMagic, OAUTH_REDIRECT } from "./magic";

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function flattenTxnGroup<T>(txnGroup: T | T[]): T[] {
  return Array.isArray(txnGroup[0]) ? (txnGroup as T[][]).flat() : (txnGroup as T[]);
}

function isTransactionArray(
  txnGroup: algosdk.Transaction[] | Uint8Array[] | algosdk.Transaction[][] | Uint8Array[][],
): txnGroup is algosdk.Transaction[] | algosdk.Transaction[][] {
  const flat = flattenTxnGroup(txnGroup);
  return flat.length > 0 && flat[0] instanceof algosdk.Transaction;
}

function isSignedTxn(decoded: unknown): boolean {
  return typeof decoded === "object" && decoded !== null && "sig" in decoded;
}

async function accountFromMagic(): Promise<WalletAccount> {
  const magic = getMagic();
  const address = (await magic.algorand.getWallet()) as string;
  const info = await magic.user.getInfo();
  return {
    name: info.email ?? "Magic Wallet",
    address,
  };
}

/** use-wallet CustomProvider wrapping Magic email OTP + Google OAuth for Algorand. */
export function createMagicWalletProvider(): CustomProvider {
  let cachedAddress: string | null = null;

  async function resolveAddress(): Promise<string> {
    if (cachedAddress) return cachedAddress;
    const account = await accountFromMagic();
    cachedAddress = account.address;
    return account.address;
  }

  return {
    async connect(args) {
      const magic = getMagic();

      if (args?.provider === "google") {
        await magic.oauth2.loginWithRedirect({
          provider: "google",
          redirectURI: OAUTH_REDIRECT,
        });
        return [];
      }

      if (args?.email && typeof args.email === "string") {
        await magic.auth.loginWithEmailOTP({ email: args.email, showUI: true });
        const account = await accountFromMagic();
        cachedAddress = account.address;
        return [account];
      }

      if (!(await magic.user.isLoggedIn())) {
        throw new Error("Not logged in");
      }

      const account = await accountFromMagic();
      cachedAddress = account.address;
      return [account];
    },

    async disconnect() {
      cachedAddress = null;
      await getMagic().user.logout();
    },

    async resumeSession() {
      const magic = getMagic();
      if (!(await magic.user.isLoggedIn())) return;
      const account = await accountFromMagic();
      cachedAddress = account.address;
      return [account];
    },

    async signTransactions(txnGroup, indexesToSign) {
      const magic = getMagic();
      const address = await resolveAddress();
      const addresses = [address];

      type SignTxn = { txn: string; signers?: string[] };
      let txnsToSign: SignTxn[] = [];

      if (isTransactionArray(txnGroup)) {
        const flatTxns = flattenTxnGroup(txnGroup);
        txnsToSign = flatTxns.map((txn, index) => {
          const isIndexMatch = !indexesToSign || indexesToSign.includes(index);
          const signer = txn.sender.toString();
          const canSignTxn = addresses.includes(signer);
          const txnString = toB64(txn.toByte());
          return isIndexMatch && canSignTxn
            ? { txn: txnString }
            : { txn: txnString, signers: [] };
        });
      } else {
        const flatTxns = flattenTxnGroup(txnGroup as Uint8Array[] | Uint8Array[][]);
        txnsToSign = flatTxns.map((txnBuffer, index) => {
          const decodedObj = algosdk.msgpackRawDecode(txnBuffer);
          const isSigned = isSignedTxn(decodedObj);
          const txn = isSigned
            ? algosdk.decodeSignedTransaction(txnBuffer).txn
            : algosdk.decodeUnsignedTransaction(txnBuffer);
          const isIndexMatch = !indexesToSign || indexesToSign.includes(index);
          const signer = txn.sender.toString();
          const canSignTxn = !isSigned && addresses.includes(signer);
          const txnString = toB64(txn.toByte());
          return isIndexMatch && canSignTxn
            ? { txn: txnString }
            : { txn: txnString, signers: [] };
        });
      }

      const signTxnsResult = await magic.algorand.signGroupTransactionV2(txnsToSign);
      return signTxnsResult.map((value) => (value === undefined ? null : fromB64(value)));
    },
  };
}
