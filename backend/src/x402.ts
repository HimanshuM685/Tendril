import type { Response } from "express";
import { ALGORAND_TESTNET_CAIP2, type PaymentRequired } from "@tendril/shared";
import { config } from "./config.js";

/**
 * x402 for top-ups. Top-up is the single point where money enters Tendril, so
 * it is the single place we speak HTTP 402: an unpaid request gets a challenge
 * naming the exact amount + payTo, the client signs a native ALGO `pay` txn and
 * retries with `X-PAYMENT`. Everything downstream spends the prepaid balance.
 *
 * The challenge is sent both as the `PAYMENT-REQUIRED` header (base64 JSON, so
 * agents can read it without parsing a body) and as the response body.
 */
export function sendPaymentRequired(
  res: Response,
  amountMicroAlgos: number,
  description: string,
): void {
  const challenge: PaymentRequired = {
    x402Version: 2,
    error: "Payment required",
    accepts: [
      {
        scheme: "exact",
        network: ALGORAND_TESTNET_CAIP2,
        payTo: config.platformPayTo,
        amount: String(amountMicroAlgos),
        asset: "ALGO",
        description,
        maxTimeoutSeconds: 120,
      },
    ],
  };
  res.setHeader("PAYMENT-REQUIRED", b64(challenge));
  res.status(402).json(challenge);
}

/** Receipt for a settled payment, mirrored back on `X-PAYMENT-RESPONSE`. */
export function sendPaymentReceipt(res: Response, txid: string): void {
  res.setHeader("X-PAYMENT-RESPONSE", b64({ success: true, txid, network: ALGORAND_TESTNET_CAIP2 }));
}

function b64(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}
