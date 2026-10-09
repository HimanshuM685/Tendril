import type { ComputeNode, ComputeProvider, ExplorerNode } from "@tendril/shared";
import { fundedSeconds } from "@tendril/shared";
import { config } from "./config.js";

/**
 * Modal sandbox rate card. 1 physical core = 2 vCPU. Minimum 0.125 core.
 * Priority notebooks run 1 core + 4 GiB and no GPU, so only those two lines bill.
 */
export const MODAL_CPU_USD_PER_CORE_HOUR = 0.0473;
export const MODAL_MEM_USD_PER_GIB_HOUR = 0.008;
export const MODAL_GPU_USD_PER_HOUR: Readonly<Record<string, number>> = {
  B300: 7.1,
  B200: 6.25,
  "H200 SXM": 4.54,
  "H100 SXM5": 3.95,
  "RTX PRO 6000": 3.03,
  "A100 80GB": 2.5,
  "A100 40GB": 2.1,
  L40S: 1.95,
  A10: 1.1,
  L4: 0.8,
  T4: 0.59,
};

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

/** True when the backend can call E2B. The key is never sent anywhere else. */
export function e2bConfigured(): boolean {
  return !!config.e2bApiKey;
}

/** Hosted = a sandbox Tendril runs for you (Modal, E2B), as opposed to a contributor's machine. */
export function isHosted(provider: ComputeProvider): boolean {
  return provider !== "contributor";
}

/** E2B bills per second of uptime: $0.000014 per vCPU and $0.0000045 per GiB of RAM (storage is free). */
export const E2B_USD_PER_VCPU_SECOND = 0.000014;
export const E2B_USD_PER_GIB_SECOND = 0.0000045;
/** E2B's default sandbox: 2 vCPU + 4 GiB = $0.000046/s = $0.1656/h before markup. */
export const E2B_NOTEBOOK_VCPU = 2;
export const E2B_NOTEBOOK_GIB = 4;

/** Sizes on E2B's chart. CPU/RAM are fixed per template, so each pair is its own prebuilt template. */
export const E2B_VCPU_OPTIONS = [1, 2, 4, 6, 8] as const;
export const E2B_GIB_OPTIONS = [1, 2, 4, 8] as const;
export interface E2bSize {
  vCpu: number;
  memGiB: number;
}
export const E2B_DEFAULT_SIZE: E2bSize = { vCpu: E2B_NOTEBOOK_VCPU, memGiB: E2B_NOTEBOOK_GIB };
export const E2B_PRESETS: readonly E2bSize[] = [
  { vCpu: 1, memGiB: 2 },
  E2B_DEFAULT_SIZE,
  { vCpu: 4, memGiB: 8 },
  { vCpu: 8, memGiB: 8 },
];

export function isE2bSize(vCpu: unknown, memGiB: unknown): boolean {
  return (
    (E2B_VCPU_OPTIONS as readonly unknown[]).includes(vCpu) &&
    (E2B_GIB_OPTIONS as readonly unknown[]).includes(memGiB)
  );
}

/** `c2-m4` — the key shared by the price table, node id and template name. */
export function e2bSizeId({ vCpu, memGiB }: E2bSize): string {
  return `c${vCpu}-m${memGiB}`;
}

/** Keep the markup inside 25–40% even if the env value is wild. */
export function clampMarkup(raw: number): number {
  if (!Number.isFinite(raw)) return 0.3;
  return Math.min(0.4, Math.max(0.25, raw));
}

/** Modal's own USD/hour for a sandbox of this size, before Tendril's markup. */
export function modalUsdPerHour(physicalCores: number, gib: number, gpuUsdPerHour = 0): number {
  const cores = Math.max(0.125, physicalCores);
  return cores * MODAL_CPU_USD_PER_CORE_HOUR + gib * MODAL_MEM_USD_PER_GIB_HOUR + gpuUsdPerHour;
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

/** E2B's own USD/hour for a sandbox of this size, before Tendril's markup. */
export function e2bCostPerHour(vCpu: number, gib: number): number {
  return (vCpu * E2B_USD_PER_VCPU_SECOND + gib * E2B_USD_PER_GIB_SECOND) * 3600;
}

/** E2B margin target: 20–30% over cost, whatever the env value says. */
export function clampE2bMarkup(raw: number): number {
  if (!Number.isFinite(raw)) return 0.25;
  return Math.min(0.3, Math.max(0.2, raw));
}

/**
 * Customer USD/hour for an E2B sandbox. Round up to the cent, then pull back
 * into [1.20, 1.30] × E2B's cost so a cent of rounding cannot leave the band.
 */
export function e2bHourlyUsd(vCpu: number, gib: number, markup: number): number {
  const cost = e2bCostPerHour(vCpu, gib);
  let price = Math.ceil(cost * (1 + clampE2bMarkup(markup)) * 100) / 100;
  const min = Math.ceil(cost * 1.2 * 100) / 100;
  const max = Math.floor(cost * 1.3 * 100) / 100;
  if (price < min) price = min;
  if (price > max) price = max;
  return price;
}

/** What an E2B notebook of this size is billed at (default size when omitted). */
export function e2bUsdPerHour(size: E2bSize = E2B_DEFAULT_SIZE): number {
  return e2bHourlyUsd(size.vCpu, size.memGiB, config.e2bMarkup);
}

/** USD/hour for every size on the chart, keyed by `e2bSizeId`. */
export function e2bPriceTable(): Record<string, number> {
  const table: Record<string, number> = {};
  for (const vCpu of E2B_VCPU_OPTIONS) {
    for (const memGiB of E2B_GIB_OPTIONS) table[e2bSizeId({ vCpu, memGiB })] = e2bUsdPerHour({ vCpu, memGiB });
  }
  return table;
}

/** The hosted node an E2B notebook of this size runs on. Its price is the lease rate. */
export function e2bNode(size: E2bSize = E2B_DEFAULT_SIZE, now = Date.now()): ComputeNode {
  return {
    id: `hosted-e2b-${e2bSizeId(size)}`,
    ownerAddr: "hosted",
    payToAddr: "",
    payoutBlocked: true,
    label: `Tendril E2B · ${size.vCpu} vCPU · ${size.memGiB} GiB`,
    cpuCores: size.vCpu,
    ramMb: size.memGiB * 1024,
    gpu: null,
    provider: "e2b",
    runtime: "docker",
    kvm: false,
    capabilities: { ssh: false, python: true, notebook: true, jupyter: false },
    pricePerHourUsd: e2bUsdPerHour(size),
    status: "online",
    lastHeartbeat: now,
    createdAt: 0,
  };
}

/** What a priority notebook is billed at: 2 vCPU (1 core) + 4 GiB, no GPU. */
export function priorityHourlyUsd(): number {
  return hostedHourlyUsd(1, 4, config.hostedMarkup);
}

export function hostedCatalog(now = Date.now()): ComputeNode[] {
  const markup = clampMarkup(config.hostedMarkup);
  const e2b = e2bNode(E2B_DEFAULT_SIZE, now);
  return [...HOSTED_SKUS.map((sku) => ({
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
  })), e2b];
}

export function hostedById(id: string): ComputeNode | undefined {
  return hostedCatalog().find((n) => n.id === id);
}

/** Peers first. Hosted rows stay listed whenever the caller passes them. */
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
