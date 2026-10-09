/** Native Linux companion. Unix IPC is the only control interface. */
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createServer as netServer, createConnection, type Server as NetServer, type Socket } from "node:net";
import { createServer as httpsServer } from "node:https";
import { request as httpRequest } from "node:http";
import { createServer as tlsServer, createSecureContext } from "node:tls";
import { chmod, chown, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import type { RelayTunnel } from "@tendril/shared";
import type { RelayAllocation, RelayRequest } from "./types.js";

const exec = promisify(execFile);
const run = (bin: string, args: string[], signal?: AbortSignal) => exec(bin, args, { signal, timeout: 30_000, maxBuffer: 1_000_000 });
interface Slot { kind: "ssh" | "notebook"; namespace: string; dev: string; peer: string; hostIp: string; ip: string; index: number; port: number; secret: string; child?: ChildProcess; listener?: NetServer; controlHost: string; publicHost: string; sockets: Set<Socket> }
interface Entry { id: string; leaseId: string; slots: Slot[]; abort: AbortController; ready?: Promise<RelayAllocation>; stop?: Promise<void>; publicNotebook: boolean }
export interface RelayOptions { socket: string; state: string; controlDomain: string; sshDomain: string; notebookDomain: string;
  controlPort: number; httpsPort: number; cert: string; key: string; uid: number; gid: number; bore: string; bind: string }

export class RelayManager {
  readonly entries = new Map<string, Entry>();
  readonly controls = new Map<string, Slot>();
  readonly notebooks = new Map<string, Slot>();
  readonly revoked = new Set<string>();
  constructor(readonly options: RelayOptions) {}
  async reconcile() {
    await mkdir(this.options.state, { recursive: true, mode: 0o700 });
    const info = await stat(this.options.state);
    if (info.uid !== 0 || (info.mode & 0o077) !== 0) throw new Error("relay state must be root-owned mode 0700");
    for (const file of await readdir(this.options.state)) {
      if (!/^br-[a-f0-9]{24}\.json$/.test(file)) continue;
      const slots = JSON.parse(await readFile(join(this.options.state, file), "utf8")) as Slot[];
      for (const slot of slots) {
        if (!/^br-[a-f0-9]{24}-[sn]$/.test(slot.namespace) || !/^br[a-f0-9]{10}$/.test(slot.dev)) throw new Error("invalid relay recovery metadata");
        await this.removeSlot(slot);
      }
      await rm(join(this.options.state, file));
    }
  }
  async allocate(req: Extract<RelayRequest, { op: "allocate" }>): Promise<RelayAllocation> {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(req.leaseId)) throw new Error("invalid lease id");
    if (this.revoked.has(req.leaseId)) throw new Error("lease revoked");
    const existing = this.entries.get(req.leaseId);
    if (existing?.ready) return existing.ready;
    const id = `br-${createHash("sha256").update(req.leaseId).digest("hex").slice(0, 24)}`;
    const entry: Entry = { id, leaseId: req.leaseId, slots: [], abort: new AbortController(), publicNotebook: req.publicNotebook };
    this.entries.set(req.leaseId, entry);
    entry.ready = (async () => {
      try {
        const result: RelayAllocation = { relay: {} };
        for (const kind of ["ssh", "notebook"] as const) {
          if (!req[kind]) continue;
          entry.abort.signal.throwIfAborted();
          const used = new Set([...this.entries.values()].flatMap((e) => e.slots.map((s) => s.index)));
          let index = 0; while (used.has(index) && index < 4096) index++;
          if (index === 4096) throw new Error("relay capacity exhausted");
          const allocatedPorts = new Set([...this.entries.values()].flatMap((e) => e.slots.map((s) => s.port)));
          let port = kind === "ssh" ? 20000 : 25000;
          while (allocatedPorts.has(port)) port++;
          if (port >= (kind === "ssh" ? 25000 : 30000)) throw new Error("relay port pool exhausted");
          const token = `${kind === "ssh" ? "s" : "n"}-${id.slice(3)}`;
          const third = Math.floor(index / 64), fourth = index % 64 * 4;
          const suffix = createHash("sha256").update(token).digest("hex").slice(0, 10);
          const slot: Slot = { kind, namespace: `${id}-${kind[0]}`, dev: `br${suffix}`, peer: `bi${suffix}`,
            hostIp: `10.202.${third}.${fourth + 1}`, ip: `10.202.${third}.${fourth + 2}`, index, port,
            secret: randomBytes(32).toString("base64url"), controlHost: `${token}.${this.options.controlDomain}`,
            publicHost: `${id.slice(3)}.${kind === "ssh" ? this.options.sshDomain : this.options.notebookDomain}`, sockets: new Set() };
          entry.slots.push(slot);
          // Persist handles, not credentials. Recovery destroys orphan resources.
          await writeFile(join(this.options.state, `${id}.json`), JSON.stringify(entry.slots.map(({ namespace, dev, peer, ip, hostIp, index, port }) => ({ namespace, dev, peer, ip, hostIp, index, port }))), { mode: 0o600 });
          await this.createSlot(slot, entry.abort.signal);
          this.controls.set(slot.controlHost, slot);
          const tunnel: RelayTunnel = { controlHost: slot.controlHost, controlPort: this.options.controlPort, secret: slot.secret,
            remotePort: slot.port, publicHost: slot.publicHost, publicPort: kind === "ssh" ? slot.port : this.options.httpsPort };
          result.relay[kind] = tunnel;
          if (kind === "ssh") {
            slot.listener = netServer((socket) => this.forward(socket, slot, slot.port));
            await new Promise<void>((resolve, reject) => { slot.listener!.once("error", reject); slot.listener!.listen(slot.port, this.options.bind, resolve); });
          } else {
            result.notebookBaseUrl = `http://${slot.ip}:${slot.port}/`;
            if (entry.publicNotebook) {
              this.notebooks.set(slot.publicHost, slot);
              result.notebookPublicUrl = `https://${slot.publicHost}${this.options.httpsPort === 443 ? "" : `:${this.options.httpsPort}`}/`;
            }
          }
        }
        return result;
      } catch (err) {
        await this.cleanup(entry).catch(() => undefined);
        throw err;
      }
    })();
    return entry.ready;
  }
  async createSlot(slot: Slot, signal: AbortSignal) {
    const ip = (args: string[]) => run("ip", args, signal);
    await ip(["netns", "add", slot.namespace]);
    await ip(["link", "add", slot.dev, "type", "veth", "peer", "name", slot.peer]);
    await ip(["link", "set", slot.peer, "netns", slot.namespace]);
    await ip(["addr", "add", `${slot.hostIp}/30`, "dev", slot.dev]);
    await ip(["link", "set", slot.dev, "up"]);
    await ip(["-n", slot.namespace, "addr", "add", `${slot.ip}/30`, "dev", slot.peer]);
    await ip(["-n", slot.namespace, "link", "set", slot.peer, "up"]);
    await ip(["-n", slot.namespace, "link", "set", "lo", "up"]);
    signal.throwIfAborted();
    slot.child = spawn("ip", ["netns", "exec", slot.namespace, "setpriv", `--reuid=${this.options.uid}`, `--regid=${this.options.gid}`, "--clear-groups",
      this.options.bore, "server", "--min-port", String(slot.port), "--max-port", String(slot.port)],
      { detached: true, stdio: "ignore", env: { PATH: process.env.PATH, BORE_SECRET: slot.secret } });
    let failed: Error | undefined;
    slot.child.on("error", (err) => { failed = err; });
    for (let i = 0; i < 100; i++) {
      signal.throwIfAborted();
      if (failed || slot.child.exitCode !== null) throw failed ?? new Error("bore server exited");
      if (await new Promise<boolean>((resolve) => {
        const socket = createConnection({ host: slot.ip, port: 7835 });
        socket.setTimeout(100); socket.once("connect", () => { socket.destroy(); resolve(true); });
        socket.once("error", () => resolve(false)); socket.once("timeout", () => { socket.destroy(); resolve(false); });
      })) return;
      await delay(50);
    }
    throw new Error("bore control listener not ready");
  }
  forward(socket: Socket, slot: Slot, port: number) {
    const target = createConnection({ host: slot.ip, port });
    slot.sockets.add(socket); slot.sockets.add(target);
    const close = () => { socket.destroy(); target.destroy(); slot.sockets.delete(socket); slot.sockets.delete(target); };
    socket.on("error", close); target.on("error", close); socket.on("close", close); target.on("close", close);
    socket.pipe(target).pipe(socket);
  }
  async removeSlot(slot: Slot) {
    const namespaces = (await run("ip", ["netns", "list"])).stdout;
    if (namespaces.split("\n").some((line) => line.split(" ")[0] === slot.namespace)) {
      const pids = (await run("ip", ["netns", "pids", slot.namespace])).stdout.trim().split(/\s+/).filter(Boolean);
      for (const pid of pids) { try { process.kill(Number(pid), "SIGKILL"); } catch (err) { if ((err as NodeJS.ErrnoException).code !== "ESRCH") throw err; } }
      for (let i = 0; i < 100; i++) {
        if (!(await run("ip", ["netns", "pids", slot.namespace])).stdout.trim()) break;
        if (i === 99) throw new Error("relay namespace still populated");
        await delay(20);
      }
      await run("ip", ["netns", "delete", slot.namespace]);
    }
    const links = JSON.parse((await run("ip", ["-j", "link", "show"])).stdout) as { ifname: string }[];
    if (links.some((l) => l.ifname === slot.dev)) await run("ip", ["link", "delete", slot.dev]);
  }
  async cleanup(entry: Entry) {
    entry.abort.abort();
    const errors: unknown[] = [];
    for (const slot of entry.slots) {
      this.controls.delete(slot.controlHost); this.notebooks.delete(slot.publicHost);
      for (const socket of slot.sockets) socket.destroy();
      if (slot.listener?.listening) await new Promise<void>((resolve, reject) => slot.listener!.close((err) => err ? reject(err) : resolve()));
      try { await this.removeSlot(slot); } catch (err) { errors.push(err); }
    }
    if (errors.length) throw new AggregateError(errors, "relay cleanup pending");
    await rm(join(this.options.state, `${entry.id}.json`), { force: true });
    this.entries.delete(entry.leaseId);
  }
  destroy(leaseId: string): Promise<void> {
    this.revoked.add(leaseId);
    const entry = this.entries.get(leaseId);
    if (!entry) return Promise.resolve();
    if (entry.stop) return entry.stop;
    entry.abort.abort();
    entry.stop = (async () => { await entry.ready?.catch(() => undefined); await this.cleanup(entry); })().finally(() => { entry.stop = undefined; });
    return entry.stop;
  }
}

export async function serveRelay(o: RelayOptions) {
  if (process.platform !== "linux" || process.getuid?.() !== 0 || o.uid <= 0 || o.gid <= 0) throw new Error("relay requires Linux root and an unprivileged bore UID/GID");
  if (!(await run(o.bore, ["--version"])).stdout.match(/\b0\.5\.1\b/)) throw new Error("relay requires pinned bore 0.5.1");
  const manager = new RelayManager(o);
  await manager.reconcile();
  const [cert, key] = await Promise.all([readFile(o.cert), readFile(o.key)]);
  const context = createSecureContext({ cert, key, minVersion: "TLSv1.2" });
  const control = tlsServer({ cert, key, minVersion: "TLSv1.2", SNICallback: (name, callback) =>
    callback(manager.controls.has(name) ? null : new Error("lease revoked"), context) }, (socket) => {
      const slot = manager.controls.get(socket.servername || "");
      if (!slot) { socket.destroy(); return; }
      manager.forward(socket, slot, 7835);
    });
  const publicTls = httpsServer({ cert, key, minVersion: "TLSv1.2" }, (req, res) => {
    const slot = manager.notebooks.get((req.headers.host ?? "").split(":")[0]);
    if (!slot) { res.writeHead(410); res.end(); return; }
    const target = httpRequest({ hostname: slot.ip, port: slot.port, method: req.method, path: req.url,
      headers: { ...req.headers, "x-forwarded-proto": "https", "x-forwarded-for": req.socket.remoteAddress ?? "", "x-real-ip": req.socket.remoteAddress ?? "" } }, (upstream) => {
        res.writeHead(upstream.statusCode ?? 502, upstream.headers); upstream.pipe(res);
      });
    slot.sockets.add(req.socket);
    target.on("socket", (socket) => { slot.sockets.add(socket); socket.once("close", () => slot.sockets.delete(socket)); });
    req.socket.once("close", () => slot.sockets.delete(req.socket));
    target.on("error", () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    req.pipe(target);
  });
  publicTls.on("upgrade", (req, socket, head) => {
    const slot = manager.notebooks.get((req.headers.host ?? "").split(":")[0]);
    if (!slot) { socket.destroy(); return; }
    const target = httpRequest({ hostname: slot.ip, port: slot.port, path: req.url, headers: { ...req.headers, "x-forwarded-proto": "https" } });
    slot.sockets.add(socket as Socket);
    target.on("upgrade", (reply, upstream, upstreamHead) => {
      slot.sockets.add(upstream);
      socket.write(`HTTP/1.1 101 Switching Protocols\r\n${Object.entries(reply.headers).map(([k, v]) => `${k}: ${v}`).join("\r\n")}\r\n\r\n`);
      if (head.length) upstream.write(head);
      if (upstreamHead.length) socket.write(upstreamHead);
      socket.pipe(upstream).pipe(socket);
      const close = () => { socket.destroy(); upstream.destroy(); slot.sockets.delete(socket as Socket); slot.sockets.delete(upstream); };
      socket.on("close", close); socket.on("error", close); upstream.on("close", close); upstream.on("error", close);
    });
    target.on("response", () => socket.destroy()); target.on("error", () => socket.destroy()); target.end();
  });
  await mkdir(dirname(o.socket), { recursive: true, mode: 0o750 });
  await rm(o.socket, { force: true });
  const ipc = netServer((socket) => {
    let data = "", submitted = false;
    socket.setTimeout(60_000, () => socket.destroy());
    socket.on("error", () => undefined);
    socket.on("data", async (chunk) => {
      data += chunk.toString();
      if (data.length > 4096) { socket.destroy(); return; }
      if (submitted || !data.includes("\n")) return;
      submitted = true;
      try {
        const req = JSON.parse(data.split("\n")[0]) as RelayRequest;
        if (typeof req.leaseId !== "string") throw new Error("invalid relay request");
        const value = req.op === "allocate" ? await manager.allocate(req) : req.op === "destroy" ? await manager.destroy(req.leaseId)
          : req.op === "inspect" ? { exists: manager.entries.has(req.leaseId) } : (() => { throw new Error("invalid operation"); })();
        socket.end(JSON.stringify({ ok: true, value }) + "\n");
      } catch { socket.end(JSON.stringify({ ok: false, error: "relay operation failed; cleanup may be pending" }) + "\n"); }
    });
  });
  const listen = (server: NetServer, port: number | string) => new Promise<void>((resolve, reject) => {
    server.once("error", reject); typeof port === "string" ? server.listen(port, resolve) : server.listen(port, o.bind, resolve);
  });
  await listen(control, o.controlPort); await listen(publicTls, o.httpsPort); await listen(ipc, o.socket);
  await chown(o.socket, 0, Number(process.env.RELAY_BACKEND_GID ?? o.gid)); await chmod(o.socket, 0o660);
  return { manager, async stop() {
    await Promise.all([...manager.entries.keys()].map((lease) => manager.destroy(lease)));
    for (const server of [ipc, control, publicTls]) await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    await rm(o.socket, { force: true });
  } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const required = (key: string) => { const value = process.env[key]; if (!value) throw new Error(`${key} required`); return value; };
  void serveRelay({ socket: process.env.RELAY_SOCKET ?? "/run/tendril-relay/control.sock", state: process.env.RELAY_STATE_DIR ?? "/var/lib/tendril-relay",
    controlDomain: required("RELAY_CONTROL_DOMAIN"), sshDomain: required("RELAY_SSH_DOMAIN"), notebookDomain: required("RELAY_NOTEBOOK_DOMAIN"),
    controlPort: Number(process.env.RELAY_CONTROL_PORT ?? 9443), httpsPort: Number(process.env.RELAY_HTTPS_PORT ?? 443),
    cert: required("RELAY_TLS_CERT"), key: required("RELAY_TLS_KEY"), uid: Number(process.env.RELAY_UID ?? 123), gid: Number(process.env.RELAY_GID ?? 123),
    bore: process.env.RELAY_BORE_BIN ?? "/usr/local/bin/bore", bind: process.env.RELAY_BIND ?? "0.0.0.0" }).then((relay) => {
      for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => void relay.stop().then(() => process.exit(0)).catch(() => process.exit(1)));
      console.log("[relay] ready (Unix IPC, TLS transport and Jupyter proxy)");
    }).catch((err) => { console.error("[relay] startup failed:", (err as Error).message); process.exit(1); });
}
