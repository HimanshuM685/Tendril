import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RelayManager } from "./manager.js";

const dir = await mkdtemp(join(tmpdir(), "tendril-relay-test-"));
const manager = new RelayManager({ socket: join(dir, "control.sock"), state: dir, controlDomain: "control.test", sshDomain: "ssh.test",
  notebookDomain: "lab.test", controlPort: 9443, httpsPort: 443, cert: "unused", key: "unused", uid: 123, gid: 123, bore: "unused", bind: "127.0.0.1" });
const resources = new Set<string>();
manager.createSlot = async (slot, signal) => { signal.throwIfAborted(); resources.add(slot.namespace); };
manager.removeSlot = async (slot) => { resources.delete(slot.namespace); };
const request = (leaseId: string) => ({ op: "allocate" as const, leaseId, ssh: false, notebook: true, publicNotebook: true });
try {
  const a = await manager.allocate(request("lease-a")), b = await manager.allocate(request("lease-b"));
  assert.notEqual(a.relay.notebook?.secret, b.relay.notebook?.secret);
  assert.notEqual(a.relay.notebook?.remotePort, b.relay.notebook?.remotePort);
  const entry = manager.entries.get("lease-a")!;
  assert.equal((await readFile(join(dir, `${entry.id}.json`), "utf8")).includes(a.relay.notebook!.secret), false);
  let fail = true;
  manager.removeSlot = async (slot) => { if (fail && slot.namespace.startsWith(entry.id)) throw new Error("injected cleanup failure"); resources.delete(slot.namespace); };
  await assert.rejects(manager.destroy("lease-a"));
  assert.equal(manager.notebooks.has(a.relay.notebook!.publicHost), false);
  assert.equal(manager.controls.has(a.relay.notebook!.controlHost), false);
  assert.equal(manager.entries.has("lease-a"), true, "cleanup metadata retained");
  assert.equal(manager.controls.has(b.relay.notebook!.controlHost), true);
  fail = false; await manager.destroy("lease-a"); await manager.destroy("lease-a");
  await assert.rejects(manager.allocate(request("lease-a")), /revoked/);
  await manager.destroy("not-yet-allocated");
  await assert.rejects(manager.allocate(request("not-yet-allocated")), /revoked/, "late allocate cannot recreate listener");
  manager.createSlot = async (slot, signal) => {
    signal.throwIfAborted();
    resources.add(slot.namespace);
    await new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true }));
  };
  const starting = manager.allocate(request("during-boot"));
  const rejected = assert.rejects(starting);
  await manager.destroy("during-boot"); await rejected;
  await manager.destroy("lease-b");
  assert.equal(resources.size, 0); assert.equal(manager.entries.size, 0); assert.equal(manager.controls.size, 0); assert.equal(manager.notebooks.size, 0);
  console.log("relay lifecycle: per-lease credentials, revocation, cancellation and cleanup retry ok");
} finally { await rm(dir, { recursive: true, force: true }); }
