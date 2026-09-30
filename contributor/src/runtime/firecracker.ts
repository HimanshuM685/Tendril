import { spawn, execFile, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { config } from "../config.js";
import { ensureImage } from "../docker.js";
import type { LeaseRequest, RuntimeDriver, RunningLease } from "./types.js";

const execFileP = promisify(execFile);
const BORE_RE = /listening at ([a-zA-Z0-9.\-]+):(\d+)/i;

export interface BootConfigInput {
  kernelPath: string;
  rootfsPath: string;
  tap: string;
  guestMac: string;
  vcpus: number;
  memMib: number;
  guestIp: string;
  hostIp: string;
}

/** Firecracker boot document. `kernel_image_path` is the guest kernel, not the host's. */
export function buildBootConfig(opts: BootConfigInput): Record<string, unknown> {
  const bootArgs =
    `console=ttyS0 reboot=k panic=1 pci=off root=/dev/vda rw init=/tendril-init.sh ` +
    `ip=${opts.guestIp}::${opts.hostIp}:255.255.255.252::eth0:off:1.1.1.1`;
  return {
    "boot-source": {
      kernel_image_path: opts.kernelPath,
      boot_args: bootArgs,
    },
    drives: [
      {
        drive_id: "rootfs",
        path_on_host: opts.rootfsPath,
        is_root_device: true,
        is_read_only: false,
      },
    ],
    "network-interfaces": [
      {
        iface_id: "eth0",
        guest_mac: opts.guestMac,
        host_dev_name: opts.tap,
      },
    ],
    "machine-config": {
      vcpu_count: Math.max(1, Math.floor(opts.vcpus) || 1),
      mem_size_mib: Math.max(128, opts.memMib),
    },
  };
}

export interface JailerArgvInput {
  jailer: string;
  firecracker: string;
  id: string;
  uid: number;
  gid: number;
  chrootBase: string;
}

/**
 * Jailer command. No `--bind` of a host path, no GPU flag, no published port.
 * Caps are the cgroup parent plus the machine-config vcpu and memory.
 */
export function jailerArgv(opts: JailerArgvInput): string[] {
  return [
    opts.jailer,
    "--id",
    opts.id,
    "--exec-file",
    opts.firecracker,
    "--uid",
    String(opts.uid),
    "--gid",
    String(opts.gid),
    "--chroot-base-dir",
    opts.chrootBase,
    "--parent-cgroup",
    "tendril",
    "--",
    "--config-file",
    "/config.json",
  ];
}

export async function removeLeaseDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

interface LiveVm {
  child: ChildProcess | null;
  tap: string;
  dir: string;
  jailDir: string;
  guestIp: string;
  hostIp: string;
  execKey: string;
}

const live = new Map<string, LiveVm>();

function memMib(raw: string): number {
  const m = /^(\d+(?:\.\d+)?)([gmk])?b?$/i.exec(raw.trim());
  if (!m) return 2048;
  const n = Number(m[1]);
  const unit = (m[2] ?? "m").toLowerCase();
  if (unit === "g") return Math.ceil(n * 1024);
  if (unit === "k") return Math.max(1, Math.ceil(n / 1024));
  return Math.ceil(n);
}

function shQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function pairFor(index: number): { hostIp: string; guestIp: string } {
  const third = Math.floor(index / 64);
  const fourth = (index % 64) * 4;
  return {
    hostIp: `10.200.${third}.${fourth + 1}`,
    guestIp: `10.200.${third}.${fourth + 2}`,
  };
}

function allocateNet(used: Set<string>): { hostIp: string; guestIp: string; tap: string } {
  for (let n = 0; n < 4096; n++) {
    const pair = pairFor(n);
    if (used.has(pair.guestIp)) continue;
    return { ...pair, tap: `tnd${n.toString(16)}` };
  }
  throw new Error("no free guest subnet");
}

function macFor(guestIp: string): string {
  const parts = guestIp.split(".").map((p) => Number(p).toString(16).padStart(2, "0"));
  return `06:00:${parts.join(":")}`.slice(0, 17);
}

const INIT_SCRIPT = `#!/bin/sh
set -a
[ -f /etc/tendril.env ] && . /etc/tendril.env
set +a
exec /entrypoint.sh
`;

async function run(cmd: string, args: string[]): Promise<void> {
  await execFileP(cmd, args, { maxBuffer: 64 * 1024 * 1024 });
}

async function buildRootfs(image: string, disk: string, envBody: string): Promise<void> {
  const extract = `${disk}.root`;
  const name = `tendril-export-${randomBytes(4).toString("hex")}`;
  await mkdir(extract, { recursive: true });
  await run("docker", ["create", "--name", name, image]);
  try {
    await new Promise<void>((resolve, reject) => {
      const exporter = spawn("docker", ["export", name], { stdio: ["ignore", "pipe", "pipe"] });
      const tar = spawn("tar", ["-C", extract, "-xf", "-"], { stdio: ["pipe", "ignore", "pipe"] });
      exporter.stdout?.pipe(tar.stdin!);
      let err = "";
      exporter.stderr?.on("data", (d) => (err += d.toString()));
      tar.stderr?.on("data", (d) => (err += d.toString()));
      tar.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || "rootfs extract failed"))));
      exporter.on("error", reject);
      tar.on("error", reject);
    });
  } finally {
    await execFileP("docker", ["rm", "-f", name]).catch(() => undefined);
  }
  await mkdir(join(extract, "etc"), { recursive: true });
  await writeFile(join(extract, "tendril-init.sh"), INIT_SCRIPT);
  await chmod(join(extract, "tendril-init.sh"), 0o755);
  await writeFile(join(extract, "etc", "tendril.env"), envBody);
  await run("truncate", ["-s", "2G", disk]);
  await run("mkfs.ext4", ["-F", "-d", extract, disk]);
  await rm(extract, { recursive: true, force: true });
}

async function ensureExecKey(dir: string): Promise<string> {
  const key = join(dir, "exec_ed25519");
  if (!existsSync(key)) {
    await run("ssh-keygen", ["-t", "ed25519", "-N", "", "-f", key, "-q"]);
  }
  return key;
}

function waitForBore(child: ChildProcess, timeoutMs: number): Promise<{ host: string; port: number }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error("bore endpoint not announced in time"))),
      timeoutMs,
    );
    const onData = (buf: Buffer) => {
      const match = buf.toString().match(BORE_RE);
      if (match) finish(() => resolve({ host: match[1], port: Number(match[2]) }));
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", (err) => finish(() => reject(err)));
    child.on("exit", () => finish(() => reject(new Error("guest exited before bore came up"))));
  });
}

async function addTap(tap: string, hostIp: string): Promise<void> {
  // Owned by the jailer uid so the guest NIC is not a host-port forward.
  await run("ip", ["tuntap", "add", "dev", tap, "mode", "tap", "user", "123"]);
  await run("ip", ["addr", "add", `${hostIp}/30`, "dev", tap]);
  await run("ip", ["link", "set", tap, "up"]);
  await execFileP("sysctl", ["-w", "net.ipv4.ip_forward=1"]).catch(() => undefined);
}

async function addNat(guestIp: string): Promise<void> {
  await execFileP("iptables", [
    "-t",
    "nat",
    "-C",
    "POSTROUTING",
    "-s",
    `${guestIp}/32`,
    "-j",
    "MASQUERADE",
  ]).catch(() =>
    execFileP("iptables", [
      "-t",
      "nat",
      "-A",
      "POSTROUTING",
      "-s",
      `${guestIp}/32`,
      "-j",
      "MASQUERADE",
    ]),
  );
}

async function delNat(guestIp: string): Promise<void> {
  await execFileP("iptables", [
    "-t",
    "nat",
    "-D",
    "POSTROUTING",
    "-s",
    `${guestIp}/32`,
    "-j",
    "MASQUERADE",
  ]).catch(() => undefined);
}

export function firecrackerDriver(opts: {
  kernelPath: string;
  jailerBin: string;
  firecrackerBin: string;
  stateDir: string;
}): RuntimeDriver {
  const root = opts.stateDir || join(tmpdir(), "tendril-leases");

  return {
    kind: "microvm",
    async start(lease: LeaseRequest): Promise<RunningLease> {
      const image = await ensureImage(lease.image || config.sandbox.image);
      const used = new Set([...live.values()].map((row) => row.guestIp));
      const net = allocateNet(used);
      const dir = join(root, lease.leaseId);
      const jailDir = join(root, "jail", basename(opts.firecrackerBin), lease.leaseId);
      await mkdir(dir, { recursive: true });
      live.set(lease.leaseId, {
        child: null,
        tap: net.tap,
        dir,
        jailDir,
        guestIp: net.guestIp,
        hostIp: net.hostIp,
        execKey: "",
      });
      try {
      const execKey = await ensureExecKey(root);
      live.get(lease.leaseId)!.execKey = execKey;
      const pub = (await readFile(`${execKey}.pub`, "utf8")).trim();
      const renterKey = lease.sshPubKey?.trim();
      const keys = [renterKey, pub].filter(Boolean).join("\n");
      const envBody = [
        `BORE_SERVER=${shQuote(config.sandbox.boreServer)}`,
        `BORE_SECRET=${shQuote(config.sandbox.boreSecret)}`,
        lease.sshPassword ? `SSH_PASSWORD=${shQuote(lease.sshPassword)}` : "",
        `SSH_PUBKEY=${shQuote(keys)}`,
        "",
      ]
        .filter(Boolean)
        .join("\n");
      const disk = join(dir, "rootfs.ext4");
      await buildRootfs(image, disk, envBody);
      const recorded = buildBootConfig({
        kernelPath: opts.kernelPath,
        rootfsPath: disk,
        tap: net.tap,
        guestMac: macFor(net.guestIp),
        vcpus: Number(lease.limits.cpus) || config.sandbox.cpus,
        memMib: memMib(lease.limits.memory || config.sandbox.memory),
        guestIp: net.guestIp,
        hostIp: net.hostIp,
      });
      if ((recorded["boot-source"] as { kernel_image_path: string }).kernel_image_path !== opts.kernelPath) {
        throw new Error("guest kernel path was rewritten");
      }
      await writeFile(join(dir, "boot.json"), JSON.stringify(recorded));
      const jailRoot = join(jailDir, "root");
      await mkdir(jailRoot, { recursive: true });
      await cp(opts.kernelPath, join(jailRoot, "vmlinux"));
      await cp(disk, join(jailRoot, "rootfs.ext4"));
      const jailBoot = buildBootConfig({
        kernelPath: "vmlinux",
        rootfsPath: "rootfs.ext4",
        tap: net.tap,
        guestMac: macFor(net.guestIp),
        vcpus: Number(lease.limits.cpus) || config.sandbox.cpus,
        memMib: memMib(lease.limits.memory || config.sandbox.memory),
        guestIp: net.guestIp,
        hostIp: net.hostIp,
      });
      await writeFile(join(jailRoot, "config.json"), JSON.stringify(jailBoot));
      const args = jailerArgv({
        jailer: opts.jailerBin,
        firecracker: opts.firecrackerBin,
        id: lease.leaseId,
        uid: 123,
        gid: 123,
        chrootBase: join(root, "jail"),
      });
      if (args.includes("--bind") || args.includes("--gpus") || args.includes("-p")) {
        throw new Error("jailer argv must not bind host paths or publish ports");
      }
      await addTap(net.tap, net.hostIp);
        await addNat(net.guestIp);
      const child = spawn(args[0], args.slice(1), {
        stdio: ["ignore", "pipe", "pipe"],
      });
      live.get(lease.leaseId)!.child = child;
      const endpoint = await waitForBore(child, 90_000);
      return { leaseId: lease.leaseId, host: endpoint.host, port: endpoint.port, guestIp: net.guestIp };
      } catch (err) {
        await this.stop(lease.leaseId);
        throw err;
      }
    },
    async stop(leaseId: string): Promise<void> {
      const row = live.get(leaseId);
      live.delete(leaseId);
      if (row?.child && row.child.exitCode === null && !row.child.killed) {
        row.child.kill("SIGTERM");
        await new Promise((r) => setTimeout(r, 500));
        if (row.child.exitCode === null) row.child.kill("SIGKILL");
      }
      if (row) {
        await execFileP("ip", ["link", "del", row.tap]).catch(() => undefined);
        await delNat(row.guestIp);
        await removeLeaseDir(row.dir);
        await removeLeaseDir(row.jailDir);
      } else {
        await removeLeaseDir(join(root, leaseId));
      }
    },
    exec(leaseId, payload, timeoutMs = 120_000) {
      const row = live.get(leaseId);
      if (!row) return Promise.resolve({ ok: false, output: "lease is not running" });
      return new Promise((resolve) => {
        const child = spawn(
          "ssh",
          [
            "-i",
            row.execKey,
            "-o",
            "BatchMode=yes",
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            "UserKnownHostsFile=/dev/null",
            `root@${row.guestIp}`,
            "python3",
            "-",
          ],
          { stdio: ["pipe", "pipe", "pipe"] },
        );
        let out = "";
        let err = "";
        const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
        child.stdout.on("data", (d) => (out += d.toString()));
        child.stderr.on("data", (d) => (err += d.toString()));
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve({ ok: code === 0, output: code === 0 ? out : `${out}\n${err}`.trim() });
        });
        child.on("error", (e) => {
          clearTimeout(timer);
          resolve({ ok: false, output: String(e) });
        });
        child.stdin.write(payload);
        child.stdin.end();
      });
    },
  };
}
