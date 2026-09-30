import type {
  ComputeNode,
  ComputeProvider as ProviderKind,
  RunArtifact,
  SandboxAccess,
  SandboxLimits,
} from "@tendril/shared";

/** HTTP `surface` plus the internal one-shot path, which never opens a tunnel. */
export type Surface = "ssh" | "jupyter" | "exec";

export interface StartArgs {
  leaseId: string;
  node: ComputeNode;
  surface: Surface;
  sshPassword: string | null;
  sshPubKey: string | null;
  /** Sandbox lifetime for Modal. Contributor ignores it. */
  timeoutMs: number;
  limits: SandboxLimits;
  image: string;
}

export interface ExecArgs {
  leaseId: string;
  nodeId: string;
  jobId: string;
  timeoutMs: number;
  payload?: string;
  notebook?: Record<string, unknown>;
}

export interface ExecResult {
  ok: boolean;
  result: string;
  notebook?: Record<string, unknown>;
  artifacts?: RunArtifact[];
}

export interface ComputeProvider {
  id: ProviderKind;
  start(args: StartArgs): Promise<SandboxAccess>;
  exec(args: ExecArgs): Promise<ExecResult>;
  destroy(leaseId: string, nodeId: string): Promise<void>;
}
