import { nanoid } from "nanoid";
import type { ComputeNode, ExplorerNode } from "@tendril/shared";
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

export function touchHeartbeat(id: string): void {
  const node = nodes.get(id);
  if (node) node.lastHeartbeat = Date.now();
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
export function pickBestValueNode(isFree: (nodeId: string) => boolean): ComputeNode | null {
  const peers = onlinePeers().filter((n) => isFree(n.id));
  // A busy peer still counts as inventory: do not fall through to Modal.
  const candidates =
    peers.length > 0
      ? peers
      : onlinePeers().length === 0 && modalConfigured()
        ? hostedCatalog().filter((n) => isFree(n.id))
        : [];
  if (candidates.length === 0) return null;
  const score = (n: ComputeNode) =>
    n.pricePerHourUsd <= 0
      ? Number.POSITIVE_INFINITY
      : (n.cpuCores + n.ramMb / 1024 / 4) / n.pricePerHourUsd;
  // Ties break on the lower absolute price, so an equal-value cheaper machine
  // wins and a caller with little credit is not sent to an expensive one.
  return candidates.sort((a, b) => score(b) - score(a) || a.pricePerHourUsd - b.pricePerHourUsd)[0];
}

export function listOnlineNodes(): ExplorerNode[] {
  const peers = onlinePeers()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toExplorer);
  const hosted = modalConfigured() ? hostedCatalog().map(toExplorer) : [];
  return withHostedFallback(peers, hosted);
}
