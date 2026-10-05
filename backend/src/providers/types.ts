import type {
  ComputeNode,
  ComputeProvider as ProviderKind,
  RunArtifact,
  SandboxAccess,
  SandboxLimits,
  SandboxSurface,
} from "@tendril/shared";

/** HTTP `surface` plus the internal one-shot path, which never opens a tunnel. */
export type Surface = SandboxSurface;

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
  notebook?: boolean;
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
  start(args: StartArgs): Promise<SandboxAccess | null>;
  exec(args: ExecArgs): Promise<ExecResult>;
  destroy(leaseId: string, nodeId: string): Promise<void>;
}
