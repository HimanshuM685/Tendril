/**
 * Self-check for the network identifier. Run: npx tsx backend/src/x402/network.test.ts
 *
 * Algorand testnet's CAIP-2 id has two spellings in circulation:
 *
 *   full  algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=   (whole genesis hash)
 *   short algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe               (CAIP-2 caps the
 *                                                                  reference at 32 chars)
 *
 * `@x402/avm` exports the short one; the GoPlausible facilitator advertises the
 * full one in `/supported`. The backend matches the facilitator by exact string
 * to find the fee payer, so it must quote the full form — and getting this wrong
 * breaks nothing at startup and everything at the first payment.
 *
 * That makes it exactly the constant someone "tidies up" into a bug.
 */
import assert from "node:assert/strict";
import { ALGORAND_TESTNET_CAIP2 } from "@tendril/shared";
import {
  ALGORAND_TESTNET_CAIP2 as AVM_TESTNET_CAIP2,
  isAlgorandNetwork,
  normalizeAlgorandNetwork,
  getNetworkFromCaip2,
} from "@x402/avm";
import { config } from "../config.js";

// Ours is the full genesis hash — what the facilitator publishes.
assert.equal(
  ALGORAND_TESTNET_CAIP2,
  "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "shared's constant must be the FULL genesis hash the facilitator advertises",
);

// The two spellings really are different, and ours is not the SDK's.
assert.notEqual(ALGORAND_TESTNET_CAIP2, AVM_TESTNET_CAIP2);
assert.ok(ALGORAND_TESTNET_CAIP2.startsWith(AVM_TESTNET_CAIP2), "same hash, ours just isn't truncated");

// @x402/avm accepts either and normalises inward, so quoting the full form to
// clients costs nothing on the signing side.
for (const network of [ALGORAND_TESTNET_CAIP2, AVM_TESTNET_CAIP2]) {
  assert.ok(isAlgorandNetwork(network), `${network} should be recognised`);
  assert.equal(getNetworkFromCaip2(network), "testnet");
  assert.equal(normalizeAlgorandNetwork(network), AVM_TESTNET_CAIP2);
}

// And the backend must default to ours, not the SDK's — this is the line that
// decides whether `/supported` lookups find the fee payer.
if (!process.env.X402_NETWORK) {
  assert.equal(
    config.x402Network,
    ALGORAND_TESTNET_CAIP2,
    "config.x402Network must default to the full-hash form",
  );
}

console.log("network id ok");
