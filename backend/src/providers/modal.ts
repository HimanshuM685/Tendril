import { randomBytes } from "node:crypto";
import { ModalClient, type Sandbox } from "modal";
import type { JupyterAccess, RunArtifact, SandboxAccess } from "@tendril/shared";
import { config } from "../config.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

const JUPYTER_PORT = 8888;
const ARTIFACT_CAP_BYTES = 4_000_000;

const sandboxes = new Map<string, Sandbox>();

let client: ModalClient | null = null;
let imageReady: ReturnType<ModalClient["images"]["fromRegistry"]> | null = null;

export const id = "modal" as const;

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

function notebookImage(modal: ModalClient) {
  if (!imageReady) {
    imageReady = modal.images.fromRegistry("python:3.12-slim").dockerfileCommands([
      "RUN pip install --no-cache-dir jupyterlab papermill nbconvert ipykernel && python -m ipykernel install --sys-prefix && mkdir -p /work",
    ]);
  }
  return imageReady;
}

async function execText(
  sb: Sandbox,
  command: string[],
  timeoutMs: number,
  stdin?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = await sb.exec(command, {
    stdout: "pipe",
    stderr: "pipe",
    workdir: "/work",
    timeoutMs,
  });
  const stdoutP = proc.stdout.readText();
  const stderrP = proc.stderr.readText();
  if (stdin !== undefined) {
    const writer = proc.stdin.getWriter();
    try {
      await writer.write(stdin);
    } finally {
      await writer.close();
    }
  }
  const [stdout, stderr, code] = await Promise.all([stdoutP, stderrP, proc.wait()]);
  return { code, stdout, stderr };
}

async function drop(leaseId: string, sb: Sandbox | null): Promise<void> {
  if (!sb) return;
  await sb.terminate();
  sandboxes.delete(leaseId);
}

function jupyterCommand(): string[] {
  return [
    "jupyter",
    "lab",
    "--no-browser",
    "--allow-root",
    "--ip=0.0.0.0",
    `--port=${JUPYTER_PORT}`,
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
  const deadline = Date.now() + config.modalReadyTimeoutMs;

  let sb: Sandbox | null = null;
  try {
    sb = await modal.sandboxes.create(app, notebookImage(modal), {
      cpu: physical,
      cpuLimit: physical,
      memoryMiB,
      memoryLimitMiB: memoryMiB,
      timeoutMs: Math.max(args.timeoutMs, config.modalReadyTimeoutMs),
      workdir: "/work",
      command: args.surface === "jupyter" ? jupyterCommand() : undefined,
      encryptedPorts: args.surface === "jupyter" ? [JUPYTER_PORT] : undefined,
      // JUPYTER_TOKEN only. Modal credentials stay on the backend process.
      env: args.surface === "jupyter" ? { JUPYTER_TOKEN: token, SHELL: "/bin/bash" } : undefined,
    });
    sandboxes.set(args.leaseId, sb);
    console.log(`[modal] sandbox ${sb.sandboxId} for lease ${args.leaseId} (${args.surface})`);

    if (args.surface !== "jupyter") {
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
    return jupyterAccess(tunnel.url, token);
  } catch (err) {
    await drop(args.leaseId, sb);
    throw err;
  }
}

const WRITE_NOTEBOOK = [
  "import pathlib, sys",
  "pathlib.Path('/work').mkdir(parents=True, exist_ok=True)",
  "pathlib.Path('/work/in.ipynb').write_text(sys.stdin.read())",
].join("\n");

const LIST_ARTIFACTS = [
  "import json, os",
  "rows = []",
  "for dirpath, _, files in os.walk('/work'):",
  "    for name in files:",
  "        path = os.path.join(dirpath, name)",
  "        rel = os.path.relpath(path, '/work')",
  "        if rel in ('in.ipynb', 'out.ipynb'):",
  "            continue",
  "        rows.append({'name': rel, 'size': os.path.getsize(path)})",
  "print(json.dumps(rows))",
].join("\n");

function mediaType(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const known: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    csv: "text/csv",
    json: "application/json",
    txt: "text/plain",
    html: "text/html",
    pdf: "application/pdf",
  };
  return known[ext] ?? "application/octet-stream";
}

function safeName(name: string): boolean {
  return name.length > 0 && !name.startsWith("/") && !name.split("/").includes("..");
}

async function runNotebook(sb: Sandbox, notebook: Record<string, unknown>, timeoutMs: number): Promise<ExecResult> {
  const written = await execText(sb, ["python3", "-c", WRITE_NOTEBOOK], timeoutMs, JSON.stringify(notebook));
  if (written.code !== 0) {
    throw new Error(written.stderr.trim() || "failed to write notebook");
  }

  const ran = await execText(
    sb,
    ["papermill", "/work/in.ipynb", "/work/out.ipynb", "--cwd", "/work"],
    timeoutMs,
  );
  if (ran.code !== 0) {
    const detail = (ran.stderr || ran.stdout).trim().slice(0, 4_000);
    throw new Error(detail || "notebook execution failed");
  }

  const text = await sb.filesystem.readText("/work/out.ipynb");
  const executed = JSON.parse(text) as Record<string, unknown>;
  const listed = await execText(sb, ["python3", "-c", LIST_ARTIFACTS], 30_000);
  if (listed.code !== 0) {
    throw new Error(listed.stderr.trim() || "failed to list artifacts");
  }
  const rows = JSON.parse(listed.stdout) as { name: string; size: number }[];
  const artifacts: RunArtifact[] = [];
  let used = 0;
  for (const row of rows) {
    if (!safeName(row.name) || used + row.size > ARTIFACT_CAP_BYTES) continue;
    const bytes = await sb.filesystem.readBytes(`/work/${row.name}`);
    if (used + bytes.byteLength > ARTIFACT_CAP_BYTES) continue;
    used += bytes.byteLength;
    artifacts.push({
      name: row.name,
      mediaType: mediaType(row.name),
      base64: Buffer.from(bytes).toString("base64"),
    });
  }
  const log = [ran.stdout, ran.stderr].filter(Boolean).join("\n").trim();
  return { ok: true, result: log, notebook: executed, artifacts };
}

async function runPython(sb: Sandbox, payload: string, timeoutMs: number): Promise<ExecResult> {
  const ran = await execText(sb, ["python3", "-"], timeoutMs, payload);
  const output = ran.code === 0 ? ran.stdout : `${ran.stdout}\n${ran.stderr}`.trim();
  return { ok: ran.code === 0, result: output };
}

export async function exec(args: ExecArgs): Promise<ExecResult> {
  const sb = sandboxes.get(args.leaseId);
  if (!sb) throw new Error("sandbox not running");
  if (args.notebook) return runNotebook(sb, args.notebook, args.timeoutMs);
  if (typeof args.payload !== "string") throw new Error("payload (string) required");
  return runPython(sb, args.payload, args.timeoutMs);
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
