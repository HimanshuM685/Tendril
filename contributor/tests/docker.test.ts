import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { notebookToPayload, parseNotebookRun } from "../../backend/src/providers/notebookRunner.js";
import { runInSandbox, startSandbox, stopSandbox } from "../src/docker.js";

const exec = promisify(execFile);
const image = process.env.TENDRIL_NOTEBOOK_TEST_IMAGE;

test("contributor exec sandbox has no tunnel, supports writable pip, and stops timed-out descendants", { skip: !image }, async () => {
  const leaseId = `test-${randomUUID()}`;
  const name = `tendril-${leaseId}`;
  try {
    const endpoint = await startSandbox(leaseId, image!, { cpus: 2, memory: "1g", gpus: "" }, null, null, true, undefined, undefined, 60_000);
    assert.equal(endpoint.port, 0);
    const { stdout } = await exec("docker", ["inspect", name]);
    const [container] = JSON.parse(stdout);
    assert.equal(container.HostConfig.ReadonlyRootfs, true);
    assert.deepEqual(container.HostConfig.CapDrop, ["ALL"]);
    assert.ok(!container.HostConfig.CapAdd?.length);
    assert.ok(!container.HostConfig.Binds?.length);
    assert.equal(Object.keys(container.HostConfig.PortBindings ?? {}).length, 0);
    assert.ok(!container.Config.Env.some((e: string) => /^(TENDRIL_API_KEY|BORE_SECRET|MODAL_TOKEN)/.test(e)));

    const nb = {
      nbformat: 4, nbformat_minor: 5, metadata: {},
      cells: [{ id: "venv", cell_type: "code", metadata: {}, outputs: [], execution_count: null,
        source: [
          "import sys, pathlib, zipfile",
          "wheel = '/tmp/tendril_smoke-1.0-py3-none-any.whl'",
          "with zipfile.ZipFile(wheel, 'w') as z:",
          "    z.writestr('tendril_smoke/__init__.py', 'answer = 42')",
          "    z.writestr('tendril_smoke-1.0.dist-info/METADATA', 'Metadata-Version: 2.1\\nName: tendril-smoke\\nVersion: 1.0\\n')",
          "    z.writestr('tendril_smoke-1.0.dist-info/WHEEL', 'Wheel-Version: 1.0\\nGenerator: test\\nRoot-Is-Purelib: true\\nTag: py3-none-any\\n')",
          "    z.writestr('tendril_smoke-1.0.dist-info/RECORD', '')",
          "%pip install --no-index --no-deps /tmp/tendril_smoke-1.0-py3-none-any.whl",
          "import tendril_smoke",
          "assert tendril_smoke.answer == 42",
          "print(sys.prefix)",
          "pathlib.Path('result.txt').write_text('done')",
        ].join("\n") }],
    };
    const run = await runInSandbox(leaseId, notebookToPayload(nb, 20_000), 30_000);
    assert.equal(run.ok, true, run.output);
    const parsed = parseNotebookRun(run.output);
    assert.equal(parsed.ok, true, parsed.log);
    assert.ok(JSON.stringify(parsed.notebook).includes("/work/.venv"));
    assert.deepEqual(parsed.artifacts?.map((a) => a.name), ["result.txt"]);

    const timed = await runInSandbox(leaseId, "import subprocess, time\nsubprocess.Popen(['sleep', '30'])\ntime.sleep(30)", 1_000);
    assert.equal(timed.ok, false);
    assert.match(timed.output, /timed out/);
    // Observe automatic teardown, rather than making the test pass by stopping it.
    for (let i = 0; i < 30; i++) {
      try { await exec("docker", ["inspect", name]); }
      catch { break; }
      await delay(100);
    }
    await assert.rejects(exec("docker", ["inspect", name]));
  } finally {
    await stopSandbox(leaseId);
  }
});
