import type { LeaseRelay } from "@tendril/shared";
export interface RelayAllocation { relay: LeaseRelay; notebookBaseUrl?: string; notebookPublicUrl?: string }
export type RelayRequest = { op: "allocate"; leaseId: string; ssh: boolean; notebook: boolean; publicNotebook: boolean }
  | { op: "destroy" | "inspect"; leaseId: string };
