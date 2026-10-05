import assert from "node:assert/strict";
import { createServer } from "node:http";
import express from "express";
import { router, runEffects } from "./routes.js";
import { config } from "./config.js";
import { getLease, nodeBusy, leaseEffects } from "./leases.js";
import { upsertNode, registryEffects } from "./registry.js";
import { providerFor } from "./providers/index.js";
import type { PaidRequest } from "./x402/paywall.js";

registryEffects.optedIn = async () => false;
config.modalTokenId = "fixture"; config.modalTokenSecret = "fixture";
const micro = await upsertNode({ id: "fixture-micro", ownerAddr: "owner", payToAddr: "owner", label: "micro", cpuCores: 2, ramMb: 4096,
  gpu: null, runtime: "microvm", kvm: true, pricePerHourUsd: 9, capabilities: { ssh: true, python: true, notebook: true, jupyter: true } });
await upsertNode({ id: "fixture-docker", ownerAddr: "owner", payToAddr: "owner", label: "docker", cpuCores: 8, ramMb: 16000,
  gpu: null, runtime: "docker", kvm: false, pricePerHourUsd: .01 });
let modalCreates = 0, starts = 0, settles = 0, chargeRows = 0, payoutRows = 0, bootFailure = false;
let pendingLease = "", cleanupAck: (() => void) | undefined;
runEffects.connected = () => true;
runEffects.balance = async () => 1000000;
runEffects.payment = async () => ({ facts: { payer: "payer", txid: "fixture-tx" }, settle: async () => { settles++; return true; } } as unknown as PaidRequest);
leaseEffects.charge = async (args) => { chargeRows++; return { charged: args.usedAtomic, balance: 1000000 }; };
leaseEffects.payout = async () => { payoutRows++; };
leaseEffects.destroy = async (lease) => {
  assert.equal(nodeBusy(lease.nodeId), true, "peer remains reserved until cleanup");
  if (bootFailure) await new Promise<void>((resolve) => { cleanupAck = resolve; });
};
const contributor = providerFor("contributor"), modal = providerFor("modal");
contributor.start = async (args) => {
  starts++; pendingLease = args.leaseId;
  assert.equal(args.node.id, micro.id); assert.equal(nodeBusy(micro.id), true);
  if (bootFailure) throw new Error("injected Firecracker boot failure");
  return null;
};
contributor.exec = async (args) => ({ ok: true, result: "guest output", ...(args.notebook ? { notebook: args.notebook, artifacts: [] } : {}) });
modal.start = async () => { modalCreates++; throw new Error("Modal must not open"); };
const app = express(); app.use(express.json()); app.use(router);
const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address(); assert.ok(address && typeof address === "object");
const base = `http://127.0.0.1:${address.port}`;
const post = (body: object) => fetch(`${base}/x402/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
try {
  const inventory = await (await fetch(`${base}/explorer`)).json() as { nodes: { provider: string }[]; notebooks: boolean };
  assert.equal(inventory.nodes.filter((n) => n.provider === "modal").length, 3);
  assert.equal(inventory.notebooks, true);
  const python = await post({ payload: "print('hello')" }); assert.equal(python.status, 200);
  const notebook = await post({ notebook: { nbformat: 4, nbformat_minor: 5, cells: [], metadata: {} } });
  assert.equal(notebook.status, 200); assert.ok((await notebook.json() as { notebook: object }).notebook);
  assert.equal(starts, 2); assert.equal(modalCreates, 0); assert.equal(settles, 2); assert.equal(chargeRows, 2); assert.equal(payoutRows, 0);
  bootFailure = true;
  const failed = post({ notebook: { nbformat: 4, cells: [], metadata: {} } });
  for (let i = 0; i < 100 && !cleanupAck; i++) await new Promise((r) => setTimeout(r, 5));
  assert.ok(cleanupAck); assert.equal(getLease(pendingLease)?.status, "stopping"); assert.equal(nodeBusy(micro.id), true);
  assert.equal(modalCreates, 0); assert.equal(settles, 2);
  cleanupAck(); assert.equal((await failed).status, 503);
  assert.equal(nodeBusy(micro.id), false); assert.equal(starts, 3); assert.equal(chargeRows, 2); assert.equal(modalCreates, 0);
  console.log("HTTP placement: peer wins Python/notebook, hosted inventory, reservation and no boot fallthrough ok");
} finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
