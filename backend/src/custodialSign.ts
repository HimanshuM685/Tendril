import { randomUUID } from "node:crypto";
import algosdk from "algosdk";
import { formatUsdc } from "@tendril/shared";
import type { SignPrepareResponse } from "@tendril/shared";
import { issueGoogleSession } from "./auth.js";
import { config } from "./config.js";
import { accountFromUser } from "./custodialWallet.js";
import { custodialPayingFetchForUser, internalRegistryUrl } from "./custodialX402.js";
import { findUserById } from "./db.js";
import { algod } from "./wallet.js";
import { hasOptedIn } from "./payout.js";
import { creditBalance } from "./x402/credit.js";

const TTL_MS = 2 * 60 * 1000;

export type PrepareAction =
  | { action: "topup"; amountAtomic: number }
  | { action: "optin" }
  | { action: "rent"; nodeId: string; sshPubKey?: string | null; surface?: "ssh" | "jupyter" }
  | { action: "run"; code?: string; notebook?: Record<string, unknown>; minRamMb?: number }
  | { action: "release"; leaseId: string; leaseToken: string }
  | { action: "mintkey"; label?: string };

interface PendingRequest {
  userId: string;
  summary: string;
  details: string;
  expiresAt: number;
  run: () => Promise<unknown>;
}

const pending = new Map<string, PendingRequest>();

function prune() {
  const now = Date.now();
  for (const [id, req] of pending) {
    if (req.expiresAt <= now) pending.delete(id);
  }
}

export async function prepareCustodialSign(
  userId: string,
  body: PrepareAction,
): Promise<SignPrepareResponse> {
  prune();
  const user = await findUserById(userId);
  if (!user) throw new Error("user not found");

  const requestId = randomUUID();
  let summary = "";
  let details = "";
  let run: () => Promise<unknown>;

  switch (body.action) {
    case "topup": {
      summary = `Top up ${formatUsdc(body.amountAtomic)}`;
      details = `Credit your prepaid balance from on-chain USDC.`;
      const amount = body.amountAtomic;
      const url = `${internalRegistryUrl()}/x402/topup?amount=${amount}`;
      run = async () => {
        const pay = custodialPayingFetchForUser(user);
        const res = await pay(url, { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `top-up failed (${res.status})`);
        }
        return res.json();
      };
      break;
    }
    case "optin": {
      summary = "Opt in to USDC";
      details = `Allow this wallet to hold USDC (asset ${config.assetId}) for payments.`;
      run = async () => {
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
        return { txid };
      };
      break;
    }
    case "rent": {
      summary = `Rent node ${body.nodeId}`;
      details = `Open a metered session (gate fee applies).`;
      const nodeId = body.nodeId;
      const sshPubKey = body.sshPubKey ?? null;
      const surface = body.surface === "jupyter" ? "jupyter" : undefined;
      const url =
        `${internalRegistryUrl()}/x402/rent?nodeId=${encodeURIComponent(nodeId)}` +
        (surface ? `&surface=${surface}` : "");
      run = async () => {
        const pay = custodialPayingFetchForUser(user);
        const res = await pay(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...(sshPubKey ? { sshPubKey } : {}),
            ...(surface ? { surface } : {}),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `rent failed (${res.status})`);
        }
        return res.json();
      };
      break;
    }
    case "run": {
      summary = "Run code (leaseless)";
      details = `Execute a one-shot job; billed from credit when done.`;
      const url = `${internalRegistryUrl()}/x402/run`;
      const requestBody = body.notebook
        ? { notebook: body.notebook }
        : { payload: body.code };
      run = async () => {
        const pay = custodialPayingFetchForUser(user);
        const res = await pay(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `run failed (${res.status})`);
        }
        return res.json();
      };
      break;
    }
    case "release": {
      summary = `Release lease ${body.leaseId.slice(0, 8)}…`;
      details = `Close the session and bill for time used.`;
      const leaseId = body.leaseId;
      const token = body.leaseToken;
      const url = `${internalRegistryUrl()}/x402/leases/${encodeURIComponent(leaseId)}`;
      run = async () => {
        const pay = custodialPayingFetchForUser(user);
        const res = await pay(url, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `release failed (${res.status})`);
        }
        return res.json();
      };
      break;
    }
    case "mintkey": {
      const label = String(body.label ?? "").slice(0, 64);
      const fee = formatUsdc(config.flatMintKeyAtomic);
      summary = `Mint contributor API key`;
      details = `One-time ${fee} on-chain fee. Earnings pay to your custodial wallet.`;
      const sessionToken = issueGoogleSession(user.id, user.address, user.email);
      const url = `${internalRegistryUrl()}/x402/keys`;
      run = async () => {
        const pay = custodialPayingFetchForUser(user);
        const res = await pay(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ label }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? `mint key failed (${res.status})`);
        }
        return res.json();
      };
      break;
    }
    default:
      throw new Error("unknown action");
  }

  pending.set(requestId, {
    userId,
    summary,
    details,
    expiresAt: Date.now() + TTL_MS,
    run,
  });

  return { requestId, summary, details };
}

export async function confirmCustodialSign(
  userId: string,
  requestId: string,
): Promise<unknown> {
  prune();
  const req = pending.get(requestId);
  if (!req) throw new Error("request expired or not found");
  if (req.userId !== userId) throw new Error("forbidden");
  pending.delete(requestId);
  return req.run();
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

/** Rate limit export-key: 3 per hour per user. */
const exportLog = new Map<string, number[]>();

export function checkExportRateLimit(userId: string): boolean {
  const now = Date.now();
  const window = exportLog.get(userId) ?? [];
  const recent = window.filter((t) => now - t < 3_600_000);
  if (recent.length >= 3) return false;
  recent.push(now);
  exportLog.set(userId, recent);
  return true;
}

export async function exportMnemonicForUser(userId: string): Promise<string> {
  const user = await findUserById(userId);
  if (!user) throw new Error("user not found");
  return accountFromUser(user).mnemonic;
}
