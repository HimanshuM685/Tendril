import { randomUUID } from "node:crypto";
import algosdk from "algosdk";
import { formatUsdc } from "@tendril/shared";
import type { NotebookRuntimeOptions, SignPrepareResponse } from "@tendril/shared";
import { issueGoogleSession } from "./auth.js";
import { config } from "./config.js";
import { accountFromUser } from "./custodialWallet.js";
import { custodialPayingFetchForUser, internalRegistryUrl } from "./custodialX402.js";
import { findUserById, type DbUser } from "./db.js";
import { consumeSignRequest, insertSignRequest } from "./securityDb.js";
import { canonicalJson, payloadHash } from "./signIntent.js";
import { algod } from "./wallet.js";
import { hasOptedIn } from "./payout.js";
import { creditBalance } from "./x402/credit.js";

const TTL_MS = 2 * 60 * 1000;

async function failPaid(res: globalThis.Response, what: string): Promise<never> {
  const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
  const message = [err.error, err.detail].filter(Boolean).join(": ");
  throw new Error(message || `${what} failed (${res.status})`);
}

export type PrepareAction =
  | { action: "topup"; amountAtomic: number }
  | { action: "optin" }
  | { action: "rent"; nodeId: string; sshPubKey?: string | null; surface?: "ssh" | "jupyter" }
  | { action: "run"; code?: string; notebook?: Record<string, unknown>; minRamMb?: number; lane?: "contributor" | "priority" | "e2b"; e2b?: { vCpu: number; memGiB: number }; runtime?: NotebookRuntimeOptions }
  | { action: "release"; leaseId: string; leaseToken: string }
  | { action: "mintkey"; label?: string };

/** Opt a custodial wallet into the payment asset (zero-amount self-transfer). */
export async function optInUsdc(user: DbUser): Promise<string> {
  const account = accountFromUser(user);
  const suggestedParams = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: account.address,
    receiver: account.address,
    assetIndex: Number(config.assetId),
    amount: 0,
    suggestedParams,
  });
  const signed = txn.signTxn(account.secretKey);
  const { txid } = await algod.sendRawTransaction(signed).do();
  await algosdk.waitForConfirmation(algod, txid, 8);
  return txid;
}

function describe(body: PrepareAction): { summary: string; details: string } {
  switch (body.action) {
    case "topup":
      return {
        summary: `Top up ${formatUsdc(body.amountAtomic)}`,
        details: `Credit your prepaid balance from on-chain USDC.`,
      };
    case "optin":
      return {
        summary: "Opt in to USDC",
        details: `Allow this wallet to hold USDC (asset ${config.assetId}) for payments.`,
      };
    case "rent":
      return {
        summary: `Rent node ${body.nodeId}`,
        details: `Open a metered session (gate fee applies).`,
      };
    case "run":
      return {
        summary: "Run code (leaseless)",
        details: `Execute a one-shot job; billed from credit when done.`,
      };
    case "release":
      return {
        summary: `Release lease ${body.leaseId.slice(0, 8)}…`,
        details: `Close the session and bill for time used.`,
      };
    case "mintkey":
      return {
        summary: `Mint contributor API key`,
        details: `One-time ${formatUsdc(config.flatMintKeyAtomic)} on-chain fee. Earnings pay to your custodial wallet.`,
      };
    default:
      throw new Error("unknown action");
  }
}

/** Every custodial spend. Confirm runs this from the stored payload, not a new browser body. */
export async function executeCustodialAction(user: DbUser, body: PrepareAction): Promise<unknown> {
  const pay = custodialPayingFetchForUser(user);
  switch (body.action) {
    case "topup": {
      const res = await pay(`${internalRegistryUrl()}/x402/topup?amount=${body.amountAtomic}`, { method: "POST" });
      if (!res.ok) await failPaid(res, "top-up");
      return res.json();
    }
    case "optin":
      return { txid: await optInUsdc(user) };
    case "rent": {
      const surface = body.surface === "jupyter" ? "jupyter" : undefined;
      const url =
        `${internalRegistryUrl()}/x402/rent?nodeId=${encodeURIComponent(body.nodeId)}` +
        (surface ? `&surface=${surface}` : "");
      const res = await pay(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(body.sshPubKey ? { sshPubKey: body.sshPubKey } : {}),
          ...(surface ? { surface } : {}),
        }),
      });
      if (!res.ok) await failPaid(res, "rent");
      return res.json();
    }
    case "run": {
      const requestBody = body.notebook
        ? {
            notebook: body.notebook,
            ...(body.lane ? { lane: body.lane } : {}),
            ...(body.e2b ? { e2b: body.e2b } : {}),
            ...(body.runtime ? { runtime: body.runtime } : {}),
          }
        : { payload: body.code };
      const res = await pay(`${internalRegistryUrl()}/x402/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) await failPaid(res, "run");
      return res.json();
    }
    case "release": {
      const res = await pay(`${internalRegistryUrl()}/x402/leases/${encodeURIComponent(body.leaseId)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${body.leaseToken}` },
      });
      if (!res.ok) await failPaid(res, "release");
      return res.json();
    }
    case "mintkey": {
      const label = String(body.label ?? "").slice(0, 64);
      const sessionToken = issueGoogleSession(user.id, user.address, user.email, user.auth_epoch ?? 0);
      const res = await pay(`${internalRegistryUrl()}/x402/keys`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) await failPaid(res, "mint key");
      return res.json();
    }
    default:
      throw new Error("unknown action");
  }
}

export async function prepareCustodialSign(
  userId: string,
  body: PrepareAction,
  clientRequestId?: string | null,
): Promise<SignPrepareResponse> {
  const user = await findUserById(userId);
  if (!user) throw new Error("user not found");
  const { summary, details } = describe(body);
  const payloadJson = canonicalJson(body);
  const now = Date.now();
  const row = await insertSignRequest({
    id: randomUUID(),
    userId,
    action: body.action,
    payloadJson,
    payloadHash: payloadHash(payloadJson),
    summary,
    details,
    status: "pending",
    expiresAt: now + TTL_MS,
    consumedAt: null,
    createdAt: now,
    clientRequestId: clientRequestId || null,
  });
  return { requestId: row.id, summary: row.summary, details: row.details };
}

export async function confirmCustodialSign(userId: string, requestId: string): Promise<unknown> {
  const row = await consumeSignRequest(requestId, userId);
  if (!row || payloadHash(row.payloadJson) !== row.payloadHash) {
    throw new Error("request expired or not found");
  }
  const user = await findUserById(userId);
  if (!user) throw new Error("user not found");
  const body = JSON.parse(row.payloadJson) as PrepareAction;
  return executeCustodialAction(user, body);
}

export interface GoogleAccountInfo {
  address: string;
  algoMicro: number;
  usdcAtomic: number;
  usdcOptedIn: boolean;
  prepaidCreditAtomic: number;
}

export async function googleAccountInfo(address: string): Promise<GoogleAccountInfo> {
  const info = await algod.accountInformation(address).do();
  const algoMicro = Number(info.amount);
  let usdcAtomic = 0;
  const optedIn = await hasOptedIn(address);
  if (optedIn) {
    try {
      const asset = await algod.accountAssetInformation(address, Number(config.assetId)).do();
      usdcAtomic = Number(asset.assetHolding?.amount ?? 0);
    } catch {
      /* treat as zero */
    }
  }
  return {
    address,
    algoMicro,
    usdcAtomic,
    usdcOptedIn: optedIn,
    prepaidCreditAtomic: await creditBalance(address),
  };
}

export async function exportMnemonicForUser(userId: string): Promise<string> {
  const user = await findUserById(userId);
  if (!user) throw new Error("user not found");
  return accountFromUser(user).mnemonic;
}
