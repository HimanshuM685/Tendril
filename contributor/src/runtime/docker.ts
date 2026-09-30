import { runInSandbox, startSandbox, stopSandbox } from "../docker.js";
import type { RuntimeDriver } from "./types.js";

/** Legacy isolation. OCI image is the running container. */
export function dockerDriver(): RuntimeDriver {
  return {
    kind: "docker",
    async start(lease) {
      const endpoint = await startSandbox(
        lease.leaseId,
        lease.image,
        lease.limits,
        lease.sshPassword,
        lease.sshPubKey,
      );
      return { leaseId: lease.leaseId, host: endpoint.host, port: endpoint.port };
    },
    stop(leaseId) {
      return stopSandbox(leaseId);
    },
    exec(leaseId, payload, timeoutMs) {
      return runInSandbox(leaseId, payload, timeoutMs);
    },
  };
}
