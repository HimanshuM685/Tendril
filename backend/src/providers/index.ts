import type { ComputeProvider } from "@tendril/shared";
import { contributorProvider } from "./contributor.js";
import { modalProvider } from "./modal.js";
import type { ComputeProvider as Provider } from "./types.js";

export type { ExecArgs, ExecResult, StartArgs, Surface } from "./types.js";

const providers: Record<ComputeProvider, Provider> = {
  contributor: contributorProvider,
  modal: modalProvider,
};

export function providerFor(id: ComputeProvider): Provider {
  return providers[id];
}

export async function destroyForLease(lease: {
  id: string;
  nodeId: string;
  provider: ComputeProvider;
}): Promise<void> {
  await providerFor(lease.provider).destroy(lease.id, lease.nodeId);
}
