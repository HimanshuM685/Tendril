import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { JOB_RESULT_MAX_BYTES, notebookError } from "@tendril/shared";
import { notebookToPayload, parseNotebookRun } from "./notebookRunner.js";

function notebook(sources: string[]) {
  return {
    nbformat: 4, nbformat_minor: 5, metadata: {},
    cells: sources.map((source, i) => ({ id: `cell-${i}`, cell_type: "code", source, metadata: {}, outputs: [], execution_count: null })),
  };
}

test("notebook validation accepts Python magics but rejects unsupported structure/kernels", () => {
  assert.equal(notebookError(notebook(["%pip --version"])), null);
  assert.match(notebookError({ nbformat: 3, cells: [], metadata: {} })!, /nbformat 4/);
  assert.match(notebookError({ ...notebook([]), metadata: { language_info: { name: "R" } } })!, /Python/);
  assert.match(notebookError(notebook(Array(501).fill("pass")))!, /500 cells/);
});

test("result marker handles trimmed legacy output and never leaks a raw frame", () => {
  const nb = notebook(["print(1)"]);
  const parsed = parseNotebookRun(`__TENDRIL_NB__\n${JSON.stringify({ ok: false, notebook: nb })}`);
  assert.equal(parsed.ok, false);
  assert.deepEqual(parsed.notebook, nb);
  assert.equal(parsed.log, "");
  const broken = parseNotebookRun("runner message\n__TENDRIL_NB__\n{broken");
  assert.equal(broken.log, "runner message");
  assert.equal(broken.notebook, undefined);
});

const image = process.env.TENDRIL_NOTEBOOK_TEST_IMAGE;
function executeNotebook(nb: Record<string, unknown>, timeoutMs = 30_000) {
  const process = spawnSync("docker", ["run", "--rm", "-i", "--read-only", "--network", "none",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--memory", "1g", "--cpus", "2", "--pids-limit", "256",
    "--tmpfs", "/work:rw,nosuid,nodev,size=256m,mode=1777", "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m,mode=1777",
    "-e", "HOME=/work", "-e", "MPLBACKEND=Agg", "-e", "PYTHONDONTWRITEBYTECODE=1",
    "-e", "OPENBLAS_NUM_THREADS=2", "--entrypoint", "python3", image!, "-"], {
    input: notebookToPayload(nb, timeoutMs), encoding: "utf8", timeout: 60_000, maxBuffer: JOB_RESULT_MAX_BYTES,
  });
  assert.equal(process.status, 0, process.stderr || String(process.error));
  return parseNotebookRun(process.stdout);
}
function execute(sources: string[], timeoutMs = 30_000) {
  return executeNotebook(notebook(sources), timeoutMs);
}

test("real kernel runs magics, shell cells, rich plots, await, process pools, and artifacts", { skip: !image }, () => {
  const result = execute([
    "%pip --version\n%pip install --no-index --no-deps psutil",
    "%%bash\nprintf 'shell works\\n'",
    "import asyncio\nawait asyncio.sleep(0.01)\nprint('await works')",
    "import matplotlib.pyplot as plt\nplt.plot([1, 2], [3, 4]); plt.show()",
    "from concurrent.futures import ProcessPoolExecutor\ndef square(n):\n    return n*n\nwith ProcessPoolExecutor(max_workers=2) as ex:\n    print(list(ex.map(square, [1,2,3])))",
    "from pathlib import Path\nimport os\nPath('result.txt').write_text('done')\nos.symlink('result.txt', 'link.txt')\nos.mkfifo('pipe')",
  ]);
  assert.equal(result.ok, true, result.log);
  const cells = result.notebook!.cells as { outputs: Record<string, unknown>[] }[];
  assert.ok(cells[3].outputs.some((o) => (o.data as Record<string, unknown> | undefined)?.["image/png"]));
  assert.ok(JSON.stringify(cells[4].outputs).includes("[1, 4, 9]"));
  assert.deepEqual(result.artifacts?.map((a) => a.name), ["result.txt"]);
});

test("syntax preflight stops before expensive cells without changing source", { skip: !image }, () => {
  const source = "with open('bad.txt', 'w') as f:\nprint('invalid')";
  const result = execute(["print('must not execute')", source]);
  assert.equal(result.ok, false);
  assert.match(result.log, /Cell 2: IndentationError/);
  const cells = result.notebook!.cells as { source: string; outputs: unknown[] }[];
  assert.equal(cells[0].outputs.length, 0);
  assert.equal(cells[1].source, source);
});

test("runtime errors keep earlier outputs and do not run later cells", { skip: !image }, () => {
  const result = execute(["print('kept')", "raise ValueError('bad input')", "print('must not execute')"]);
  assert.equal(result.ok, false);
  assert.match(result.log, /Cell 2: ValueError: bad input/);
  const cells = result.notebook!.cells as { outputs: unknown[] }[];
  assert.ok(JSON.stringify(cells[0].outputs).includes("kept"));
  assert.equal(cells[2].outputs.length, 0);
});

test("output and execution caps stop oversized or over-time workloads", { skip: !image }, () => {
  const tooMuch = execute(["print('x' * 2000001)"]);
  assert.equal(tooMuch.ok, false);
  assert.match(tooMuch.log, /output exceeded/);
  const tooSlow = execute(["import time\ntime.sleep(20)"], 2_000);
  assert.equal(tooSlow.ok, false);
  assert.match(tooSlow.log, /timed out|timeout/i);
});

test("artifact collection skips oversized files and keeps small downloads", { skip: !image }, () => {
  const result = execute(["from pathlib import Path\nwith open('too-big.bin', 'wb') as f:\n    f.truncate(5000000)\nPath('result.txt').write_text('kept')"]);
  assert.equal(result.ok, true, result.log);
  assert.deepEqual(result.artifacts?.map((a) => a.name), ["result.txt"]);
  assert.match(result.log, /Skipped too-big.bin/);
});

test("bundled benchmark runs successfully with bounded artifacts", { skip: !image }, () => {
  const nb = JSON.parse(readFileSync(new URL("../../../example-buyer/notebooks/tendril_benchmark.ipynb", import.meta.url), "utf8"));
  const result = executeNotebook(nb);
  assert.equal(result.ok, true, result.log);
  assert.ok(result.artifacts?.some((a) => a.name === "results/summary.json"));
  assert.ok(result.artifacts?.some((a) => a.name === "results/bundle.zip"));
});
