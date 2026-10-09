import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createConnection, createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { SandboxLimits } from "@tendril/shared";
import { JOB_RESULT_MAX_BYTES, boundedRunTimeoutMs, RUN_MAX_TIMEOUT_MS } from "@tendril/shared";
import { config } from "./config.js";

const execFileP = promisify(execFile);

/** The endpoint a renter SSHes into, once the sandbox is up. */
export interface SandboxEndpoint {
  leaseId: string;
  containerName: string;
  host: string;
  port: number;
}

function containerName(leaseId: string): string {
  return `tendril-${leaseId.replace(/[^a-zA-Z0-9_.-]/g, "")}`;
}

/** Ask the OS for an available TCP port. */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const { port } = addr;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error("could not allocate port")));
      }
    });
    srv.on("error", reject);
  });
}

/** Number of CPUs the Docker daemon exposes — `docker run --cpus` can't exceed
 *  it. Cached after the first lookup; 0 means "couldn't determine" (skip clamp). */
let ncpuCache: number | null = null;
async function dockerNcpu(): Promise<number> {
  if (ncpuCache !== null) return ncpuCache;
  try {
    const { stdout } = await execFileP("docker", ["info", "--format", "{{.NCPU}}"]);
    const n = parseInt(stdout.trim(), 10);
    ncpuCache = Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    ncpuCache = 0;
  }
  return ncpuCache;
}

/** Build context for the bundled sandbox image. */
const SANDBOX_CTX = resolve(dirname(fileURLToPath(import.meta.url)), "../sandbox-ssh");

/**
 * Fingerprint of the files that decide how the sandbox behaves.
 *
 * The image is cached on the host forever, so tagging it `:latest` and only
 * building when it is *absent* means an edit to `entrypoint.sh` is never picked
 * up — the contributor keeps starting containers built from the old script, and
 * the symptom is remote and baffling (SSH auth silently behaving like an older
 * build). Folding the content hash into the tag makes a changed entrypoint a
 * different image, so it rebuilds exactly when it should and not otherwise.
 */
function sandboxTag(): string | null {
  const dockerfile = join(SANDBOX_CTX, "Dockerfile");
  const entrypoint = join(SANDBOX_CTX, "entrypoint.sh");
  if (!existsSync(dockerfile)) return null;
  const h = createHash("sha256");
  for (const f of [dockerfile, entrypoint]) {
    if (existsSync(f)) h.update(readFileSync(f));
  }
  return `tendril-ssh-sandbox:${h.digest("hex").slice(0, 12)}`;
}

/**
 * Resolve the image to run, building it if needed. Returns the tag actually
 * used, which may differ from `image` when we substitute a content-tagged build
 * of the bundled sandbox.
 */
async function ensureImage(image: string): Promise<string> {
  // An explicitly configured SANDBOX_IMAGE is the operator's to manage: we only
  // check it exists and never rebuild it from our context.
  const bundled = image === config.sandbox.image && existsSync(join(SANDBOX_CTX, "Dockerfile"));
  const tag = bundled ? (sandboxTag() ?? image) : image;

  try {
    await execFileP("docker", ["image", "inspect", tag]);
    return tag;
  } catch {
    /* not present */
  }
  if (!bundled) return tag; // nothing we can build; `docker run` will report it

  console.log(`[docker] building sandbox image ${tag} from ${SANDBOX_CTX}…`);
  await execFileP("docker", ["build", "-t", tag, SANDBOX_CTX], { maxBuffer: 50 * 1024 * 1024 });
  return tag;
}

/**
 * Start a hardened, ephemeral SSH sandbox. The hardening IS the safety model:
 *   --rm                       container is discarded on exit
 *   no -v host mounts          the host filesystem is never exposed
 *   --cap-drop ALL + a minimal add-back   only what sshd needs to let root in
 *   --security-opt no-new-privileges      block privilege escalation
 *   --memory / --cpus / --pids-limit      cgroup resource caps
 * In bore mode no host port is published at all — the container dials OUT to the
 * bore server. In local mode (same machine) we publish 22 to loopback instead.
 */
export async function startSandbox(
  leaseId: string,
  imageOverride: string,
  limits: SandboxLimits,
  sshPassword: string | null,
  sshPubKey: string | null,
  surface: "ssh" | "exec" = "ssh",
  lifetimeMs = RUN_MAX_TIMEOUT_MS + 300_000,
): Promise<SandboxEndpoint> {
  const image = imageOverride || config.sandbox.image;
  const runImage = await ensureImage(image);
  const name = containerName(leaseId);
  const memory = limits.memory || config.sandbox.memory;
  // Clamp to what the daemon actually has — `docker run` rejects a --cpus value
  // above the daemon's CPU count (e.g. a node that advertises 4 cores on a 2-CPU
  // host). Fall back to the requested value if NCPU can't be determined.
  let cpusNum = Number(limits.cpus || config.sandbox.cpus);
  const ncpu = await dockerNcpu();
  if (ncpu > 0 && cpusNum > ncpu) {
    console.warn(`[docker] requested ${cpusNum} CPUs but daemon has ${ncpu}; clamping to ${ncpu}`);
    cpusNum = ncpu;
  }
  const cpus = String(cpusNum);
  const gpus = limits.gpus || config.sandbox.gpus;
  const local = config.tunnelMode === "local";
  const execOnly = surface === "exec";

  const args = [
    "run",
    "-d",
    "--rm",
    "--name",
    name,
    "--memory",
    memory,
    "--memory-swap",
    memory,
    "--cpus",
    cpus,
    "--pids-limit",
    "256",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
  ];
  if (execOnly) {
    args.push(
      "--init", "--read-only",
      "--tmpfs", "/work:rw,nosuid,nodev,size=256m,mode=1777",
      "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m,mode=1777",
      "--ulimit", "fsize=134217728:134217728",
      "-e", "HOME=/work", "-e", "PYTHONDONTWRITEBYTECODE=1",
      "-e", "PIP_NO_CACHE_DIR=1", "-e", "MPLBACKEND=Agg",
      "-e", `OMP_NUM_THREADS=${Math.max(1, Math.ceil(cpusNum))}`,
      "-e", `OPENBLAS_NUM_THREADS=${Math.max(1, Math.ceil(cpusNum))}`,
    );
  } else {
    args.push(
      // The few caps sshd needs to accept a root password login under PAM.
      // SYS_CHROOT is required for sshd's privilege-separation chroot — without it
      // sshd accepts the TCP connection then drops it before the banner.
      "--cap-add",
      "CHOWN",
      "--cap-add",
      "DAC_OVERRIDE",
      "--cap-add",
      "FOWNER",
      "--cap-add",
      "SETUID",
      "--cap-add",
      "SETGID",
      "--cap-add",
      "SYS_CHROOT",
      "--cap-add",
      "AUDIT_WRITE",
    );
  }

  // Exactly one of the two: a key the renter brought, or their address as the
  // password. The entrypoint locks the root password outright under key auth.
  if (!execOnly && sshPubKey) {
    args.push("-e", `SSH_PUBKEY=${sshPubKey}`);
  } else if (!execOnly && sshPassword) {
    args.push("-e", `SSH_PASSWORD=${sshPassword}`);
  }

  let hostPort = 0;
  if (!execOnly && local) {
    hostPort = await getFreePort();
    args.push("-e", "NO_BORE=1", "-p", `127.0.0.1:${hostPort}:22`);
  } else if (!execOnly) {
    args.push("-e", `BORE_SERVER=${config.sandbox.boreServer}`);
    // bore (client) authenticates to a self-hosted server via BORE_SECRET.
    if (config.sandbox.boreSecret) args.push("-e", `BORE_SECRET=${config.sandbox.boreSecret}`);
  }
  if (gpus) args.push("--gpus", gpus);
  if (execOnly) args.push("--entrypoint", "sleep");
  args.push(runImage);
  if (execOnly) args.push(String(Math.ceil(Math.min(RUN_MAX_TIMEOUT_MS + 300_000, lifetimeMs) / 1000)));

  console.log(
    `[docker] starting ${execOnly ? "exec" : "SSH"} sandbox ${name} (${runImage})` +
      (execOnly ? "" : local ? ` on 127.0.0.1:${hostPort}` : ` via bore (${config.sandbox.boreServer})`),
  );
  await execFileP("docker", args, { maxBuffer: 10 * 1024 * 1024 });

  if (execOnly) {
    // A venv on bounded writable storage allows %pip without changing the
    // read-only image or the contributor host. The kernel uses this interpreter.
    try {
      await execFileP("docker", ["exec", name, "python3", "-m", "venv", "--system-site-packages", "/work/.venv"], { timeout: 30_000 });
    } catch (err) {
      await stopSandbox(leaseId);
      throw err;
    }
    return { leaseId, containerName: name, host: "", port: 0 };
  }

  if (local) {
    await waitForPort(hostPort);
    return { leaseId, containerName: name, host: "127.0.0.1", port: hostPort };
  }
  const { host, port } = await waitForBoreEndpoint(name);
  return { leaseId, containerName: name, host, port };
}

/** Poll a TCP port until it accepts a connection (local-mode readiness). */
async function waitForPort(port: number, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((res) => {
      const sock = createConnection({ host: "127.0.0.1", port });
      sock.setTimeout(2000);
      sock.on("connect", () => {
        sock.destroy();
        res(true);
      });
      sock.on("error", () => res(false));
      sock.on("timeout", () => {
        sock.destroy();
        res(false);
      });
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("sandbox SSH port did not become reachable in time");
}

const BORE_RE = /listening at ([a-zA-Z0-9.\-]+):(\d+)/i;

/** Tail the container logs until bore prints its public endpoint. */
function waitForBoreEndpoint(
  name: string,
  timeoutMs = 60_000,
): Promise<{ host: string; port: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["logs", "-f", name], { stdio: ["ignore", "pipe", "pipe"] });
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      fn();
    };
    const timer = setTimeout(
      () => finish(() => reject(new Error("bore endpoint not announced in time"))),
      timeoutMs,
    );
    const onData = (buf: Buffer) => {
      const m = buf.toString().match(BORE_RE);
      if (m) finish(() => resolve({ host: m[1], port: Number(m[2]) }));
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("error", (e) => finish(() => reject(e)));
    child.on("exit", () => finish(() => reject(new Error("container exited before bore came up"))));
  });
}

/** Run a Python script inside the sandbox via `docker exec`, returning output. */
export function runInSandbox(
  leaseId: string,
  payload: string,
  timeoutMs = 120_000,
): Promise<{ ok: boolean; output: string }> {
  const name = containerName(leaseId);
  return new Promise((resolve) => {
    const duration = boundedRunTimeoutMs(timeoutMs);
    // timeout runs INSIDE the container and terminates the process group.
    // Killing only `docker exec` on the host leaves Python descendants alive.
    const child = spawn("docker", ["exec", "-i", name, "timeout", "--signal=TERM", "--kill-after=2s", `${duration / 1000}s`,
      "sh", "-c", "if [ -x /work/.venv/bin/python ]; then exec /work/.venv/bin/python -; else exec python3 -; fi"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    let bytes = 0;
    let failure = "";
    const abort = (message: string) => {
      if (failure) return;
      failure = message;
      child.kill("SIGKILL");
      void stopSandbox(leaseId);
    };
    const timer = setTimeout(() => abort("Job timed out; sandbox stopped."), duration + 3_000);
    const receive = (chunks: Buffer[], data: Buffer) => {
      bytes += data.byteLength;
      if (bytes > JOB_RESULT_MAX_BYTES) abort("Job output exceeded 12 MB; sandbox stopped.");
      else chunks.push(data);
    };
    child.stdout.on("data", (d: Buffer) => receive(out, d));
    child.stderr.on("data", (d: Buffer) => receive(err, d));
    child.on("close", (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(out).toString();
      const stderr = Buffer.concat(err).toString();
      const timedOut = code === 124 || code === 137;
      if (timedOut) void stopSandbox(leaseId);
      resolve({ ok: !failure && code === 0, output: failure || (timedOut ? "Job timed out; sandbox stopped." : code === 0 ? stdout : `${stdout}\n${stderr}`.trim()) });
    });
    child.stdin.on("error", () => { /* process exited before consuming payload */ });
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, output: String(e) });
    });
    child.stdin.write(payload);
    child.stdin.end();
  });
}

/** Forcibly remove the sandbox container (idempotent). */
export async function stopSandbox(leaseId: string): Promise<void> {
  const name = containerName(leaseId);
  try {
    await execFileP("docker", ["rm", "-f", name]);
    console.log(`[docker] removed sandbox ${name}`);
  } catch {
    /* already gone */
  }
}
