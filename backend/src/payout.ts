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

/** Platform wallet address derived from PLATFORM_PRIVATE_KEY. */
export function platformAddress(): string {
  if (config.platformPayTo) return config.platformPayTo;
  if (!config.platformPrivateKey) {
    throw new Error("PLATFORM_PAYTO or PLATFORM_PRIVATE_KEY required");
  }
  return loadPlatformKey().addr;
}

/**
 * Send `amountAtomic` of the payment asset from the platform custodial wallet to
 * a contributor's payout address, on-chain. Returns the confirmed txid. Throws on
 * any failure (the caller records the payout as unpaid — usage is still billed).
 *
 * An ASA transfer only lands if the receiver has opted in, hence `hasOptedIn`
 * at registration time and `payoutBlocked` on the node.
 */
export async function payContributor(toAddr: string, amountAtomic: number): Promise<string> {
  if (amountAtomic <= 0) {
    throw new Error("payout amount must be positive");
  }
  const { addr, sk } = loadPlatformKey();
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: addr,
    receiver: toAddr,
    assetIndex: Number(config.assetId),
    amount: amountAtomic,
    suggestedParams,
  });
  const signed = txn.signTxn(sk);
  const { txid } = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, txid, 8);
  return txid;
}

/** Send native ALGO from the platform wallet (gas grants). */
export async function sendAlgo(toAddr: string, microAlgos: number): Promise<string> {
  if (microAlgos <= 0) throw new Error("ALGO amount must be positive");
  const { addr, sk } = loadPlatformKey();
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: addr,
    receiver: toAddr,
    amount: microAlgos,
    suggestedParams,
  });
  const signed = txn.signTxn(sk);
  const { txid } = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, txid, 8);
  return txid;
}

export interface PlatformBalances {
  address: string;
  algoMicro: number;
  usdcAtomic: number;
  usdcOptedIn: boolean;
}

/** On-chain balances for the platform treasury wallet. */
export async function platformBalances(): Promise<PlatformBalances> {
  const address = platformAddress();
  const info = await algod.accountInformation(address).do();
  let usdcAtomic = 0;
  const optedIn = await hasOptedIn(address);
  if (optedIn) {
    try {
      const asset = await algod.accountAssetInformation(address, Number(config.assetId)).do();
      usdcAtomic = Number(asset.assetHolding?.amount ?? 0);
    } catch {
      /* zero */
    }
  }
  return {
    address,
    algoMicro: Number(info.amount),
    usdcAtomic,
    usdcOptedIn: optedIn,
  };
}

/**
 * Whether `address` can receive the payment asset. Algorand requires an explicit
 * opt-in, and a transfer to an address that has not opted in fails outright — so
 * a contributor who skipped it would silently never get paid.
 *
 * Network errors resolve to `true`: a node registration should not be downgraded
 * because algod blipped. A payout that then fails is recorded unpaid anyway.
 */
export async function hasOptedIn(address: string): Promise<boolean> {
  try {
    await algod.accountAssetInformation(address, Number(config.assetId)).do();
    return true;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return false;
    return true;
  }
}
