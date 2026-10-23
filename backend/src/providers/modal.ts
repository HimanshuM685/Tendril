import { randomBytes } from "node:crypto";
import { ModalClient, type Image, type Sandbox } from "modal";
import type { JupyterAccess, NotebookRuntimeOptions, SandboxAccess } from "@tendril/shared";
import { JOB_RESULT_MAX_BYTES } from "@tendril/shared";
import { config } from "../config.js";
import { notebookToPayload, parseNotebookRun } from "./notebookRunner.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

const JUPYTER_PORT = 8888;
/** python:3.12-slim's default CMD is `python3`, which exits when stdin closes. */
const KEEP_ALIVE = ["python3", "-c", "import time; time.sleep(2**31)"];
const DEPENDENCY_PROBE = [
  "python3",
  "-c",
  "import nbclient, nbformat, ipykernel, numpy, pandas, matplotlib, requests, scipy, sklearn, PIL, psutil",
];

const sandboxes = new Map<string, Sandbox>();

let client: ModalClient | null = null;
let builtImage: Image | null = null;
let building: Promise<Image> | null = null;

export const id = "modal" as const;

function modalLog(event: string, fields: Record<string, unknown> = {}): void {
  console.log(`[modal] ${JSON.stringify({ event, ...fields })}`);
}

function modalFailure(event: string, startedAt: number, err: unknown, fields: Record<string, unknown> = {}): void {
  modalLog(event, {
    ...fields,
    ok: false,
    elapsedMs: Date.now() - startedAt,
    error: err instanceof Error ? err.message : String(err),
  });
}

function modalClient(): ModalClient {
  if (!config.modalTokenId || !config.modalTokenSecret) {
    throw new Error("MODAL_TOKEN_ID and MODAL_TOKEN_SECRET are required");
  }
  if (!client) {
    client = new ModalClient({
      tokenId: config.modalTokenId,
      tokenSecret: config.modalTokenSecret,
      timeoutMs: config.modalReadyTimeoutMs,
    });
  }
  return client;
}

function noteModalError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (/unauth|invalid token|permission denied|UNAUTHENTICATED|\b401\b|\b403\b/i.test(msg)) {
    client = null;
    builtImage = null;
  }
}

async function buildImage(): Promise<Image> {
  const modal = modalClient();
  const app = await modal.apps.fromName(config.modalAppName, { createIfMissing: true });
  const image = modal.images.fromRegistry("python:3.12-slim").dockerfileCommands([
    // Keep notebook dependencies in the cached image. Installing scipy and
    // scikit-learn inside every priority run adds avoidable cold-start time and
    // makes a run depend on package-index availability.
    "RUN pip install --no-cache-dir jupyterlab nbclient nbformat nbconvert ipykernel numpy pandas matplotlib requests scipy scikit-learn pillow psutil && python -m ipykernel install --sys-prefix && mkdir -p /work",
  ]);
  return image.build(app);
}

function ensureImage(): Promise<Image> {
  if (builtImage) {
    modalLog("image.reused");
    return Promise.resolve(builtImage);
  }
  if (!building) {
    const startedAt = Date.now();
    const pending = buildImage()
      .then((image) => {
        builtImage = image;
        modalLog("image.ready", { elapsedMs: Date.now() - startedAt });
        return image;
      })
      .catch((err) => {
        if (building === pending) building = null;
        noteModalError(err);
        modalFailure("image.failed", startedAt, err);
        throw err;
      });
    building = pending;
  }
  return building;
}

/** Build the notebook image once. Safe to call at boot; later creates hit Modal's cache. */
export function warmNotebookImage(): Promise<void> {
  if (!config.modalTokenId || !config.modalTokenSecret) return Promise.resolve();
  return ensureImage().then(() => undefined);
}

async function execText(
  sb: Sandbox,
  command: string[],
  timeoutMs: number,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = await sb.exec(command, {
    stdout: "pipe",
    stderr: "pipe",
    workdir: "/work",
    timeoutMs,
  });
  let used = 0;
  async function readBounded(stream: ReadableStream<string>): Promise<string> {
    const reader = stream.getReader();
    const chunks: string[] = [];
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        used += Buffer.byteLength(chunk.value);
        if (used > JOB_RESULT_MAX_BYTES) {
          void sb.terminate().catch(() => undefined);
          throw new Error("Job output exceeded 12 MB; sandbox stopped.");
        }
        chunks.push(chunk.value);
      }
      return chunks.join("");
    } finally {
      reader.releaseLock();
    }
  }
  const [stdout, stderr, code] = await Promise.all([
    readBounded(proc.stdout),
    readBounded(proc.stderr),
    proc.wait(),
  ]);
  return { code, stdout, stderr };
}

async function drop(leaseId: string, sb: Sandbox | null): Promise<void> {
  sandboxes.delete(leaseId);
  if (!sb) return;
  try {
    await sb.terminate();
  } catch (err) {
    console.error(`[modal] terminate ${leaseId} failed:`, (err as Error).message);
  }
}

function jupyterCommand(token: string): string[] {
  return [
    "jupyter",
    "lab",
    "--no-browser",
    "--allow-root",
    "--ip=0.0.0.0",
    `--port=${JUPYTER_PORT}`,
    `--ServerApp.token=${token}`,
    `--IdentityProvider.token=${token}`,
    "--ServerApp.password=",
    "--NotebookApp.allow_origin=*",
    "--NotebookApp.allow_remote_access=1",
    "--ServerApp.allow_origin=*",
    "--ServerApp.allow_remote_access=True",
  ];
}

async function waitForJupyter(baseUrl: string, token: string, deadline: number): Promise<void> {
  const statusUrl = new URL("/api/status", baseUrl);
  statusUrl.searchParams.set("token", token);
  while (Date.now() < deadline) {
    try {
      const res = await fetch(statusUrl, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) {
        const body = (await res.json()) as { started?: boolean };
        if (body.started !== false) return;
      }
    } catch {
      /* lab still booting */
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error("jupyter did not become ready");
}

async function probeDependencies(sb: Sandbox, deadline: number): Promise<void> {
  if (Date.now() >= deadline) throw new Error("sandbox dependency probe timed out");
  const timeoutMs = Math.max(1_000, Math.min(30_000, deadline - Date.now()));
  const probe = await execText(sb, DEPENDENCY_PROBE, timeoutMs);
  if (probe.code !== 0) {
    throw new Error(`sandbox dependencies are not ready: ${probe.stderr.trim().slice(-500) || `exit ${probe.code}`}`);
  }
}

function jupyterAccess(tunnelUrl: string, token: string): JupyterAccess {
  const url = new URL("/", tunnelUrl);
  url.searchParams.set("token", token);
  return { kind: "jupyter", url: url.toString(), token };
}

export async function start(args: StartArgs): Promise<SandboxAccess> {
  if (args.surface === "ssh") {
    throw new Error("ssh surface is not available on a hosted node");
  }
  const modal = modalClient();
  const app = await modal.apps.fromName(config.modalAppName, { createIfMissing: true });
  const physical = Math.max(0.125, args.node.cpuCores / 2);
  const memoryMiB = args.node.ramMb;
  const token = args.surface === "jupyter" ? randomBytes(18).toString("base64url") : "";
  const startedAt = Date.now();
  const deadline = Date.now() + config.modalReadyTimeoutMs;
  const image = args.image
    ? modal.images.fromRegistry(args.image)
    : await ensureImage();

  let sb: Sandbox | null = null;
  try {
    sb = await modal.sandboxes.create(app, image, {
      cpu: physical,
      cpuLimit: physical,
      memoryMiB,
      memoryLimitMiB: memoryMiB,
      timeoutMs: Math.max(args.timeoutMs, config.modalReadyTimeoutMs),
      workdir: "/work",
      command: args.surface === "jupyter" ? jupyterCommand(token) : KEEP_ALIVE,
      encryptedPorts: args.surface === "jupyter" ? [JUPYTER_PORT] : undefined,
      // JUPYTER_TOKEN only. Modal credentials stay on the backend process.
      env: args.surface === "jupyter" ? { JUPYTER_TOKEN: token, SHELL: "/bin/bash" } : undefined,
    });
    sandboxes.set(args.leaseId, sb);
    modalLog("sandbox.created", {
      leaseId: args.leaseId,
      sandboxId: sb.sandboxId,
      surface: args.surface,
      elapsedMs: Date.now() - startedAt,
    });

    if (args.surface !== "jupyter") {
      await probeDependencies(sb, deadline);
      modalLog("sandbox.ready", { leaseId: args.leaseId, surface: args.surface, elapsedMs: Date.now() - startedAt });
      return {
        kind: "ssh",
        host: "modal",
        port: 0,
        username: "root",
        authMethod: "publickey",
        password: null,
        command: "",
      };
    }

    const tunnels = await sb.tunnels(Math.max(1_000, deadline - Date.now()));
    const tunnel = tunnels[JUPYTER_PORT];
    if (!tunnel?.url) throw new Error("jupyter tunnel missing");
    await waitForJupyter(tunnel.url, token, deadline);
    await probeDependencies(sb, deadline);
    modalLog("sandbox.ready", { leaseId: args.leaseId, surface: args.surface, elapsedMs: Date.now() - startedAt });
    return jupyterAccess(tunnel.url, token);
  } catch (err) {
    noteModalError(err);
    modalFailure("sandbox.failed", startedAt, err, { leaseId: args.leaseId, surface: args.surface });
    await drop(args.leaseId, sb);
    throw err;
  }
}

async function runNotebook(
  sb: Sandbox,
  notebook: Record<string, unknown>,
  timeoutMs: number,
  runtime?: NotebookRuntimeOptions,
): Promise<ExecResult> {
  // One execution engine for both providers: real IPython magics/rich output,
  // private IPC kernel, syntax preflight, and bounded result/artifact collection.
  await sb.filesystem.writeText(notebookToPayload(notebook, timeoutMs, runtime), "/work/.tendril-runner.py");
  const ran = await execText(
    sb,
    ["python3", "/work/.tendril-runner.py"],
    timeoutMs,
  );
  const parsed = parseNotebookRun(ran.stdout);
  return {
    ok: ran.code === 0 && parsed.ok,
    // A failed run keeps the stderr tail: kernel and import crashes only show there.
    result: parsed.notebook && ran.code === 0 && parsed.ok
      ? parsed.log
      : `${parsed.log}\n${ran.stderr.slice(parsed.notebook ? -1500 : 0, parsed.notebook ? undefined : 4000)}`.trim(),
    notebook: parsed.notebook, artifacts: parsed.artifacts,
  };
}

async function runPython(sb: Sandbox, payload: string, timeoutMs: number): Promise<ExecResult> {
  await sb.filesystem.writeText(payload, "/work/job.py");
  const ran = await execText(sb, ["python3", "/work/job.py"], timeoutMs);
  const output = ran.code === 0 ? ran.stdout : `${ran.stdout}\n${ran.stderr}`.trim();
  return { ok: ran.code === 0, result: output };
}

export async function exec(args: ExecArgs): Promise<ExecResult> {
  const sb = sandboxes.get(args.leaseId);
  if (!sb) throw new Error("sandbox not running");
  try {
    if (args.notebook) return await runNotebook(sb, args.notebook, args.timeoutMs, args.notebookRuntime);
    if (typeof args.payload !== "string") throw new Error("payload (string) required");
    return await runPython(sb, args.payload, args.timeoutMs);
  } catch (err) {
    noteModalError(err);
    throw err;
  }
}

export async function destroy(leaseId: string): Promise<void> {
  const sb = sandboxes.get(leaseId);
  await drop(leaseId, sb ?? null);
}

export const modalProvider: ComputeProvider = {
  id,
  start,
  exec,
  destroy: (leaseId) => destroy(leaseId),
};
