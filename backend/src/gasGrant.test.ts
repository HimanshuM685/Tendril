/**
 * Gas grant eligibility rules.
 * Run: npx tsx backend/src/gasGrant.test.ts
 */
import assert from "node:assert/strict";
import {
  canSubmitGasGrant,
  shouldMarkGasGrantIneligible,
} from "./gasGrant.js";

// Self-fund before any request → permanently ineligible.
assert.equal(shouldMarkGasGrantIneligible(false, 0), false, "zero balance stays eligible");
assert.equal(
  shouldMarkGasGrantIneligible(false, 260_000),
  true,
  "nonzero balance without a request marks ineligible",
);
assert.equal(
  shouldMarkGasGrantIneligible(true, 500_000),
  false,
  "existing gas request row skips ineligible flip",
);

// Submit gate: exactly zero ALGO, eligible, no prior row.
assert.equal(canSubmitGasGrant(true, 0, false), true, "new zero-balance account may request");
assert.equal(canSubmitGasGrant(false, 0, false), false, "self-funded user blocked at zero");
assert.equal(canSubmitGasGrant(true, 1, false), false, "nonzero balance blocked");
assert.equal(canSubmitGasGrant(true, 0, true), false, "duplicate request blocked by row");

console.log("gasGrant.test.ts: ok");
