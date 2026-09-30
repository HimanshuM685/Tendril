/**
 * Hosted CPU price stays inside 25–40% over Modal's sandbox rate, and hosted
 * rows show only when the peer list is empty.
 *
 *   npx tsx backend/src/hosted.test.ts
 */
import assert from "node:assert/strict";
import {
  HOSTED_SKUS,
  hostedHourlyUsd,
  modalUsdPerHour,
  withHostedFallback,
} from "./hosted.js";

for (const sku of HOSTED_SKUS) {
  const gib = sku.ramMb / 1024;
  const modal = modalUsdPerHour(sku.physicalCores, gib);
  const price = hostedHourlyUsd(sku.physicalCores, gib, 0.3);
  const ratio = price / modal;
  assert.ok(ratio >= 1.25 && ratio <= 1.4, `${sku.id} ratio ${ratio} left the 25–40% band`);
}

assert.equal(hostedHourlyUsd(1, 4, 0.3), 0.31);
assert.equal(hostedHourlyUsd(2, 8, 0.3), 0.62);
assert.equal(hostedHourlyUsd(4, 16, 0.3), 1.24);

// A markup outside the band is clamped, and cent rounding cannot escape it.
{
  const modal = modalUsdPerHour(1, 4);
  const high = hostedHourlyUsd(1, 4, 0.9);
  const low = hostedHourlyUsd(1, 4, 0);
  assert.ok(high / modal <= 1.4);
  assert.ok(low / modal >= 1.25);
}

assert.deepEqual(withHostedFallback(["peer"], ["hosted"]), ["peer"]);
assert.deepEqual(withHostedFallback([], ["hosted-cpu-2"]), ["hosted-cpu-2"]);

console.log("hosted: ok");
