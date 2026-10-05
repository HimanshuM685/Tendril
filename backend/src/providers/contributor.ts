import { randomBytes } from "node:crypto";
import { capabilities, type SandboxAccess } from "@tendril/shared";
import { destroyContainer, runJob, startContainer } from "../ws.js";
import { config } from "../config.js";
import { getLease } from "../leases.js";
import { relayClient } from "../relay/client.js";
import type { RelayAllocation } from "../relay/types.js";
import { notebookOutput, stageNotebook, waitForJupyter } from "./jupyter.js";
import type { ComputeProvider, ExecArgs, ExecResult, StartArgs } from "./types.js";

export const id = "contributor" as const;
interface Context { nodeId: string; started: boolean; relayRequested: boolean; relay?: RelayAllocation; token: string }
const contexts = new Map<string, Context>();
export async function start(args: StartArgs): Promise<SandboxAccess | null> {
  const caps = capabilities(args.node.capabilities);
  if ((args.surface === "jupyter" && !caps.jupyter) || (args.notebook && !caps.notebook)) throw new Error("surface capability unavailable");
  const deadline = Date.now() + config.sandboxReadyTimeoutMs;
  const ctx: Context = { nodeId: args.node.id, started: false, relayRequested: false, token: randomBytes(32).toString("base64url") };
  contexts.set(args.leaseId, ctx);
  const notebook = caps.notebook && (args.surface !== "exec" || args.notebook === true);
  if (args.surface === "ssh" || notebook) {
    ctx.relayRequested = true;
    ctx.relay = await relayClient.allocate(args.leaseId, args.surface === "ssh", notebook, args.surface === "jupyter");
  }
  if (getLease(args.leaseId)?.status !== "starting") throw new Error("lease cancelled before boot");
  ctx.started = true;
  const access = await startContainer({ nodeId: args.node.id, leaseId: args.leaseId, image: args.image, limits: args.limits,
    sshPassword: args.sshPassword, sshPubKey: args.sshPubKey, surface: args.surface, notebook: args.notebook,
    relay: ctx.relay?.relay, jupyterToken: notebook ? ctx.token : undefined, timeoutMs: Math.max(1, deadline - Date.now()) });
  if (notebook) {
    if (!ctx.relay?.notebookBaseUrl) throw new Error("private notebook transport unavailable");
    await waitForJupyter(args.surface === "jupyter" ? ctx.relay.notebookPublicUrl! : ctx.relay.notebookBaseUrl, ctx.token, deadline);
  }
  if (getLease(args.leaseId)?.status !== "starting") throw new Error("lease cancelled after readiness");
  if (args.surface !== "jupyter") return access;
  const url = new URL(ctx.relay!.notebookPublicUrl!); url.searchParams.set("token", ctx.token);
  return { kind: "jupyter", url: url.toString(), token: ctx.token };
}
export async function exec(args: ExecArgs): Promise<ExecResult> {
  const ctx = contexts.get(args.leaseId);
  if (args.notebook) {
    if (!ctx?.relay?.notebookBaseUrl) throw new Error("notebook capability unavailable");
    await stageNotebook(ctx.relay.notebookBaseUrl, ctx.token, args.jobId, args.notebook);
    const msg = await runJob(args.nodeId, args.leaseId, args.jobId, "", args.timeoutMs, true);
    const output = await notebookOutput(ctx.relay.notebookBaseUrl, ctx.token, args.jobId).catch((err) => {
      if (msg.ok) throw err;
      return {};
    });
    return { ok: msg.ok, result: msg.result, ...output };
  }
  if (typeof args.payload !== "string") throw new Error("payload (string) required");
  const msg = await runJob(args.nodeId, args.leaseId, args.jobId, args.payload, args.timeoutMs);
  return { ok: msg.ok, result: msg.result };
}
export async function destroy(leaseId: string, nodeId: string): Promise<void> {
  const ctx = contexts.get(leaseId);
  const results = await Promise.allSettled([
    !ctx || ctx.started ? destroyContainer(nodeId, leaseId) : Promise.resolve(),
    ctx?.relayRequested ? relayClient.destroy(leaseId) : Promise.resolve(),
  ]);
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failures.length) throw new AggregateError(failures.map((f) => f.reason), "guest/relay cleanup pending");
  contexts.delete(leaseId);
}
export const contributorProvider: ComputeProvider = { id, start, exec, destroy };
