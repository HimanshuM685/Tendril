import type { SandboxLimits, SandboxRuntime } from "@tendril/shared";

/** What the registry asks the agent to start. Same fields as today. */
export interface LeaseRequest {
  leaseId: string;
  image: string;
  limits: SandboxLimits;
  sshPassword: string | null;
  sshPubKey: string | null;
}

/** Where the renter connects. `guestIp` is the tap address, for exec only. */
export interface RunningLease {
  leaseId: string;
  host: string;
  port: number;
  guestIp?: string;
}

export interface RuntimeDriver {
  kind: SandboxRuntime;
  start(lease: LeaseRequest): Promise<RunningLease>;
  stop(leaseId: string): Promise<void>;
  exec(leaseId: string, payload: string, timeoutMs?: number): Promise<{ ok: boolean; output: string }>;
}
