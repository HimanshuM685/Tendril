import { CommandExitError, Sandbox } from "e2b";
import type { SandboxAccess } from "@tendril/shared";
import { JOB_RESULT_MAX_BYTES } from "@tendril/shared";
import { config } from "../config.js";
import { notebookToPayload, parseNotebookRun } from "./notebookRunner.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

export const id = "e2b" as const;

const sandboxes = new Map<string, Sandbox>();

// E2B's default code-interpreter template ships jupyter-server + ipykernel; the
// shared runner also needs nbclient/nbformat, which come with it transitively.
// Installed only if the import check fails, so the common case costs one process.
const ENSURE_RUNNER_DEPS =
  `python3 -c "import nbformat, nbclient, jupyter_client, IPython" 2>/dev/null || ` +
  `pip install -q nbformat nbclient jupyter_client ipython`;

function apiKey(): string {
  if (!config.e2bApiKey) throw new Error("E2B_API_KEY is not set");
  return config.e2bApiKey;
}

async function drop(leaseId: string, sb: Sandbox | null): Promise<void> {
  sandboxes.delete(leaseId);
  if (!sb) return;
  try {
    await sb.kill();
  } catch (err) {
    console.error(`[e2b] kill ${leaseId} failed:`, (err as Error).message);
  }
}

/** `commands.run` throws on a non-zero exit; a failed cell run is data, not an error. */
async function runText(
  sb: Sandbox,
  command: string,
  timeoutMs: number,
): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const r = await sb.commands.run(command, { cwd: "/work", timeoutMs, user: "root" });
    return { code: r.exitCode, stdout: r.stdout, stderr: r.stderr };
  } catch (err) {
    if (err instanceof CommandExitError) {
      return { code: err.exitCode, stdout: err.stdout, stderr: err.stderr };
    }
    throw err;
  }
}

function bounded(out: { stdout: string; stderr: string }, sb: Sandbox): void {
  if (Buffer.byteLength(out.stdout) + Buffer.byteLength(out.stderr) > JOB_RESULT_MAX_BYTES) {
    void sb.kill().catch(() => undefined);
    throw new Error("Job output exceeded 12 MB; sandbox stopped.");
  }
}

export async function start(args: StartArgs): Promise<SandboxAccess> {
  if (args.surface !== "exec") {
    throw new Error("the e2b lane only runs notebooks and one-shot jobs");
  }
  const key = apiKey();
  let sb: Sandbox | null = null;
  try {
    const opts = {
      apiKey: key,
      timeoutMs: Math.max(args.timeoutMs, config.e2bReadyTimeoutMs),
      requestTimeoutMs: config.e2bReadyTimeoutMs,
    };
    sb = config.e2bTemplate
      ? await Sandbox.create(config.e2bTemplate, opts)
      : await Sandbox.create(opts);
    sandboxes.set(args.leaseId, sb);
    console.log(`[e2b] sandbox ${sb.sandboxId} for lease ${args.leaseId}`);
    await sb.commands.run("mkdir -p /work", { user: "root" });
    await runText(sb, ENSURE_RUNNER_DEPS, config.e2bReadyTimeoutMs);
    return {
      kind: "ssh",
      host: "e2b",
      port: 0,
      username: "root",
      authMethod: "publickey",
      password: null,
      command: "",
    };
  } catch (err) {
    await drop(args.leaseId, sb);
    throw err;
  }
}

async function runNotebook(sb: Sandbox, notebook: Record<string, unknown>, timeoutMs: number): Promise<ExecResult> {
  await sb.files.write("/work/.tendril-runner.py", notebookToPayload(notebook, timeoutMs), { user: "root" });
  const ran = await runText(sb, "python3 /work/.tendril-runner.py", timeoutMs);
  bounded(ran, sb);
  const parsed = parseNotebookRun(ran.stdout);
  return {
    ok: ran.code === 0 && parsed.ok,
    result: parsed.notebook ? parsed.log : `${parsed.log}\n${ran.stderr.slice(0, 4000)}`.trim(),
    notebook: parsed.notebook,
    artifacts: parsed.artifacts,
  };
}

async function runPython(sb: Sandbox, payload: string, timeoutMs: number): Promise<ExecResult> {
  await sb.files.write("/work/job.py", payload, { user: "root" });
  const ran = await runText(sb, "python3 /work/job.py", timeoutMs);
  bounded(ran, sb);
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
  await drop(leaseId, sandboxes.get(leaseId) ?? null);
}

export const e2bProvider: ComputeProvider = {
  id,
  start,
  exec,
  destroy: (leaseId) => destroy(leaseId),
};
