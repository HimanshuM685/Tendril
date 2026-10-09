import { CommandExitError, Sandbox, Template } from "e2b";
import type { SandboxAccess } from "@tendril/shared";
import { JOB_RESULT_MAX_BYTES } from "@tendril/shared";
import { config } from "../config.js";
import { e2bSizeId, type E2bSize } from "../hosted.js";
import { notebookToPayload, parseNotebookRun } from "./notebookRunner.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

export const id = "e2b" as const;

const sandboxes = new Map<string, Sandbox>();

// The core `e2b` SDK defaults to the bare "base" template (no matplotlib, so the
// runner's `--matplotlib=inline` kernel dies on startup). code-interpreter-v1 is
// E2B's data-science image: ipykernel, numpy, pandas, matplotlib, scipy, sklearn.
const DEFAULT_TEMPLATE = "code-interpreter-v1";

// The Modal image's package list. Baked into every size template so a run never
// waits on pip; ENSURE_RUNNER_DEPS below stays as a fast safety net.
const NOTEBOOK_PACKAGES = [
  "nbformat", "nbclient", "jupyter_client", "ipython", "ipykernel", "matplotlib-inline",
  "numpy", "pandas", "matplotlib", "scipy", "scikit-learn", "pillow", "requests", "psutil",
  "joblib", "tqdm",
];

/**
 * E2B fixes CPU and RAM per template at build time, so each size is its own
 * template. Built once per E2B account (`Template.exists` short-circuits after
 * that); memoized so concurrent runs of a new size share one build.
 */
const templates = new Map<string, Promise<string>>();

export function templateName(size: E2bSize): string {
  return `tendril-nb-${e2bSizeId(size)}`;
}

export function ensureTemplate(size: E2bSize): Promise<string> {
  const name = templateName(size);
  let pending = templates.get(name);
  if (!pending) {
    pending = (async () => {
      const opts = { apiKey: apiKey() };
      if (await Template.exists(name, opts)) return name;
      console.log(`[e2b] building template ${name} (${size.vCpu} vCPU, ${size.memGiB} GiB)…`);
      const build = Template.build(
        Template().fromTemplate(DEFAULT_TEMPLATE).pipInstall(NOTEBOOK_PACKAGES),
        name,
        { ...opts, cpuCount: size.vCpu, memoryMB: size.memGiB * 1024 },
      );
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`E2B template ${name} did not build within ${config.e2bTemplateBuildTimeoutMs / 1000}s`)),
          config.e2bTemplateBuildTimeoutMs,
        );
      });
      try {
        await Promise.race([build, timeout]);
      } finally {
        clearTimeout(timer);
      }
      console.log(`[e2b] template ${name} ready`);
      return name;
    })();
    // A failed build must not poison the cache; the next run retries it.
    pending.catch(() => templates.delete(name));
    templates.set(name, pending);
  }
  return pending;
}

/** Warm the preset sizes at boot so most runs never wait on a build. */
export function warmTemplates(sizes: readonly E2bSize[]): void {
  if (!config.e2bApiKey || config.e2bTemplate) return;
  for (const size of sizes) {
    ensureTemplate(size).catch((err) =>
      console.error(`[e2b] template ${templateName(size)} warm failed:`, (err as Error).message),
    );
  }
}

// The runner/kernel imports plus the same package set as the Modal image, so a
// notebook behaves the same on both hosted lanes. Installed with this
// interpreter's pip, only the missing ones (psutil, tqdm on code-interpreter-v1).
const ENSURE_RUNNER_DEPS = `python3 - <<'PY'
import importlib.util, subprocess, sys
need = {"nbformat": "nbformat", "nbclient": "nbclient", "jupyter_client": "jupyter_client",
        "IPython": "ipython", "ipykernel": "ipykernel", "matplotlib_inline": "matplotlib-inline",
        "numpy": "numpy", "pandas": "pandas", "matplotlib": "matplotlib", "scipy": "scipy",
        "sklearn": "scikit-learn", "PIL": "pillow", "requests": "requests", "psutil": "psutil",
        "joblib": "joblib", "tqdm": "tqdm"}
missing = [pip for mod, pip in need.items() if importlib.util.find_spec(mod) is None]
if missing:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *missing])
PY`;

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
    // E2B_TEMPLATE pins one template (one size); otherwise the node's size picks it.
    const template =
      config.e2bTemplate ||
      (await ensureTemplate({ vCpu: args.node.cpuCores, memGiB: Math.round(args.node.ramMb / 1024) }));
    sb = await Sandbox.create(template, opts);
    sandboxes.set(args.leaseId, sb);
    console.log(`[e2b] sandbox ${sb.sandboxId} for lease ${args.leaseId}`);
    await sb.commands.run("mkdir -p /work", { user: "root" });
    const deps = await runText(sb, ENSURE_RUNNER_DEPS, config.e2bReadyTimeoutMs);
    if (deps.code !== 0) {
      throw new Error(`could not prepare the E2B sandbox: ${deps.stderr.trim().slice(-500) || `exit ${deps.code}`}`);
    }
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
    // A failed run keeps the stderr tail: kernel and import crashes only show there.
    result: parsed.notebook && ran.code === 0 && parsed.ok
      ? parsed.log
      : `${parsed.log}\n${ran.stderr.slice(parsed.notebook ? -1500 : 0, parsed.notebook ? undefined : 4000)}`.trim(),
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
