import {
  JOB_LOG_MAX_BYTES, JOB_RESULT_MAX_BYTES, NOTEBOOK_ARTIFACT_BYTES,
  NOTEBOOK_OUTPUT_BYTES, boundedRunTimeoutMs, notebookError,
} from "@tendril/shared";
import type { RunArtifact } from "@tendril/shared";

const SENTINEL = "__TENDRIL_NB__";

/** This code runs ONLY inside a disposable sandbox, never in the registry. */
export function notebookToPayload(notebook: Record<string, unknown>, timeoutMs = 120_000): string {
  const encoded = Buffer.from(JSON.stringify(notebook), "utf8").toString("base64");
  return `import asyncio, base64, json, os, subprocess, sys, tempfile, time, stat, mimetypes
from pathlib import Path
import nbformat
from nbclient import NotebookClient
from jupyter_client import AsyncKernelManager
from jupyter_client.kernelspec import KernelSpecManager
from IPython.core.inputtransformer2 import TransformerManager
import ast

os.makedirs("/work", exist_ok=True)
os.chdir("/work")
nb = nbformat.reads(base64.b64decode(${JSON.stringify(encoded)}).decode(), as_version=4)
for cell in nb.cells:
    if cell.cell_type == "code":
        cell.outputs = []
        cell.execution_count = None
# Never select a kernel command from uploaded metadata. Both lanes use the
# sandbox interpreter and a private IPC connection, with no exposed TCP port.
nb.metadata.kernelspec = {"name": "tendril-python3", "display_name": "Python 3", "language": "python"}
nb.metadata.pop("widgets", None)
OUTPUT_CAP = ${NOTEBOOK_OUTPUT_BYTES}
ARTIFACT_CAP = ${NOTEBOOK_ARTIFACT_BYTES}
deadline = time.monotonic() + ${boundedRunTimeoutMs(timeoutMs) / 1000}
notices = []
ok = False
failure = ""
output_bytes = 0

class BoundedClient(NotebookClient):
    def process_message(self, msg, cell, cell_index):
        global output_bytes
        if msg.get("header", {}).get("msg_type") in ("stream", "display_data", "execute_result", "error"):
            size = len(json.dumps(msg.get("content", {})).encode())
            output_bytes += size
            if output_bytes > OUTPUT_CAP:
                raise RuntimeError("Notebook output exceeded 2 MB; reduce printed data or save a small artifact.")
        return super().process_message(msg, cell, cell_index)

with tempfile.TemporaryDirectory(prefix=".tendril-", dir="/work") as runtime:
    kernel = Path(runtime) / "kernels" / "tendril-python3"
    kernel.mkdir(parents=True)
    # A fresh IPYTHONDIR keeps the sandbox image's IPython profile (startup
    # scripts, custom display formatters) out of the kernel, so every lane runs
    # the same plain kernel whatever image it is on.
    (kernel / "kernel.json").write_text(json.dumps({
        "argv": [sys.executable, "-m", "ipykernel_launcher", "--matplotlib=inline", "-f", "{connection_file}"],
        "display_name": "Python 3", "language": "python",
        "env": {"IPYTHONDIR": str(Path(runtime) / "ipython"),
                "MPLBACKEND": "module://matplotlib_inline.backend_inline"},
    }))
    km = AsyncKernelManager(kernel_name="tendril-python3", transport="ipc",
        connection_file=str(Path(runtime) / "connection.json"),
        kernel_spec_manager=KernelSpecManager(kernel_dirs=[str(kernel.parent)]))
    def cell_timeout(cell):
        return max(1, int(deadline - time.monotonic()))
    client = BoundedClient(nb, km=km, kernel_name="tendril-python3", allow_errors=False,
        force_raise_errors=True, timeout_func=cell_timeout, startup_timeout=30,
        resources={"metadata": {"path": "/work"}}, store_widget_state=False)
    try:
        # Catch syntax mistakes before earlier, expensive cells run. IPython's
        # transformer supports %pip, !commands, %%bash, and top-level await.
        transformer = TransformerManager()
        for index, cell in enumerate(nb.cells):
            if cell.cell_type != "code":
                continue
            try:
                compile(transformer.transform_cell(cell.source), f"<cell {index + 1}>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
            except SyntaxError as exc:
                cell.outputs = [nbformat.v4.new_output("error", ename=type(exc).__name__, evalue=str(exc), traceback=[str(exc)])]
                raise
        client.execute()
        ok = True
    except Exception as exc:
        # Never an empty log: some exceptions carry no message at all.
        failure = (f"{type(exc).__name__}: {exc}" if str(exc) else type(exc).__name__)[-4000:]
        # Per-cell timeouts here only ever come from the run deadline (credit or cap).
        if type(exc).__name__ == "CellTimeoutError" or time.monotonic() >= deadline - 1:
            failure = (f"Stopped at the ${boundedRunTimeoutMs(timeoutMs) / 1000}s limit "
                       f"(credit-funded time or job cap). " + failure)[-4000:]
        if "Kernel died" in failure:
            # nbclient only says the kernel died. Launch the same command by hand to
            # surface the real startup error (missing ipykernel, bad interpreter, …).
            try:
                probe = subprocess.run(
                    [sys.executable, "-m", "ipykernel_launcher", "--matplotlib=inline", "-f", str(Path(runtime) / "probe.json")],
                    capture_output=True, text=True, timeout=8)
                detail = (probe.stderr or probe.stdout or "").strip()[-1500:]
                failure = (failure + " | kernel startup: " + detail)[-4000:]
            except subprocess.TimeoutExpired:
                failure += " | the kernel starts on its own; it died only under the runner."
            except Exception:
                pass
    finally:
        # A supplied KernelManager is caller-owned; always stop its processes.
        async def cleanup():
            if km.has_kernel:
                await km.shutdown_kernel(now=True)
            await km.cleanup_resources()
        try:
            asyncio.run(cleanup())
        except Exception:
            pass

# Preserve useful partial output. Failures are concise; full cell errors stay
# in the executed notebook. Uploaded source is never automatically rewritten.
code_index = 0
stopped = failure.split(". ", 1)[0] + ". " if failure.startswith("Stopped at") else ""
for cell in nb.cells:
    if cell.cell_type != "code":
        continue
    code_index += 1
    for out in cell.get("outputs", []):
        if out.get("output_type") == "error":
            failure = (stopped + f"Cell {code_index}: {out.get('ename', 'Error')}: {out.get('evalue', '')}")[:4000]
            break
artifacts = []
used = 0
visited = 0
for root, dirs, files in os.walk("/work", followlinks=False):
    dirs[:] = sorted(d for d in dirs if not d.startswith(".") and not os.path.islink(os.path.join(root, d)))
    if len(Path(root).relative_to("/work").parts) > 8:
        dirs[:] = []
        continue
    for name in sorted(files):
        visited += 1
        if visited > 256:
            break
        path = Path(root) / name
        rel = path.relative_to("/work").as_posix()
        if name.startswith(".") or rel in ("in.ipynb", "out.ipynb", "job.py"):
            continue
        try:
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            with os.fdopen(fd, "rb") as f:
                info = os.fstat(f.fileno())
                if not stat.S_ISREG(info.st_mode):
                    continue
                if info.st_size > ARTIFACT_CAP - used:
                    notices.append(f"Skipped {rel[:160]}: artifact limit is 4 MB total.")
                    continue
                data = f.read(ARTIFACT_CAP - used + 1)
                if len(data) > ARTIFACT_CAP - used:
                    continue
            used += len(data)
            artifacts.append({"name": rel, "mediaType": mimetypes.guess_type(name)[0] or "application/octet-stream",
                "base64": base64.b64encode(data).decode()})
        except OSError:
            continue
    if visited > 256:
        notices.append("Artifact scan stopped at 256 files.")
        break
# Strip oversized metadata supplied by cell output before serializing.
nb.metadata = {"kernelspec": nb.metadata.kernelspec, "language_info": {"name": "python"}}
for cell in nb.cells:
    cell.metadata = {}
    cell.pop("attachments", None)
log = failure if not ok else "Notebook completed."
if notices:
    log += "\\n" + "\\n".join(notices[:20])
frame = json.dumps({"ok": ok, "notebook": nb, "artifacts": artifacts, "log": log})
if len(frame.encode()) > ${JOB_RESULT_MAX_BYTES - JOB_LOG_MAX_BYTES}:
    frame = json.dumps({"ok": False, "log": "Notebook result exceeded transport limit. Reduce output."})
sys.stdout.write("\\n${SENTINEL}\\n" + frame)
`;
}

export interface NotebookRun {
  ok: boolean;
  notebook?: Record<string, unknown>;
  artifacts?: RunArtifact[];
  log: string;
}

export function parseNotebookRun(output: string): NotebookRun {
  // Some older agents trim the leading newline. Match the marker at either
  // start of output or a line boundary and never display encoded frame data.
  const marker = /(?:^|\r?\n)__TENDRIL_NB__\r?\n/g;
  let last: RegExpExecArray | null = null;
  for (let match = marker.exec(output); match; match = marker.exec(output)) last = match;
  if (!last) return { ok: false, log: output.slice(0, JOB_LOG_MAX_BYTES).trim() || "Notebook runner produced no result." };
  const log = output.slice(0, last.index).slice(0, JOB_LOG_MAX_BYTES).trim();
  if (Buffer.byteLength(output) > JOB_RESULT_MAX_BYTES) return { ok: false, log: "Notebook result exceeded transport limit." };
  try {
    const parsed = JSON.parse(output.slice(last.index + last[0].length)) as NotebookRun;
    if (parsed.notebook && notebookError(parsed.notebook)) throw new Error("invalid notebook result");
    const artifacts: RunArtifact[] = [];
    let used = 0;
    for (const art of Array.isArray(parsed.artifacts) ? parsed.artifacts.slice(0, 256) : []) {
      if (!art || typeof art.name !== "string" || art.name.startsWith("/") || art.name.split(/[\\/]/).includes("..")
        || typeof art.base64 !== "string" || typeof art.mediaType !== "string") continue;
      used += Buffer.byteLength(art.base64, "base64");
      if (used > NOTEBOOK_ARTIFACT_BYTES) break;
      artifacts.push(art);
    }
    return {
      ok: parsed.ok === true, notebook: parsed.notebook, artifacts,
      log: [log, typeof parsed.log === "string" ? parsed.log : ""].filter(Boolean).join("\n").slice(0, JOB_LOG_MAX_BYTES),
    };
  } catch {
    return { ok: false, log: log || "Notebook result was incomplete or malformed. Update the contributor agent and rerun." };
  }
}
