import { destroyContainer, runJob, startContainer } from "../ws.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

/** Contributor machines: the existing socket + Docker path. SSH only. */
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
  });
}

export async function exec(args: ExecArgs): Promise<ExecResult> {
  if (args.notebook) {
    throw new Error("notebook_unsupported");
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
