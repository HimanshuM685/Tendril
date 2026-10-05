import type { ComputeNode, ExplorerNode } from "@tendril/shared";
import { fundedSeconds } from "@tendril/shared";
import { config } from "./config.js";

/**
 * Modal Sandbox rate card (not Function rates). 1 physical core = 2 vCPU.
 * https://modal.com/pricing — Sandboxes section.
 */
export const MODAL_CPU_USD_PER_CORE_SEC = 0.00003942;
export const MODAL_MEM_USD_PER_GIB_SEC = 0.00000667;

export interface HostedSku {
  id: string;
  /** Advertised vCPU. Modal's `cpu` argument is `vCpu / 2`. */
  vCpu: number;
  physicalCores: number;
  ramMb: number;
}

export const HOSTED_SKUS: readonly HostedSku[] = [
  { id: "hosted-cpu-2", vCpu: 2, physicalCores: 1, ramMb: 4096 },
  { id: "hosted-cpu-4", vCpu: 4, physicalCores: 2, ramMb: 8192 },
  { id: "hosted-cpu-8", vCpu: 8, physicalCores: 4, ramMb: 16384 },
];

/** True when the backend can call Modal. Tokens are never sent anywhere else. */
export function modalConfigured(): boolean {
  return !!(config.modalTokenId && config.modalTokenSecret);
}

/** Keep the markup inside 25–40% even if the env value is wild. */
export function clampMarkup(raw: number): number {
  if (!Number.isFinite(raw)) return 0.3;
  return Math.min(0.4, Math.max(0.25, raw));
}

/** Modal's own USD/hour for a sandbox of this size, before Tendril's markup. */
export function modalUsdPerHour(physicalCores: number, gib: number): number {
  return (physicalCores * MODAL_CPU_USD_PER_CORE_SEC + gib * MODAL_MEM_USD_PER_GIB_SEC) * 3600;
}

/**
 * Customer USD/hour. Round up to the cent, then pull back into [1.25, 1.40] ×
 * Modal so a cent of rounding cannot leave the band.
 */
export function hostedHourlyUsd(physicalCores: number, gib: number, markup: number): number {
  const modal = modalUsdPerHour(physicalCores, gib);
  const marked = modal * (1 + clampMarkup(markup));
  let price = Math.ceil(marked * 100) / 100;
  const min = Math.ceil(modal * 1.25 * 100) / 100;
  const max = Math.floor(modal * 1.4 * 100) / 100;
  if (price < min) price = min;
  if (price > max) price = max;
  return price;
}

export function hostedCatalog(now = Date.now()): ComputeNode[] {
  const markup = clampMarkup(config.hostedMarkup);
  return HOSTED_SKUS.map((sku) => ({
    id: sku.id,
    ownerAddr: "hosted",
    payToAddr: "",
    payoutBlocked: true,
    label: `Tendril Hosted · ${sku.vCpu} vCPU`,
    cpuCores: sku.vCpu,
    ramMb: sku.ramMb,
    gpu: null,
    provider: "modal" as const,
    // Not a microVM. The default Explore filter hides these until "All".
    runtime: "docker" as const,
    kvm: false,
    capabilities: { ssh: false, python: true, notebook: true, jupyter: true },
    pricePerHourUsd: hostedHourlyUsd(sku.physicalCores, sku.ramMb / 1024, markup),
    status: "online" as const,
    lastHeartbeat: now,
    createdAt: 0,
  }));
}

export function hostedById(id: string): ComputeNode | undefined {
  return hostedCatalog().find((n) => n.id === id);
}

/** Peers win. Hosted rows are only the inventory when nobody is online. */
export function withHostedFallback<T>(peers: T[], hosted: T[]): T[] {
  return [...peers, ...hosted];
}

export function toExplorer(node: ComputeNode): ExplorerNode {
  const {
    id,
    ownerAddr,
    payToAddr,
    payoutBlocked,
    label,
    cpuCores,
    ramMb,
    gpu,
    provider,
    runtime,
    kvm,
    capabilities,
    pricePerHourUsd,
    status,
  } = node;
  return {
    id,
    ownerAddr,
    payToAddr,
    payoutBlocked,
    label,
    cpuCores,
    ramMb,
    gpu,
    provider,
    runtime,
    kvm,
    capabilities,
    pricePerHourUsd,
    status,
  };
}

/**
 * Modal sandbox lifetime. At least `floorMs` so image build is not the timeout,
 * and never past a day. `fundedSeconds === null` (free rate) caps at 24h.
 */
export function sandboxLifetimeMs(
  fundingAtomic: number,
  rateAtomicPerHour: number,
  graceAtomic: number,
  floorMs: number,
): number {
  const funded = fundedSeconds(fundingAtomic, rateAtomicPerHour);
  const grace = fundedSeconds(graceAtomic, rateAtomicPerHour) ?? 0;
  const seconds = (funded ?? 24 * 3600) + grace;
  const capped = Math.min(seconds * 1000, 24 * 3600 * 1000);
  return Math.max(floorMs, capped);
}
