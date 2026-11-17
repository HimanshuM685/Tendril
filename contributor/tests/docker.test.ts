import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { notebookToPayload, parseNotebookRun } from "../../backend/src/providers/notebookRunner.js";
import { config } from "../src/config.js";
import { ensureSandboxNetwork, runInSandbox, startSandbox, stopSandbox } from "../src/docker.js";

const exec = promisify(execFile);
const image = process.env.TENDRIL_NOTEBOOK_TEST_IMAGE;

// The test image stands in for the operator-configured one, so the policy
// accepts it and the guard is built from it.
if (image) config.sandbox.image = image;

async function inspect(name: string) {
  const { stdout } = await exec("docker", ["inspect", name]);
  return JSON.parse(stdout)[0];
}

/** What the hardening looks like from `docker inspect`, SSH and exec alike. */
function assertHardened(container: any) {
  assert.equal(container.Config.User, "1000:1000");
  assert.equal(container.HostConfig.ReadonlyRootfs, true);
  assert.deepEqual(container.HostConfig.CapDrop, ["ALL"]);
  assert.ok(!container.HostConfig.CapAdd?.length);
  assert.ok(container.HostConfig.SecurityOpt?.includes("no-new-privileges"));
  assert.ok(!container.HostConfig.Binds?.length);
  assert.equal(container.HostConfig.NetworkMode, "tendril-sandbox");
  assert.equal(container.HostConfig.LogConfig.Type, "local");
  assert.ok(container.HostConfig.Tmpfs["/work"].includes("uid=1000"));
  assert.ok(!container.Config.Env.some((e: string) => /^(TENDRIL_API_KEY|BORE_SECRET|BORE_SERVER|SSH_PASSWORD|MODAL_TOKEN)=/.test(e)));
}

/** The guard's rules, observed from inside the sandbox as the renter. */
const NET_PROBE = `
import socket, json, subprocess
def reach(host, port):
    try:
        socket.create_connection((host, port), timeout=3).close(); return True
    except OSError as e:
        return False
gw = subprocess.run(["sh","-c","ip route 2>/dev/null | awk '/default/ {print $3}' || true"], capture_output=True, text=True).stdout.strip()
if not gw:
    gw = open("/proc/net/route").read().split("\\n")[1].split()[2]
    gw = ".".join(str(int(gw[i:i+2],16)) for i in (6,4,2,0))
print(json.dumps({
    "gateway": reach(gw, 2375) or reach(gw, 22) or reach(gw, 80),
    "metadata": reach("169.254.169.254", 80),
    "lan": reach("192.168.1.1", 80),
    "internet": reach("1.1.1.1", 443),
    "uid": __import__("os").getuid(),
}))
`;

test("contributor exec sandbox is unprivileged, fenced, supports writable pip, and stops timed-out descendants", { skip: !image }, async () => {
  const leaseId = `test-${randomUUID()}`;
  const name = `tendril-${leaseId}`;
  await ensureSandboxNetwork();
  try {
    const endpoint = await startSandbox(leaseId, image!, { cpus: 2, memory: "1g", gpus: "" }, null, null, "exec", 60_000);
    assert.equal(endpoint.port, 0);
    assertHardened(await inspect(name));
    // The one-shot guard has done its job and is gone.
    await assert.rejects(exec("docker", ["inspect", `${name}-guard`]));

    const probe = await runInSandbox(leaseId, NET_PROBE, 30_000);
    assert.equal(probe.ok, true, probe.output);
    const net = JSON.parse(probe.output.trim().split("\n").at(-1)!);
    assert.equal(net.uid, 1000);
    assert.equal(net.gateway, false, "host reachable through the bridge gateway");
    assert.equal(net.metadata, false, "cloud metadata reachable");
    assert.equal(net.lan, false, "LAN reachable");
    assert.equal(net.internet, true, "public internet blocked");

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

test("contributor SSH sandbox logs in as tendril with a key only, and refuses root", { skip: !image }, async () => {
  const leaseId = `test-${randomUUID()}`;
  const name = `tendril-${leaseId}`;
  const dir = mkdtempSync(join(tmpdir(), "tendril-ssh-"));
  const key = join(dir, "id_ed25519");
  await exec("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-f", key]);
  const pub = readFileSync(`${key}.pub`, "utf8").trim();
  const sshOpts = ["-i", key, "-o", "StrictHostKeyChecking=no", "-o", `UserKnownHostsFile=${join(dir, "known_hosts")}`, "-o", "BatchMode=yes", "-o", "ConnectTimeout=10"];
  config.tunnelMode = "local";
  await ensureSandboxNetwork();
  try {
    const endpoint = await startSandbox(leaseId, image!, { cpus: 1, memory: "512m", gpus: "" }, null, pub, "ssh");
    assert.equal(endpoint.host, "127.0.0.1");
    assertHardened(await inspect(name));

    const whoami = await exec("ssh", [...sshOpts, "-p", String(endpoint.port), `tendril@${endpoint.host}`, "id -u; cat /proc/1/environ | tr '\\0' '\\n' | grep -c BORE || true; touch /etc/x 2>&1 || echo readonly"]);
    const [uid, boreVars, rootfs] = whoami.stdout.trim().split("\n");
    assert.equal(uid, "1000");
    assert.equal(boreVars, "0", "BORE_* visible inside the sandbox");
    assert.match(rootfs, /readonly|Read-only/);

    await assert.rejects(exec("ssh", [...sshOpts, "-p", String(endpoint.port), `root@${endpoint.host}`, "id"]));

    // A sandbox cannot touch the rules the guard installed.
    const ipt = await exec("ssh", [...sshOpts, "-p", String(endpoint.port), `tendril@${endpoint.host}`, "iptables -F 2>&1 || echo denied"]);
    assert.match(ipt.stdout, /denied|Permission denied|not permitted/);
  } finally {
    await stopSandbox(leaseId);
    rmSync(dir, { recursive: true, force: true });
  }
});
