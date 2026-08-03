/**
 * Self-check for the CORS boundary. Run: npx tsx backend/src/x402/cors.test.ts
 *
 * Which routes a stranger's browser may call is a security decision, and the
 * matcher deciding it is a list of regexes — exactly the kind of thing that
 * quietly starts matching one path too many.
 */
import assert from "node:assert/strict";
import { isPayablePath } from "./cors.js";

// Open: every route that answers 402. Anyone may pay.
for (const path of [
  "/topup",
  "/x402/topup",
  "/x402/rent",
  "/x402/run",
  "/rent/node_7f2",
  "/x402/rent/node_7f2",
  "/lease/lease_9k2m/run",
  "/lease/lease_9k2m/release",
  "/x402/leases/lease_9k2m",
]) {
  assert.ok(isPayablePath(path), `${path} should be open to any origin`);
}

// Closed: sign-in, the credit ledger, metrics, node lists. These stay behind
// CORS_ORIGIN — nothing about them is protected by a price.
for (const path of [
  "/",
  "/health",
  "/platform",
  "/wallet",
  "/metrics",
  "/explorer",
  "/nodes",
  "/keys",
  "/withdraw",
  "/auth/wallet-nonce",
  "/auth/wallet-login",
  "/lease/lease_9k2m", // GET lease status is free, so it is not open
]) {
  assert.ok(!isPayablePath(path), `${path} should stay behind CORS_ORIGIN`);
}

// Near-misses: a prefix or an extra segment must not slip through.
for (const path of [
  "/topups",
  "/topup/extra",
  "/x402/topupx",
  "/rent",
  "/rent/node_7f2/steal",
  "/lease/lease_9k2m/run/extra",
  "/x402/leases",
  "/wallet/topup", // the deleted endpoint must not be resurrected as an open one
]) {
  assert.ok(!isPayablePath(path), `${path} must not match a payable route`);
}

console.log("cors boundary ok");
