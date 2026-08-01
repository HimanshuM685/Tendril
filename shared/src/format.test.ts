/**
 * Self-check for the money helpers. Run: npx tsx shared/src/format.test.ts
 *
 * Two things must hold on the money path: a compact format must never round a
 * real charge away to "0", and a prorated quote must never come out below what
 * was actually used — that would make a refund larger than the block bought.
 */
import assert from "node:assert/strict";
import {
  applicableCredit,
  atomicPerHour,
  formatUsdc,
  formatUsdcExact,
  proratedCost,
  usdToAtomic,
} from "./index.js";

// ── display ──
// Whole and near-whole amounts lose the noise.
assert.equal(formatUsdc(60_000_000), "60 USDC");
assert.equal(formatUsdc(120_000_000), "120 USDC");
assert.equal(formatUsdc(10_384_700), "10.38 USDC");
assert.equal(formatUsdc(10_300_000), "10.3 USDC");

// Sub-1 amounts keep enough digits to stay truthful — prorated charges live here.
assert.equal(formatUsdc(4_200), "0.0042 USDC");
assert.equal(formatUsdc(100_000), "0.1 USDC");
assert.equal(formatUsdc(1), "<0.0001 USDC"); // never print a nonzero amount as plain "0"
assert.equal(formatUsdc(0), "0 USDC");
assert.equal(formatUsdc(-500_000), "-0.5 USDC");

// Exact keeps every digit, for ledger rows and tooltips.
assert.equal(formatUsdcExact(60_000_000), "60.000000 USDC");
assert.equal(formatUsdcExact(4_200), "0.004200 USDC");

// ── pricing ──
// A dollar is a dollar: no exchange rate, just the asset's 6 decimals.
assert.equal(usdToAtomic(1), 1_000_000);
assert.equal(usdToAtomic(0.25), 250_000);
assert.equal(atomicPerHour(1.0), 1_000_000);

// A 900s block at $1.00/hr is a quarter of the hourly rate.
const rate = atomicPerHour(1.0);
assert.equal(proratedCost(rate, 900), 250_000);
assert.equal(proratedCost(rate, 3600), 1_000_000);
assert.equal(proratedCost(rate, 0), 0);

// Rounding is UP, so the platform never undercharges by a sub-unit, and usage
// inside a paid block can never cost more than the block did.
assert.equal(proratedCost(rate, 1), 278); // 277.77… -> 278
const quote = proratedCost(rate, 900);
for (const seconds of [0, 1, 59, 60, 61, 599, 900]) {
  const used = proratedCost(rate, seconds);
  assert.ok(used <= quote, `used ${used} exceeded quote ${quote} at ${seconds}s`);
}

// ── credit discount ──
// Signed in: the whole balance can be spent, right down to a zero-cost rent.
const signedIn = { authenticated: true, minPayableAtomic: 10_000 };
assert.equal(applicableCredit(250_000, 1_000_000, signedIn), 250_000);
assert.equal(applicableCredit(250_000, 100_000, signedIn), 100_000);

// Not signed in: the discount is floored, so `?payer=<victim>` can never buy a
// lease for nothing — the payment must still come from the hinted address.
const anon = { authenticated: false, minPayableAtomic: 10_000 };
assert.equal(applicableCredit(250_000, 1_000_000, anon), 240_000); // 10_000 left to pay
assert.equal(applicableCredit(250_000, 100_000, anon), 100_000); // under the ceiling, unclamped
assert.equal(applicableCredit(5_000, 1_000_000, anon), 0); // quote below the floor: pay it all
assert.equal(applicableCredit(250_000, 0, anon), 0);

console.log("credit discount ok");
