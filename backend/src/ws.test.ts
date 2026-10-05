import assert from "node:assert/strict";
import { createServer } from "node:http";
import { io, type Socket } from "socket.io-client";
import { WS, type HelloAckMsg } from "@tendril/shared";
import { initWs, wsEffects, startContainer, destroyContainer, runJob, isNodeConnected } from "./ws.js";
import { registryEffects } from "./registry.js";
import { activateLease, closeLease, confirmLeasePayment, createLease, getLease, leaseEffects, nodeBusy } from "./leases.js";

const http = createServer(), hub = initWs(http);
await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
const addr = http.address(); assert.ok(addr && typeof addr === "object");
const url = `http://127.0.0.1:${addr.port}`;
wsEffects.ownerOfApiKey = async (key) => key === "owner" ? "fixture-owner" : "fixture-other";
registryEffects.optedIn = async () => true;
leaseEffects.destroy = (lease) => destroyContainer(lease.nodeId, lease.id);
leaseEffects.charge = async () => ({ charged: 0, balance: 1000000 });
const sockets: Socket[] = [];
async function connect(key: string, nodeId?: string) {
  const socket = io(url, { transports: ["websocket"], autoConnect: false }); sockets.push(socket);
  const ack = new Promise<HelloAckMsg>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("hello timeout")), 3000);
    socket.once(WS.helloAck, (msg) => { clearTimeout(timer); resolve(msg); });
  });
  socket.on("connect", () => socket.emit(WS.hello, { apiKey: key, nodeId, spec: {
    label: "socket fixture", cpuCores: 2, ramMb: 2048, gpu: null, pricePerHourUsd: 1,
    runtime: "microvm", kvm: true, capabilities: { ssh: true, python: true, notebook: true, jupyter: true },
  } }));
  socket.connect();
  return { socket, nodeId: (await ack).nodeId };
}
const pause = () => new Promise((resolve) => setTimeout(resolve, 50));
const access = { kind: "ssh" as const, host: "fixture.ssh.example.com", port: 20000,
  username: "root", authMethod: "publickey" as const, password: null, command: "ssh fixture" };
const leaseFor = (nodeId: string) => createLease({ nodeId, renterAddr: "payer", payerAddr: "payer", payToAddr: "owner",
  rateAtomicPerHour: 1000000, gateFeeAtomic: 10000, fundingAtomic: 1000000, paymentTxid: null, provider: "contributor" });
try {
  const agent = await connect("owner"), intruder = await connect("other");
  const lease = leaseFor(agent.nodeId);
  let resolved = false;
  const starting = startContainer({ nodeId: agent.nodeId, leaseId: lease.id, image: "", limits: { memory: "2g", cpus: 2, gpus: "" },
    sshPassword: null, sshPubKey: "fixture", surface: "ssh", timeoutMs: 3000 }).then((value) => { resolved = true; return value; });
  intruder.socket.emit(WS.containerReady, { leaseId: lease.id, host: "attacker", port: 22, access });
  await pause(); assert.equal(resolved, false, "another node cannot acknowledge readiness");
  agent.socket.emit(WS.containerReady, { leaseId: lease.id, host: access.host, port: access.port, access });
  activateLease(lease.id, await starting); confirmLeasePayment(lease.id);

  const output = "x".repeat(1_100_000);
  agent.socket.once(WS.runJob, (msg) => agent.socket.emit(WS.jobResult, { jobId: msg.jobId, ok: true, result: output }));
  assert.equal((await runJob(agent.nodeId, lease.id, "large-output", "print(1)", 3000)).result, output);
  assert.equal(isNodeConnected(agent.nodeId), true, "bounded output must not disconnect agent");

  const closing = closeLease(lease.id, "released");
  assert.equal(closeLease(lease.id, "watchdog"), closing);
  const cutoff = getLease(lease.id)!.endedAt;
  intruder.socket.emit(WS.containerDestroyed, { leaseId: lease.id, ok: true });
  await pause(); assert.equal(nodeBusy(agent.nodeId), true);
  agent.socket.emit(WS.containerDestroyed, { leaseId: lease.id, ok: true });
  await closing;
  assert.equal(nodeBusy(agent.nodeId), false); assert.equal(getLease(lease.id)!.endedAt, cutoff);

  const late = new Promise<void>((resolve) => agent.socket.once(WS.destroyContainer, () => resolve()));
  agent.socket.emit(WS.containerReady, { leaseId: lease.id, host: access.host, port: access.port, access });
  await late;

  const disconnected = leaseFor(agent.nodeId);
  activateLease(disconnected.id, access); confirmLeasePayment(disconnected.id);
  agent.socket.disconnect();
  await pause(); assert.equal(getLease(disconnected.id)!.status, "stopping");
  const frozen = getLease(disconnected.id)!.endedAt;
  const reconnected = await connect("owner", agent.nodeId);
  reconnected.socket.emit(WS.heartbeat, { nodeId: agent.nodeId, runtime: "microvm", kvm: true,
    destroyed: [disconnected.id], capabilities: { ssh: true, python: true, notebook: true, jupyter: true } });
  await pause(); await closeLease(disconnected.id, "receipt-replay");
  assert.equal(getLease(disconnected.id)!.status, "ended");
  assert.equal(getLease(disconnected.id)!.endedAt, frozen); assert.equal(nodeBusy(agent.nodeId), false);
  console.log("agent sockets: owner checks, bounded output, late readiness, cleanup acknowledgement and reconnect receipts ok");
} finally {
  for (const socket of sockets) socket.disconnect();
  await new Promise<void>((resolve) => hub.close(() => resolve()));
}
