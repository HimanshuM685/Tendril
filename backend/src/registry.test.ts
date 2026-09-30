/**
 * Node selection for a leaseless `/x402/run`: the caller names no machine, so
 * this function is the whole decision. Run: npx tsx backend/src/registry.test.ts
 *
 * Worth a test because "cheapest" is the obvious wrong answer — a slow machine
 * at half the rate that takes three times as long costs more, and the caller has
 * no way to see that happen.
 */
import assert from "node:assert/strict";
import type { ComputeNode } from "@tendril/shared";
import { chooseNode, upsertNode } from "./registry.js";

const free = () => true;
const peers: ComputeNode[] = [];

const add = async (label: string, cpuCores: number, ramMb: number, pricePerHourUsd: number) => {
  const node = await upsertNode({
    id: label,
    ownerAddr: "OWNER",
    payToAddr: "PAYTO",
    label,
    cpuCores,
    ramMb,
    gpu: null,
    pricePerHourUsd,
  });
  peers.push(node);
  return node;
};

function modalRow(id: string): ComputeNode {
  return {
    id,
    ownerAddr: "hosted",
    payToAddr: "",
    payoutBlocked: true,
    label: id,
    cpuCores: 2,
    ramMb: 4096,
    gpu: null,
    provider: "modal",
    runtime: "docker",
    kvm: false,
    pricePerHourUsd: 0.2,
    status: "online",
    lastHeartbeat: Date.now(),
    createdAt: 0,
  };
}

// No nodes at all -> null, not a throw. The caller turns this into a 503.
assert.equal(chooseNode([], [], free), null);

await add("tiny-cheap", 1, 1024, 0.10); // score 1.25/0.10 = 12.5
await add("beefy-mid", 8, 32768, 0.50); // score 10/0.50    = 20
await add("beefy-dear", 8, 32768, 2.00); // score 10/2.00   = 5

// Not the cheapest — the one that gives the most machine per dollar.
assert.equal(chooseNode(peers, [], free)?.id, "beefy-mid");

// A busy or disconnected node is not a candidate, however good its value.
assert.equal(chooseNode(peers, [], (id) => id !== "beefy-mid")?.id, "tiny-cheap");

// A free node wins outright: it costs nothing however long the job runs.
await add("donated", 2, 2048, 0);
assert.equal(chooseNode(peers, [], free)?.id, "donated");

// Equal value -> the cheaper machine, so a thin balance is not sent somewhere
// expensive for no gain.
// Both score (cores + GB/4) / price = 5.
await add("twin-a", 4, 4096, 1.00);
await add("twin-b", 2, 2048, 0.50);
assert.equal(
  chooseNode(peers, [], (id) => id.startsWith("twin"))?.id,
  "twin-b",
);

// An idle microVM peer is taken instead of Modal, even if Modal is cheaper.
const micro = await upsertNode({
  id: "micro-1",
  ownerAddr: "OWNER",
  payToAddr: "PAYTO",
  label: "micro-1",
  cpuCores: 1,
  ramMb: 1024,
  gpu: null,
  pricePerHourUsd: 9,
  runtime: "microvm",
  kvm: true,
});
const dockerPeer = peers[0];
const hosted = modalRow("hosted-cpu-2");
assert.equal(chooseNode([micro, dockerPeer], [hosted], free)?.id, "micro-1");
assert.notEqual(chooseNode([micro, dockerPeer], [hosted], free)?.provider, "modal");

// No idle microVM: Modal is allowed even while a Docker peer is online.
assert.equal(chooseNode([dockerPeer], [hosted], free)?.id, "hosted-cpu-2");

// A microVM ad without KVM is not the preferred peer.
const fake = await upsertNode({
  id: "fake-micro",
  ownerAddr: "OWNER",
  payToAddr: "PAYTO",
  label: "fake-micro",
  cpuCores: 8,
  ramMb: 8192,
  gpu: null,
  pricePerHourUsd: 0.01,
  runtime: "microvm",
  kvm: false,
});
assert.equal(chooseNode([fake], [hosted], free)?.provider, "modal");

console.log("node selection ok");
