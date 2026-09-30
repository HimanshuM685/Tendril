import { nanoid } from "nanoid";
import type { ComputeNode, ExplorerNode, SandboxRuntime } from "@tendril/shared";
import { isOnline } from "@tendril/shared";
import { config } from "./config.js";
import { hostedById, hostedCatalog, modalConfigured, toExplorer, withHostedFallback } from "./hosted.js";
import { hasOptedIn } from "./payout.js";

/**
 * In-memory node registry. Nodes are ephemeral — a contributor comes online,
 * heartbeats, and goes away — so they don't belong in the database (storing them
 * meant a DB write on every heartbeat). The live set lives here instead; only
 * wallet money state is persisted (see db.ts).
 */
const nodes = new Map<string, ComputeNode>();

export interface UpsertNodeInput {
  id?: string;
  ownerAddr: string;
  payToAddr: string;
  label: string;
  cpuCores: number;
  ramMb: number;
  gpu: string | null;
  pricePerHourUsd: number;
  runtime?: SandboxRuntime;
  kvm?: boolean;
}

function withStatus(node: ComputeNode): ComputeNode {
  return {
    ...node,
    status: isOnline(node.lastHeartbeat, config.heartbeatTimeoutMs) ? "online" : "offline",
  };
}

/**
 * Register a new node or re-attach to an existing one, refreshing its heartbeat.
 *
 * A payout address that hasn't opted into the payment asset can't receive an
 * ASA transfer, so we check once at registration and flag the node rather than
 * turn it away — it still serves compute and still earns; the payouts are just
 * recorded unpaid until the contributor opts in.
 */
export async function upsertNode(input: UpsertNodeInput): Promise<ComputeNode> {
  const now = Date.now();
  const id = input.id || nanoid(10);
  const existing = nodes.get(id);
  const node: ComputeNode = {
    id,
    ownerAddr: input.ownerAddr,
    payToAddr: input.payToAddr,
    payoutBlocked: !(await hasOptedIn(input.payToAddr)),
    label: input.label,
    cpuCores: input.cpuCores,
    ramMb: input.ramMb,
    gpu: input.gpu,
    provider: "contributor",
    runtime: input.runtime ?? existing?.runtime ?? "docker",
    kvm: input.kvm ?? existing?.kvm ?? false,
    pricePerHourUsd: input.pricePerHourUsd,
    lastHeartbeat: now,
    createdAt: existing?.createdAt ?? now,
    status: "online",
  };
  nodes.set(id, node);
  if (node.payoutBlocked) {
    console.warn(
      `[registry] node ${id}: ${node.payToAddr} has not opted into asset ${config.assetId} — payouts will be recorded unpaid`,
    );
  }
  return node;
}

function onlinePeers(): ComputeNode[] {
  return [...nodes.values()].map(withStatus).filter((n) => n.status === "online");
}

export function getNode(id: string): ComputeNode | undefined {
  const node = nodes.get(id);
  if (node) return withStatus(node);
  // Hosted rows exist only while no contributor is online.
  if (onlinePeers().length > 0 || !modalConfigured()) return undefined;
  return hostedById(id);
}

export function touchHeartbeat(
  id: string,
  patch?: { runtime?: SandboxRuntime; kvm?: boolean },
): void {
  const node = nodes.get(id);
  if (!node) return;
  node.lastHeartbeat = Date.now();
  if (patch?.runtime) node.runtime = patch.runtime;
  if (patch?.kvm !== undefined) node.kvm = patch.kvm;
}

/** Mark a node offline immediately (e.g. on socket disconnect). */
export function markOffline(id: string): void {
  const node = nodes.get(id);
  if (node) node.lastHeartbeat = 0;
}

export function listNodesByOwner(ownerAddr: string): ComputeNode[] {
  return [...nodes.values()]
    .filter((n) => n.ownerAddr === ownerAddr)
    .map(withStatus)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Best value-for-money node that is free right now, or null if none is.
 *
 * "Cheapest" on its own picks a slow machine that then takes longer to run the
 * job and costs more than a faster one would have — the rate is per hour, so
 * what actually matters is capability *per* unit of rate. The score is
 * `(cores + RAM_GB / 4) / price`: RAM is worth something but a core is worth
 * more, and a free node (`price <= 0`) beats everything, which is correct — it
 * costs the caller nothing however long it takes.
 *
 * `isFree` is passed in rather than imported to keep this module free of the
 * lease/ws cycle it would otherwise create.
 */
function score(n: ComputeNode): number {
  return n.pricePerHourUsd <= 0
    ? Number.POSITIVE_INFINITY
    : (n.cpuCores + n.ramMb / 1024 / 4) / n.pricePerHourUsd;
}

function best(list: ComputeNode[]): ComputeNode {
  // Ties break on the lower absolute price, so an equal-value cheaper machine
  // wins and a caller with little credit is not sent to an expensive one.
  return [...list].sort((a, b) => score(b) - score(a) || a.pricePerHourUsd - b.pricePerHourUsd)[0];
}

/**
 * Automatic placement. An idle microVM peer wins over Modal. With none idle,
 * hosted CPU is allowed even if a Docker peer is online. Otherwise any idle peer.
 */
export function chooseNode(
  peers: ComputeNode[],
  hosted: ComputeNode[],
  isFree: (nodeId: string) => boolean,
): ComputeNode | null {
  const idle = (list: ComputeNode[]) => list.filter((n) => isFree(n.id));
  const micro = idle(peers.filter((n) => n.runtime === "microvm" && n.kvm));
  if (micro.length > 0) return best(micro);
  const modal = idle(hosted);
  if (modal.length > 0) return best(modal);
  const rest = idle(peers);
  if (rest.length > 0) return best(rest);
  return null;
}

export function pickBestValueNode(isFree: (nodeId: string) => boolean): ComputeNode | null {
  const hosted = modalConfigured() ? hostedCatalog() : [];
  return chooseNode(onlinePeers(), hosted, isFree);
}

export function listOnlineNodes(): ExplorerNode[] {
  const peers = onlinePeers()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toExplorer);
  const hosted = modalConfigured() ? hostedCatalog().map(toExplorer) : [];
  return withHostedFallback(peers, hosted);
}
