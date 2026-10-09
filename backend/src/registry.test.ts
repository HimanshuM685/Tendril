/**
 * Node selection for a leaseless `/x402/run`: the caller names no machine, so
 * this function is the whole decision. Run: npx tsx backend/src/registry.test.ts
 *
 * Worth a test because "cheapest" is the obvious wrong answer — a slow machine
 * at half the rate that takes three times as long costs more, and the caller has
 * no way to see that happen.
 */
import assert from "node:assert/strict";
import { pickBestValueNode, upsertNode } from "./registry.js";

const free = () => true;

const add = (label: string, cpuCores: number, ramMb: number, pricePerHourUsd: number) =>
  upsertNode({
    id: label,
    ownerAddr: "OWNER",
    payToAddr: "PAYTO",
    label,
    cpuCores,
    ramMb,
    gpu: null,
    pricePerHourUsd,
  });

// No nodes at all -> null, not a throw. The caller turns this into a 503.
assert.equal(pickBestValueNode(free), null);

await add("tiny-cheap", 1, 1024, 0.10); // score 1.25/0.10 = 12.5
await add("beefy-mid", 8, 32768, 0.50); // score 10/0.50    = 20
await add("beefy-dear", 8, 32768, 2.00); // score 10/2.00   = 5

// Not the cheapest — the one that gives the most machine per dollar.
assert.equal(pickBestValueNode(free)?.id, "beefy-mid");

// A busy or disconnected node is not a candidate, however good its value.
assert.equal(pickBestValueNode((id) => id !== "beefy-mid")?.id, "tiny-cheap");

// A free node wins outright: it costs nothing however long the job runs.
await add("donated", 2, 2048, 0);
assert.equal(pickBestValueNode(free)?.id, "donated");

// Equal value -> the cheaper machine, so a thin balance is not sent somewhere
// expensive for no gain.
// Both score (cores + GB/4) / price = 5.
await add("twin-a", 4, 4096, 1.00);
await add("twin-b", 2, 2048, 0.50);
assert.equal(
  pickBestValueNode((id) => id.startsWith("twin"))?.id,
  "twin-b",
);

console.log("node selection ok");
