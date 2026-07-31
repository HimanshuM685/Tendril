/**
 * Self-check for ALGO display formatting. Run: npx tsx shared/src/format.test.ts
 * Money path — a compact format must never round a real charge away to "0".
 */
import assert from "node:assert/strict";
import { formatAlgo, formatAlgoExact } from "./index.js";

// Whole and near-whole amounts lose the noise.
assert.equal(formatAlgo(60_000_000), "60 ALGO");
assert.equal(formatAlgo(120_000_000), "120 ALGO");
assert.equal(formatAlgo(10_384_700), "10.38 ALGO");
assert.equal(formatAlgo(10_300_000), "10.3 ALGO");

// Sub-1 amounts keep enough digits to stay truthful — prorated charges live here.
assert.equal(formatAlgo(4_200), "0.0042 ALGO");
assert.equal(formatAlgo(100_000), "0.1 ALGO");
assert.equal(formatAlgo(1), "<0.0001 ALGO"); // never print a nonzero amount as plain "0"
assert.equal(formatAlgo(0), "0 ALGO");
assert.equal(formatAlgo(-500_000), "-0.5 ALGO");

// Exact keeps every digit, for ledger rows and tooltips.
assert.equal(formatAlgoExact(60_000_000), "60.0000 ALGO");
assert.equal(formatAlgoExact(4_200), "0.0042 ALGO");

console.log("format ok");
