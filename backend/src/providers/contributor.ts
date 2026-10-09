import { destroyContainer, runJob, startContainer } from "../ws.js";
import { notebookToPayload, parseNotebookRun } from "./notebookRunner.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

/** Contributor machines: socket + Docker, with SSH or private one-shot execution. */
export const id = "contributor" as const;

export async function start(args: StartArgs) {
  if (args.surface === "jupyter") {
    throw new Error("jupyter surface requires a hosted node");
  }
  return startContainer({
    nodeId: args.node.id,
    leaseId: args.leaseId,
    image: args.image,
    limits: args.limits,
    sshPassword: args.sshPassword,
    sshPubKey: args.sshPubKey,
    surface: args.surface === "exec" ? "exec" : "ssh",
    lifetimeMs: args.timeoutMs,
    timeoutMs: args.surface === "exec" ? args.timeoutMs : undefined,
  });
}

export async function exec(args: ExecArgs): Promise<ExecResult> {
  if (args.notebook) {
    const msg = await runJob(
      args.nodeId,
      args.leaseId,
      args.jobId,
      notebookToPayload(args.notebook, args.timeoutMs),
      args.timeoutMs,
    );
    const parsed = parseNotebookRun(msg.result);
    return { ok: parsed.ok && msg.ok, result: parsed.log, notebook: parsed.notebook, artifacts: parsed.artifacts };
  }
  if (typeof args.payload !== "string") {
    throw new Error("payload (string) required");
  }
  const msg = await runJob(args.nodeId, args.leaseId, args.jobId, args.payload, args.timeoutMs);
  return { ok: msg.ok, result: msg.result };
}

export async function destroy(leaseId: string, nodeId: string): Promise<void> {
  destroyContainer(nodeId, leaseId);
}

export const contributorProvider: ComputeProvider = { id, start, exec, destroy };
