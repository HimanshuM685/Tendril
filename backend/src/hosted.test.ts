/**
 * Hosted CPU price stays inside 25–40% over Modal's sandbox rate, and hosted
 * rows stay listed after any peers.
 *
 *   npx tsx backend/src/hosted.test.ts
 */
import assert from "node:assert/strict";
import {
  E2B_NOTEBOOK_GIB,
  E2B_NOTEBOOK_VCPU,
  E2B_USD_PER_GIB_SECOND,
  E2B_USD_PER_VCPU_SECOND,
  E2B_GIB_OPTIONS,
  E2B_PRESETS,
  E2B_VCPU_OPTIONS,
  e2bCostPerHour,
  e2bNode,
  e2bPriceTable,
  e2bSizeId,
  isE2bSize,
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

// E2B: 2 vCPU + 4 GiB = $0.000046/s = $0.1656/h. Price stays 20–30% over cost, rounded up to the cent.
{
  const cost = e2bCostPerHour(E2B_NOTEBOOK_VCPU, E2B_NOTEBOOK_GIB);
  assert.equal(Math.round(cost * 10000) / 10000, 0.1656);
  assert.equal(
    cost,
    (E2B_NOTEBOOK_VCPU * E2B_USD_PER_VCPU_SECOND + E2B_NOTEBOOK_GIB * E2B_USD_PER_GIB_SECOND) * 3600,
  );
  const price = e2bHourlyUsd(E2B_NOTEBOOK_VCPU, E2B_NOTEBOOK_GIB, 0.25);
  assert.equal(price, 0.21);
  assert.ok(price / cost >= 1.2 && price / cost <= 1.3);
  assert.ok(e2bHourlyUsd(2, 4, 0.9) / cost <= 1.3);
  assert.ok(e2bHourlyUsd(2, 4, 0) / cost >= 1.2);
  // Every default-size-or-bigger E2B config stays inside the band.
  for (const [v, g] of [[1, 1], [2, 4], [4, 8], [8, 8]] as const) {
    const c = e2bCostPerHour(v, g);
    const p = e2bHourlyUsd(v, g, 0.25);
    assert.ok(p / c >= 1.2 && p / c <= 1.3, `${v}vCPU/${g}GiB ratio ${p / c}`);
  }
}
assert.ok(isHosted("modal") && isHosted("e2b") && !isHosted("contributor"));
assert.equal(hostedCatalog().find((n) => n.id === "hosted-e2b-c2-m4")?.provider, "e2b");

// Every size on E2B's chart is priced 20–30% over its own cost — never at a loss.
{
  const table = e2bPriceTable();
  assert.equal(Object.keys(table).length, E2B_VCPU_OPTIONS.length * E2B_GIB_OPTIONS.length);
  for (const vCpu of E2B_VCPU_OPTIONS) {
    for (const memGiB of E2B_GIB_OPTIONS) {
      const cost = e2bCostPerHour(vCpu, memGiB);
      const price = table[e2bSizeId({ vCpu, memGiB })];
      assert.ok(price > cost, `c${vCpu}-m${memGiB} price ${price} not above cost ${cost}`);
      const margin = price / cost;
      assert.ok(margin >= 1.2 - 1e-9 && margin <= 1.3 + 1e-9, `c${vCpu}-m${memGiB} margin ${margin}`);
    }
  }
  assert.equal(table["c2-m4"], 0.21);
  for (const p of E2B_PRESETS) assert.ok(isE2bSize(p.vCpu, p.memGiB));
  assert.ok(!isE2bSize(3, 4) && !isE2bSize(2, 16));
  const node = e2bNode({ vCpu: 4, memGiB: 8 });
  assert.equal(node.id, "hosted-e2b-c4-m8");
  assert.equal(node.cpuCores, 4);
  assert.equal(node.ramMb, 8192);
  assert.equal(node.pricePerHourUsd, table["c4-m8"]);
}

console.log("hosted: ok");
