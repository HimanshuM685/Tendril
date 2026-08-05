/**
 * x402 V2 plumbing — the only door money comes through.
 *
 * Both payable endpoints follow the same shape:
 *
 *   no payment header      -> `challenge()`  : 402 + PaymentRequirements
 *   payment header present -> `readPayment()`: decode
 *                             `verify()`     : facilitator simulates, no submit
 *                             ...provision...
 *                             `settle()`     : facilitator signs the fee payer
 *                                              transaction and submits
 *
 * The gap between verify and settle is the point: nothing goes on chain until
 * the thing being bought is confirmed working, so a failed provision costs the
 * caller nothing.
 *
 * We drive `HTTPFacilitatorClient` directly rather than mounting the express
 * middleware because prices here are a function of the URL plus live server
 * state, and because the middleware settles around the handler — which would
 * take the caller's money before we know the sandbox came up.
 */
import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
  decodePaymentSignatureHeader,
} from "@x402/core/http";
import type {
  Network,
  PaymentPayload,
  PaymentRequired,
  PaymentRequirements,
  SettleResponse,
} from "@x402/core/types";
import { decodeTransaction, getSenderFromTransaction, getTransactionId } from "@x402/avm";
import type { AssetInfo } from "@tendril/shared";
import { discoveryExtensions, serviceMetadata, type RouteDiscovery } from "./discovery.js";
import { config } from "../config.js";
import { q } from "../db.js";

/** CAIP-2 id of the one network we take payment on. */
export const network = config.x402Network as Network;

export const facilitator = new HTTPFacilitatorClient({ url: config.facilitatorUrl });

/** The asset every price in Tendril is denominated in. */
export const asset: AssetInfo = {
  id: config.assetId,
  decimals: config.assetDecimals,
  symbol: config.assetSymbol,
};

/**
 * The facilitator's fee-payer address, from its own `/supported`. It goes in
 * `extra.feePayer` on every challenge, which is what lets a client hold the
 * asset and zero ALGO: the facilitator signs the fee transaction and the
 * platform absorbs the cost. It is never itemised and never charged for.
 *
 * Cached for the process lifetime — it changes about as often as the
 * facilitator is redeployed, and a stale value fails loudly at verify().
 */
let feePayerCache: string | null | undefined;
export async function feePayer(): Promise<string | null> {
  if (feePayerCache !== undefined) return feePayerCache;
  const supported = await facilitator.getSupported();
  const kind = supported.kinds.find(
    (k) => k.x402Version === 2 && k.scheme === "exact" && k.network === network,
  );
  feePayerCache = (kind?.extra?.feePayer as string | undefined) ?? null;
  return feePayerCache;
}

/**
 * Confirm at boot that the facilitator actually supports the network we quote.
 *
 * `X402_NETWORK` is matched against the facilitator's `/supported` by exact
 * string, and Algorand's testnet CAIP-2 id has two spellings in the wild: the
 * full genesis hash (`…xi9/cOUJOiI=`, which this facilitator advertises) and the
 * 32-char form CAIP-2 truncates it to (`…FmnrCDe`, which `@x402/avm` exports as
 * its constant). Pick the wrong one and nothing breaks at startup — every
 * payment just fails later with an opaque facilitator error. So check it here,
 * loudly, while someone is still watching the logs.
 *
 * Non-fatal: a facilitator blip should not stop the registry from serving the
 * free endpoints.
 */
export async function checkFacilitator(): Promise<void> {
  let supported;
  try {
    supported = await facilitator.getSupported();
  } catch (err) {
    console.warn(
      `[x402] could not reach facilitator ${config.facilitatorUrl}: ${(err as Error).message}\n` +
        `       payments will fail until it is reachable.`,
    );
    return;
  }

  const exact = supported.kinds.filter((k) => k.x402Version === 2 && k.scheme === "exact");
  const kind = exact.find((k) => k.network === network);
  if (!kind) {
    console.error(
      `[x402] facilitator ${config.facilitatorUrl} does not support ${network}.\n` +
        `       it offers: ${exact.map((k) => k.network).join(", ") || "(nothing)"}\n` +
        `       set X402_NETWORK to one of those, byte for byte — every payment fails until it matches.`,
    );
    return;
  }

  const sponsor = (kind.extra?.feePayer as string | undefined) ?? null;
  feePayerCache = sponsor;
  console.log(
    `[x402] facilitator ok — ${network}, fee payer ` +
      (sponsor ? `${sponsor} (clients need no ALGO)` : "NOT offered (clients must hold ALGO for fees)"),
  );
}

/** Build the single payment option we accept for `amountAtomic`. */
export async function requirements(amountAtomic: number): Promise<PaymentRequirements> {
  if (!config.platformPayTo) {
    throw new Error("PLATFORM_PAYTO is not configured on the server");
  }
  const sponsor = await feePayer();
  return {
    scheme: "exact",
    network,
    amount: String(amountAtomic),
    asset: config.assetId,
    payTo: config.platformPayTo,
    maxTimeoutSeconds: config.x402MaxTimeoutSeconds,
    extra: {
      decimals: config.assetDecimals,
      name: config.assetSymbol,
      ...(sponsor ? { feePayer: sponsor } : {}),
      // Attribution for the facilitator's activity tracking. Payments settle
      // with or without it; without it they just aren't counted as ours.
      tag: config.x402Tag,
    },
  };
}

/**
 * Answer with 402 and what it would take to satisfy this exact request.
 * The amount is recomputed from the URL and live state every time — there is no
 * quote table and no quote id, so a challenge cannot go stale in a way that
 * matters: a client that pays a price we no longer agree with is rejected and
 * re-challenged.
 */
export async function challenge(
  req: Request,
  res: Response,
  amountAtomic: number,
  description: string,
  error = "Payment required",
  discovery?: RouteDiscovery,
): Promise<void> {
  const body: PaymentRequired = {
    x402Version: 2,
    error,
    // `resource` is copied verbatim onto the payment payload by any v2 client,
    // and it is where the Bazaar reads our name, tags and icon from.
    resource: {
      // Canonical URL, not the one that was called: a legacy path-parameter
      // alias must not mint its own catalog row. See RouteDiscovery.
      url: resourceUrl(req, discovery?.routeTemplate),
      description,
      mimeType: "application/json",
      ...serviceMetadata(),
    },
    accepts: [await requirements(amountAtomic)],
    ...(discovery ? { extensions: discoveryExtensions(discovery) } : {}),
  };
  // The header, not the body, is what a v2 client reads — `getPaymentRequiredResponse`
  // looks at PAYMENT-REQUIRED first and only falls back to the body for v1. The
  // discovery extension has to be in the encoded header or it never reaches the
  // payload, and the resource is never cataloged.
  res.setHeader("PAYMENT-REQUIRED", encodePaymentRequiredHeader(body));
  res.status(402).json(body);
}

/**
 * Canonical absolute URL of the resource being paid for.
 *
 * `canonicalPath` is the endpoint's fixed path. Passing it is what keeps one
 * endpoint to one catalog entry: without it the URL carries whatever node id,
 * lease id or `?amount=` this particular call used, and the Bazaar records each
 * variant as a separate resource. Callers that have no discovery declaration
 * fall back to the request URL.
 *
 * Behind a proxy `req.get("host")` is the internal host, which would catalog us
 * under something unreachable — set PUBLIC_BASE_URL in that case.
 */
export function resourceUrl(req: Request, canonicalPath?: string): string {
  const base = config.publicBaseUrl || `${req.protocol}://${req.get("host") ?? "localhost"}`;
  return `${base}${canonicalPath ?? req.originalUrl}`;
}

/**
 * The signed payment from the request, or null if there isn't one.
 * `PAYMENT-SIGNATURE` is the V2 header; `X-PAYMENT` is accepted as the V1 alias
 * so older clients keep working.
 */
export function readPayment(req: Request): PaymentPayload | null {
  const header = req.header("payment-signature") ?? req.header("x-payment");
  if (!header) return null;
  return decodePaymentSignatureHeader(header);
}

/** Details of the transaction a payment payload actually authorises. */
export interface PaymentFacts {
  /** Sender of the payment transaction — the only trustworthy payer identity. */
  payer: string;
  /** Its transaction id, known before settlement (the group is already formed). */
  txid: string;
  /** sha256 over the payload, so a replay is recognisable before it is settled. */
  intentHash: string;
}

/**
 * Read who is paying straight off the transaction rather than trusting anything
 * the client said about itself. `?payer=` is a hint for pricing only; this is
 * the identity that gets credited and charged.
 */
export function paymentFacts(payload: PaymentPayload): PaymentFacts {
  const { paymentGroup, paymentIndex } = payload.payload as {
    paymentGroup?: unknown;
    paymentIndex?: unknown;
  };
  if (!Array.isArray(paymentGroup) || typeof paymentIndex !== "number") {
    throw new Error("payment payload is not an AVM transaction group");
  }
  const encoded = paymentGroup[paymentIndex];
  if (typeof encoded !== "string") {
    throw new Error(`paymentIndex ${paymentIndex} is not in paymentGroup`);
  }
  const txn = decodeTransaction(encoded);
  return {
    payer: getSenderFromTransaction(txn),
    txid: getTransactionId(txn),
    intentHash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
  };
}

/** Mirror a settled payment back to the caller on the response header. */
export function sendReceipt(res: Response, settlement: SettleResponse): void {
  const encoded = encodePaymentResponseHeader(settlement);
  res.setHeader("PAYMENT-RESPONSE", encoded);
  res.setHeader("X-PAYMENT-RESPONSE", encoded); // V1 alias
}

/** The facilitator is unreachable, or the platform is misconfigured. */
export function fail(res: Response, err: unknown): void {
  const message = (err as Error).message;
  console.error("[x402]", message);
  res.status(502).json({ error: "facilitator_unavailable", detail: message });
}

// ───────────────────────── payment records ─────────────────────────

export type PaymentRoute = "topup" | "rent" | "run" | "mintkey";

export interface PaymentRow {
  txid: string;
  payer: string;
  route: PaymentRoute;
  amount_atomic: number;
  status: "pending" | "settled" | "failed";
}

/** A previously seen payment with this exact payload, if any. */
export async function findPayment(intentHash: string): Promise<PaymentRow | null> {
  const rows = await q<PaymentRow>("SELECT * FROM x402_payments WHERE intent_hash = $1", [
    intentHash,
  ]);
  return rows[0] ?? null;
}

/**
 * Claim a payment before settling it. Written first so that a crash between
 * submit and commit leaves a `pending` row naming the txid, rather than money
 * on chain that nothing in the database knows about.
 */
export async function markPending(
  facts: PaymentFacts,
  route: PaymentRoute,
  amountAtomic: number,
): Promise<void> {
  await q(
    `INSERT INTO x402_payments (txid, intent_hash, payer, route, amount_atomic, asset_id, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)
     ON CONFLICT (txid) DO NOTHING`,
    [
      facts.txid,
      facts.intentHash,
      facts.payer,
      route,
      amountAtomic,
      Number(config.assetId),
      Date.now(),
    ],
  );
}

export async function markSettled(txid: string): Promise<void> {
  await q("UPDATE x402_payments SET status = 'settled', settled_at = $2 WHERE txid = $1", [
    txid,
    Date.now(),
  ]);
}

export async function markFailed(txid: string): Promise<void> {
  await q("UPDATE x402_payments SET status = 'failed' WHERE txid = $1", [txid]);
}
