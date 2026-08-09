import algosdk from "algosdk";
import type { GasRequestInfo, WalletAccountResponse } from "@tendril/shared";
import { REGISTRY_URL, apiError, fetchPlatform } from "../api";
import type { SignTransactions } from "../wallet";
import { ALGOD_URL } from "./network";

const algod = new algosdk.Algodv2("", ALGOD_URL, "");

/** On-chain balances without sign-in (read-only via algod). */
export async function fetchOnchainBalances(address: string): Promise<{
  algoMicro: number;
  usdcAtomic: number;
  usdcOptedIn: boolean;
}> {
  const platform = await fetchPlatform();
  const assetId = Number(platform.asset.id);
  const info = await algod.accountInformation(address).do();
  const algoMicro = Number(info.amount);
  let usdcAtomic = 0;
  let usdcOptedIn = false;
  const holding = info.assets?.find((a) => Number(a.assetId) === assetId);
  if (holding) {
    usdcOptedIn = true;
    usdcAtomic = Number(holding.amount);
  }
  return { algoMicro, usdcAtomic, usdcOptedIn };
}

export async function fetchWalletAccount(token: string): Promise<WalletAccountResponse> {
  const res = await fetch(`${REGISTRY_URL}/auth/wallet/account`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "wallet account");
  return res.json();
}

export async function fetchWalletGasRequest(token: string): Promise<GasRequestInfo | null> {
  const res = await fetch(`${REGISTRY_URL}/auth/wallet/gas-request`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "gas request");
  return res.json();
}

export async function submitWalletGasRequest(token: string): Promise<GasRequestInfo> {
  const res = await fetch(`${REGISTRY_URL}/auth/wallet/gas-request`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await apiError(res, "gas request");
  return res.json();
}

export async function optInUsdcWithWallet(
  address: string,
  sign: SignTransactions,
): Promise<string> {
  const platform = await fetchPlatform();
  const assetId = Number(platform.asset.id);
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    assetIndex: assetId,
    amount: 0n,
    suggestedParams,
  });
  const [signed] = await sign([txn.toByte()]);
  if (!signed) throw new Error("opt-in cancelled");
  const { txid } = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, txid, 8);
  return txid;
}
