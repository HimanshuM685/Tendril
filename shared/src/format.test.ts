/**
 * Self-check for the money helpers. Run: npx tsx shared/src/format.test.ts
 *
 * Two things must hold on the money path: a compact format must never round a
 * real charge away to "0", and a prorated quote must never come out below what
 * was actually used — that would make a refund larger than the block bought.
 */
import assert from "node:assert/strict";
import {
  atomicPerHour,
  networkDefaults,
  formatUsdc,
  formatUsdcExact,
  fundedSeconds,
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

// ── how long credit funds a session ──
// A session has no chosen duration: it runs until credit can no longer pay for
// the next second. Getting this wrong either cuts people off early or lets them
// run up a bill they cannot cover.
const hourly = atomicPerHour(1.0); // 1 USDC/hr

assert.equal(fundedSeconds(1_000_000, hourly), 3600); // exactly an hour
assert.equal(fundedSeconds(250_000, hourly), 900); // a quarter of it
assert.equal(fundedSeconds(0, hourly), 0); // no credit, no session
assert.equal(fundedSeconds(-5, hourly), 0); // never negative

// Floors rather than rounds: promising a second the credit can't pay for is the
// one direction that leaves the platform out of pocket.
assert.equal(fundedSeconds(999_999, hourly), 3599);

// A free node has no rate to run down, so there is nothing for credit to limit.
// `null` forces callers to say what they mean instead of dividing by zero.
assert.equal(fundedSeconds(0, 0), null);
assert.equal(fundedSeconds(1_000_000, 0), null);

// The round trip has to agree with the meter: whatever the funded window is,
// billing it must not exceed the credit that funded it.
for (const credit of [10_000, 250_000, 999_999, 5_000_000]) {
  const seconds = fundedSeconds(credit, hourly)!;
  assert.ok(
    proratedCost(hourly, seconds) <= credit,
    `funded ${seconds}s costs more than the ${credit} that funded it`,
  );
}

console.log("funding window ok");

// ── network switch ──
// One value picks the chain. The failure this guards against is a half-applied
// switch: mainnet CAIP-2 paired with the testnet USDC id would send real
// payments to an asset that doesn't exist there.
const testnet = networkDefaults("testnet");
const mainnet = networkDefaults("mainnet");

assert.equal(networkDefaults(undefined).network, "testnet", "unset must not mean mainnet");
assert.equal(networkDefaults("MainNet").network, "mainnet", "case/whitespace tolerant");
assert.equal(networkDefaults(" testnet ").network, "testnet");
assert.throws(() => networkDefaults("mainet"), /unknown Algorand network/, "typo must throw, not default");

// Nothing may be shared between the two: an id that appears on both sides is a
// copy-paste slip that would silently point mainnet at testnet infrastructure.
for (const key of ["caip2", "algodUrl", "explorerUrl"] as const) {
  assert.notEqual(testnet[key], mainnet[key], `${key} is identical on both networks`);
}
assert.notEqual(testnet.asset.id, mainnet.asset.id, "USDC asset id is identical on both networks");
assert.equal(testnet.asset.id, "10458941");
assert.equal(mainnet.asset.id, "31566704");

// The x402 SDK truncates the genesis hash to 32 chars; ours is the full form.
// `startsWith` is what makes the two spellings interchangeable at registration.
assert.ok(testnet.caip2.startsWith("algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe"));
assert.ok(mainnet.caip2.startsWith("algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k"));

console.log("network switch ok");
