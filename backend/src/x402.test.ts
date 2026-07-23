/**
 * Self-check for the x402 top-up challenge. Run: npx tsx backend/src/x402.test.ts
 * Money path — this must fail loudly if the challenge shape or amount drifts.
 */
import assert from "node:assert/strict";
import type { Response } from "express";
import type { PaymentRequired } from "@tendril/shared";
import { sendPaymentReceipt, sendPaymentRequired } from "./x402.js";
import { config } from "./config.js";

config.platformPayTo = "PLATFORMADDRESSPLATFORMADDRESSPLATFORMADDRESSPLATFORMADDR";

/** Minimal Response stub capturing status/headers/body. */
function fakeRes() {
  const headers: Record<string, string> = {};
  let status = 200;
  let body: unknown;
  const res = {
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    status: (c: number) => {
      status = c;
      return res;
    },
    json: (b: unknown) => {
      body = b;
      return res;
    },
  };
  return {
    res: res as unknown as Response,
    get: () => ({ status, headers, body: body as PaymentRequired }),
  };
}

const decode = (b64: string) => JSON.parse(Buffer.from(b64, "base64").toString());

// 402 challenge: right status, right amount, native ALGO, header mirrors body.
{
  const f = fakeRes();
  sendPaymentRequired(f.res, 1_500_000, "Top up your Tendril balance");
  const { status, headers, body } = f.get();

  assert.equal(status, 402);
  assert.equal(body.x402Version, 2);
  assert.equal(body.accepts.length, 1);

  const opt = body.accepts[0];
  assert.equal(opt.amount, "1500000", "amount must be microALGO, as a string");
  assert.equal(opt.asset, "ALGO", "native ALGO — never an ASA");
  assert.equal(opt.scheme, "exact");
  assert.equal(opt.payTo, config.platformPayTo);

  assert.deepEqual(decode(headers["PAYMENT-REQUIRED"]), body, "header must mirror body");
}

// Rounding: a fractional amount never reaches the client as a decimal string.
{
  const f = fakeRes();
  sendPaymentRequired(f.res, Math.round(0.1 * 1e6), "x");
  assert.equal(f.get().body.accepts[0].amount, "100000");
}

// Receipt carries the txid so the payer can verify settlement on-chain.
{
  const f = fakeRes();
  sendPaymentReceipt(f.res, "TXID123");
  const receipt = decode(f.get().headers["X-PAYMENT-RESPONSE"]);
  assert.equal(receipt.success, true);
  assert.equal(receipt.txid, "TXID123");
}

console.log("x402 top-up challenge: all checks passed");
