/** Opt-in real-kernel gate. Payment/ledger fixtures never spend real money. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createConnection } from "node:net";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile, realpath } from "node:fs/promises";
import { join, basename } from "node:path";
import { release } from "node:os";
import express from "express";
import { io } from "socket.io-client";
import { WS, type StartContainerMsg, type HelloAckMsg, type DestroyContainerMsg, type RunJobMsg } from "@tendril/shared";
import { config as agentConfig } from "../contributor/src/config.js";
import { selectDriver } from "../contributor/src/runtime/select.js";
import { firecrackerDriver, vmId } from "../contributor/src/runtime/firecracker.js";
import { rootfsEffects, prepareRootfs } from "../contributor/src/runtime/rootfs.js";
import { command } from "../contributor/src/runtime/process.js";
import type { RuntimeDriver } from "../contributor/src/runtime/types.js";
import { config } from "../backend/src/config.js";
import { router, runEffects } from "../backend/src/routes.js";
import { initWs, wsEffects } from "../backend/src/ws.js";
import { registryEffects } from "../backend/src/registry.js";
import { getLease, nodeBusy, leaseEffects } from "../backend/src/leases.js";
import { issueLeaseToken } from "../backend/src/auth.js";
import { providerFor } from "../backend/src/providers/index.js";
import { relayClient, relayRequest } from "../backend/src/relay/client.js";
import type { RelayAllocation } from "../backend/src/relay/types.js";
import type { PaidRequest } from "../backend/src/x402/paywall.js";

async function main() {
  if (process.env.TENDRIL_KVM_TEST !== "1") { console.log("KVM gate skipped; opt in with TENDRIL_KVM_TEST=1 on native Linux"); return; }
  assert.equal(process.platform, "linux"); assert.equal(process.getuid?.(), 0);
  agentConfig.runtime = "firecracker";
  const binary = async (name: string) => realpath((await command("sh", ["-c", 'command -v "$1"', "resolve-bin", name])).stdout.trim());
  agentConfig.jailerBin = await binary(agentConfig.jailerBin);
  agentConfig.firecrackerBin = await binary(agentConfig.firecrackerBin);
  const root = process.env.P1_TEST_STATE_DIR ?? `/var/lib/tendril-p1-test-${process.pid}`;
  agentConfig.stateDir = root;
  await mkdir(root, { recursive: true, mode: 0o700 });
  const originalCommand = rootfsEffects.command;
  let exports = 0, paid = false, slowCopy = false, copyReached: (() => void) | undefined;
  rootfsEffects.command = async (bin, args, opts) => {
    if (bin === "docker" && args[0] === "export") { exports++; assert.equal(paid, false, "paid lease exported OCI image"); }
    if (slowCopy && bin === "cp") {
      copyReached?.();
      return originalCommand("sh", ["-c", 'sleep 30; exec cp "$@"', "slow-copy", ...args], opts);
    }
    return originalCommand(bin, args, opts);
  };
  const selected = await selectDriver(); assert.equal(selected.driver.kind, "microvm");
  const driver = selected.driver;
  const template = await prepareRootfs(agentConfig.sandbox.image, join(root, "cache"), agentConfig.diskBytes);
  const initialExports = exports;
  const fixture = join(root, "fixture"); await mkdir(fixture, { mode: 0o700 });
  await command("ssh-keygen", ["-t", "ed25519", "-N", "", "-f", join(fixture, "renter"), "-q"]);
  await writeFile(join(fixture, "bad-kernel"), "deliberately invalid ELF");
  const badRoot = join(root, "bad-driver");
  const broken = firecrackerDriver({ kernelPath: join(fixture, "bad-kernel"), jailerBin: agentConfig.jailerBin,
    firecrackerBin: agentConfig.firecrackerBin, stateDir: badRoot, template });
  const drivers = new Map<string, RuntimeDriver>(), allocations = new Map<string, RelayAllocation>();
  const receipts = new Set<string>(), charges = new Set<string>(), payouts = new Set<string>();
  let modalCreates = 0, settles = 0, lastLease = "", failNext = false, ackDelay = 0;
  registryEffects.optedIn = async () => true;
  wsEffects.ownerOfApiKey = async () => "fixture-owner";
  runEffects.balance = async () => 1000000;
  runEffects.payment = async () => ({ facts: { payer: "fixture-payer", txid: randomBytes(16).toString("hex") },
    settle: async () => { settles++; return true; } } as unknown as PaidRequest);
  leaseEffects.charge = async (args) => { charges.add(args.leaseId); return { charged: args.usedAtomic, balance: 1000000 }; };
  leaseEffects.payout = async (lease) => { assert.equal(payouts.has(lease.id), false, "duplicate payout"); payouts.add(lease.id); };
  config.modalTokenId = "fixture"; config.modalTokenSecret = "fixture";
  providerFor("modal").start = async () => { modalCreates++; throw new Error("matching peer must not open Modal"); };
  const allocate = relayClient.allocate;
  relayClient.allocate = async (...args) => { const result = await allocate(...args); allocations.set(args[0], result); return result; };
  const app = express(); app.use(express.json({ limit: "2mb" })); app.use(router);
  const server = createServer(app), hub = initWs(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address(); assert.ok(addr && typeof addr === "object");
  const base = `http://127.0.0.1:${addr.port}`;
  const agent = io(base, { transports: ["websocket"] });
  let nodeId: string | undefined, registrations = 0;
  const stop = async (leaseId: string) => {
    if (ackDelay) await new Promise((r) => setTimeout(r, ackDelay));
    await drivers.get(leaseId)?.stop(leaseId);
    receipts.add(leaseId);
    agent.emit(WS.containerDestroyed, { leaseId, ok: true });
  };
  agent.on("connect", () => agent.emit(WS.hello, { apiKey: "fixture", nodeId, spec: { label: "P1 kernel gate", cpuCores: 2, ramMb: 2048,
    gpu: null, pricePerHourUsd: 1, runtime: "microvm", kvm: true, capabilities: driver.capabilities } }));
  agent.on(WS.helloAck, (ack: HelloAckMsg) => { registrations++; nodeId = ack.nodeId; agent.emit(WS.heartbeat, { nodeId, runtime: "microvm", kvm: true, capabilities: driver.capabilities, destroyed: [...receipts] }); });
  agent.on(WS.startContainer, (msg: StartContainerMsg) => {
    lastLease = msg.leaseId; const selectedDriver = failNext ? broken : driver; failNext = false; drivers.set(msg.leaseId, selectedDriver);
    void selectedDriver.start(msg).then((ready) => agent.emit(WS.containerReady, { leaseId: msg.leaseId, host: ready.host, port: ready.port, access: ready.access }))
      .catch(async () => { await stop(msg.leaseId); agent.emit(WS.containerFailed, { leaseId: msg.leaseId, error: "fixture boot failure" }); });
  });
  agent.on(WS.destroyContainer, (msg: DestroyContainerMsg) => void stop(msg.leaseId));
  agent.on(WS.runJob, (msg: RunJobMsg) => void drivers.get(msg.leaseId)!.exec(msg.leaseId, msg.payload, config.runTimeoutMs, msg.notebookJob ? msg.jobId : undefined)
    .then((result) => agent.emit(WS.jobResult, { jobId: msg.jobId, ok: result.ok, result: result.output })));
  agent.on("disconnect", () => { for (const [leaseId] of drivers) if (!receipts.has(leaseId)) void stop(leaseId); });
  const api = (path: string, body?: object, token?: string, method = "POST") => fetch(base + path, { method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const wait = async (condition: () => boolean, ms = 10000) => {
    const end = Date.now() + ms; while (!condition()) { if (Date.now() >= end) throw new Error("fixture condition timed out"); await new Promise((r) => setTimeout(r, 20)); }
  };
  const tcp = (host: string, port: number) => new Promise<boolean>((resolve) => {
    const s = createConnection({ host, port }); s.setTimeout(1000);
    s.once("connect", () => { s.destroy(); resolve(true); }); s.once("error", () => resolve(false)); s.once("timeout", () => { s.destroy(); resolve(false); });
  });
  const gone = async (leaseId: string, state = root) => {
    const id = vmId(leaseId);
    assert.equal(await stat(join(state, "leases", id)).then(() => true).catch(() => false), false);
    assert.equal(await stat(join(state, "jail", basename(agentConfig.firecrackerBin), id)).then(() => true).catch(() => false), false);
    assert.equal(await stat(join("/sys/fs/cgroup", agentConfig.cgroupParent, id)).then(() => true).catch(() => false), false);
    assert.equal((await command("ip", ["netns", "list"])).stdout.includes(id), false);
    assert.equal((await relayRequest<{ exists: boolean }>({ op: "inspect", leaseId })).exists, false);
    const allocation = allocations.get(leaseId);
    if (allocation?.relay.ssh) assert.equal(await tcp(allocation.relay.ssh.publicHost, allocation.relay.ssh.publicPort), false);
    if (allocation?.notebookBaseUrl) { const url = new URL(allocation.notebookBaseUrl); assert.equal(await tcp(url.hostname, Number(url.port)), false); }
    if (allocation?.notebookPublicUrl) {
      const res = await fetch(new URL("api/status", allocation.notebookPublicUrl)); assert.equal(res.ok, false);
    }
  };
  try {
    await wait(() => !!nodeId); paid = true;
    const inventory = await (await fetch(base + "/explorer")).json() as { nodes: { provider: string }[] };
    assert.equal(inventory.nodes.filter((n) => n.provider === "modal").length, 3);
    const key = await readFile(join(fixture, "renter.pub"), "utf8");
    const rent = await api(`/x402/rent?nodeId=${nodeId}`, { sshPubKey: key }); assert.equal(rent.status, 200);
    const ssh = await rent.json() as { leaseId: string; leaseToken: string; ssh: { host: string; port: number; command: string } };
    assert.equal(ssh.ssh.command.includes("StrictHostKeyChecking=no"), false);
    const known = join(root, "leases", vmId(ssh.leaseId), "known_hosts");
    const uname = (await command("ssh", ["-i", join(fixture, "renter"), "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", `UserKnownHostsFile=${known}`,
      "-p", String(ssh.ssh.port), `root@${ssh.ssh.host}`, "uname", "-r"])).stdout.trim();
    assert.ok(uname.endsWith("-tendril")); assert.notEqual(uname, release());
    const disk = await stat(join(root, "jail", basename(agentConfig.firecrackerBin), vmId(ssh.leaseId), "root/rootfs.ext4"));
    assert.equal(disk.uid, agentConfig.jailerUid); assert.equal(disk.size, agentConfig.diskBytes);
    const cg = join("/sys/fs/cgroup", agentConfig.cgroupParent, vmId(ssh.leaseId));
    assert.equal((await readFile(join(cg, "cpu.max"), "utf8")).trim(), "200000 100000");
    assert.equal(Number(await readFile(join(cg, "memory.max"), "utf8")), (2048 + agentConfig.vmmOverheadMib) * 1024 ** 2);
    assert.equal((await readFile(join(cg, "pids.max"), "utf8")).trim(), "256");
    const py = await api("/x402/run", { payload: "import os; print(os.getuid())" }, ssh.leaseToken);
    assert.equal(py.status, 200); assert.equal((await py.json() as { result: string }).result.trim(), "0");
    ackDelay = 500;
    const first = api(`/x402/leases/${ssh.leaseId}`, undefined, ssh.leaseToken, "DELETE");
    const second = api(`/x402/leases/${ssh.leaseId}`, undefined, ssh.leaseToken, "DELETE");
    await wait(() => getLease(ssh.leaseId)?.status === "stopping");
    const end = getLease(ssh.leaseId)!.endedAt; assert.equal(nodeBusy(nodeId!), true);
    assert.equal((await first).status, 200); assert.equal((await second).status, 200);
    assert.equal(getLease(ssh.leaseId)?.endedAt, end); assert.ok(Date.now() - end! >= 400);
    ackDelay = 0; await gone(ssh.leaseId); assert.equal(charges.size, 1);

    const labRes = await api(`/x402/rent?nodeId=${nodeId}&surface=jupyter`, {}); assert.equal(labRes.status, 200);
    const lab = await labRes.json() as { leaseId: string; leaseToken: string; jupyter: { url: string; token: string } };
    const notebook = { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name: "python3", display_name: "Python 3", language: "python" } },
      cells: [{ cell_type: "code", metadata: {}, execution_count: null, outputs: [], source: "from pathlib import Path\nPath('artifact.txt').write_text('guest')\nprint('notebook-ok')" }] };
    const ran = await api("/x402/run", { notebook }, lab.leaseToken); assert.equal(ran.status, 200);
    const result = await ran.json() as { ok: boolean; notebook: object; artifacts: { name: string }[] };
    assert.equal(result.ok, true); assert.ok(result.notebook); assert.ok(result.artifacts.some((a) => a.name === "artifact.txt"));
    assert.equal((await api(`/x402/leases/${lab.leaseId}`, undefined, lab.leaseToken, "DELETE")).status, 200); await gone(lab.leaseId);
    assert.equal(exports, initialExports, "second paid lease rebuilt template");

    const before = settles; failNext = true;
    const failed = await api("/x402/run", { payload: "print('must not run')" }); assert.equal(failed.status, 503);
    assert.equal(settles, before); assert.equal(modalCreates, 0); assert.equal(charges.has(lastLease), false); await gone(lastLease, badRoot);

    slowCopy = true;
    const copied = new Promise<void>((resolve) => { copyReached = resolve; });
    const starting = api(`/x402/rent?nodeId=${nodeId}`, { sshPubKey: key }); await copied;
    const cancelled = lastLease;
    const released = await api(`/x402/leases/${cancelled}`, undefined, issueLeaseToken(cancelled), "DELETE");
    assert.equal(released.status, 200); assert.equal((await starting).status, 503); slowCopy = false;
    assert.equal(charges.has(cancelled), false); await gone(cancelled);

    const disconnectRent = await api(`/x402/rent?nodeId=${nodeId}`, { sshPubKey: key }); assert.equal(disconnectRent.status, 200);
    const disconnectedLease = (await disconnectRent.json() as { leaseId: string }).leaseId;
    agent.disconnect(); await wait(() => receipts.has(disconnectedLease), 30000);
    const previousRegistrations = registrations;
    agent.connect(); await wait(() => registrations > previousRegistrations);
    // Receipt replay allows the pending close to finish after reconnect.
    agent.emit(WS.heartbeat, { nodeId, runtime: "microvm", kvm: true, capabilities: driver.capabilities, destroyed: [...receipts] });
    await new Promise((r) => setTimeout(r, 50));
    const { closeLease } = await import("../backend/src/leases.js"); await closeLease(disconnectedLease, "fixture-reconnect");
    await gone(disconnectedLease); assert.equal(modalCreates, 0);
    console.log("P1 KVM gates passed: distinct kernel, cached clones, UID/caps, SSH/Jupyter, Release/cancel/disconnect, relay gone, no fallthrough");
  } finally {
    agent.disconnect();
    for (const [leaseId, leaseDriver] of drivers) {
      await leaseDriver.stop(leaseId);
      await relayClient.destroy(leaseId);
    }
    hub.close(); await new Promise<void>((resolve) => server.close(() => resolve()));
    rootfsEffects.command = originalCommand;
    await rm(root, { recursive: true, force: true });
  }
}
main().catch((err) => { console.error("P1 KVM gate failed:", (err as Error).message); process.exitCode = 1; });
