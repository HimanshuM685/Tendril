/**
 * Hosted CPU price stays inside 25–40% over Modal's sandbox rate, and hosted
 * rows stay listed after any peers.
 *
 *   npx tsx backend/src/hosted.test.ts
 */
import assert from "node:assert/strict";
import {
  E2B_NOTEBOOK_VCPU,
  E2B_USD_PER_VCPU_SECOND,
  HOSTED_SKUS,
  e2bHourlyUsd,
  hostedCatalog,
  isHosted,
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

assert.equal(Math.round(modalUsdPerHour(1, 4) * 10000) / 10000, 0.0793);
assert.equal(hostedHourlyUsd(1, 4, 0.3), 0.11);
assert.equal(hostedHourlyUsd(2, 8, 0.3), 0.21);
assert.equal(hostedHourlyUsd(4, 16, 0.3), 0.42);

// A markup outside the band is clamped, and cent rounding cannot escape it.
{
  const modal = modalUsdPerHour(1, 4);
  const high = hostedHourlyUsd(1, 4, 0.9);
  const low = hostedHourlyUsd(1, 4, 0);
  assert.ok(high / modal <= 1.4);
  assert.ok(low / modal >= 1.25);
}

assert.deepEqual(withHostedFallback(["peer"], ["hosted"]), ["peer", "hosted"]);
assert.deepEqual(withHostedFallback([], ["hosted-cpu-2"]), ["hosted-cpu-2"]);

// E2B: 2 vCPU at $0.000014/vCPU-s = $0.1008/h; same 25–40% band, rounded up to the cent.
{
  const e2b = E2B_NOTEBOOK_VCPU * E2B_USD_PER_VCPU_SECOND * 3600;
  const price = e2bHourlyUsd(E2B_NOTEBOOK_VCPU, 0.3);
  assert.equal(price, 0.14);
  assert.ok(price / e2b >= 1.25 && price / e2b <= 1.4);
  assert.ok(e2bHourlyUsd(2, 0.9) / e2b <= 1.4);
  assert.ok(e2bHourlyUsd(2, 0) / e2b >= 1.25);
}
assert.ok(isHosted("modal") && isHosted("e2b") && !isHosted("contributor"));
assert.equal(hostedCatalog().find((n) => n.id === "hosted-e2b-cpu-2")?.provider, "e2b");

console.log("hosted: ok");
