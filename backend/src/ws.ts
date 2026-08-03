import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import {
  WS,
  type AgentHelloMsg,
  type ContainerFailedMsg,
  type ContainerReadyMsg,
  type HeartbeatMsg,
  type HelloAckMsg,
  type JobResultMsg,
  type SandboxAccess,
  type SandboxLimits,
  type StartContainerMsg,
} from "@tendril/shared";
import { ownerOfApiKey } from "./db.js";
import { config } from "./config.js";
import { markOffline, touchHeartbeat, upsertNode } from "./registry.js";
import { activateLease, closeLease, getLease, leasesForNode, setLeaseStatus } from "./leases.js";

/** nodeId -> the socket of the agent currently hosting that node. */
const agentSockets = new Map<string, Socket>();

/** Pending promises awaiting a container to come up, keyed by leaseId. */
const pendingContainers = new Map<
  string,
  {
    resolve: (access: SandboxAccess) => void;
    reject: (err: Error) => void;
    /** Set when the renter supplied a key, which decides `access.authMethod`. */
    sshPubKey: string | null;
  }
>();

/** Pending promises awaiting job results, keyed by jobId. */
const pendingJobs = new Map<
  string,
  { resolve: (r: JobResultMsg) => void; reject: (err: Error) => void }
>();

export function initWs(httpServer: HttpServer, corsOrigin: string | string[] = "*"): Server {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.on("connection", (socket) => {
    let boundNodeId: string | null = null;

    socket.on(WS.hello, async (msg: AgentHelloMsg) => {
      // The API key is the whole of the agent's identity: the wallet that minted
      // it owns the node and earns for it. A contributor cannot claim someone
      // else's address by editing their .env, because they never name one.
      const ownerAddr = await ownerOfApiKey(msg.apiKey);
      if (!ownerAddr) {
        socket.emit("error-message", "hello rejected: unknown or revoked API key");
        socket.disconnect(true);
        return;
      }
      const node = await upsertNode({ id: msg.nodeId, ownerAddr, payToAddr: ownerAddr, ...msg.spec });
      boundNodeId = node.id;
      agentSockets.set(node.id, socket);
      const ack: HelloAckMsg = {
        nodeId: node.id,
        ownerAddr,
        bore: { server: config.boreServer, secret: config.boreSecret },
      };
      socket.emit(WS.helloAck, ack);
      console.log(`[ws] node online: ${node.id} (${node.label}) owner=${node.ownerAddr}`);
    });

    socket.on(WS.heartbeat, (_msg: HeartbeatMsg) => {
      if (boundNodeId) touchHeartbeat(boundNodeId);
    });

    socket.on(WS.containerReady, (msg: ContainerReadyMsg) => {
      const lease = getLease(msg.leaseId);
      if (!lease) return;
      // A renter who supplied a public key authenticates with it; otherwise the
      // password is their own address (only possible when they are signed in).
      const usePubKey = pendingContainers.get(msg.leaseId)?.sshPubKey != null;
      const access: SandboxAccess = {
        kind: "ssh",
        host: msg.host,
        port: msg.port,
        username: "root",
        authMethod: usePubKey ? "publickey" : "password",
        password: usePubKey ? null : lease.renterAddr,
        command: `ssh root@${msg.host} -p ${msg.port}`,
      };
      // Marks the lease active and starts the billable window.
      activateLease(msg.leaseId, access);
      pendingContainers.get(msg.leaseId)?.resolve(access);
      pendingContainers.delete(msg.leaseId);
    });

    socket.on(WS.containerFailed, (msg: ContainerFailedMsg) => {
      setLeaseStatus(msg.leaseId, "failed");
      pendingContainers.get(msg.leaseId)?.reject(new Error(msg.error));
      pendingContainers.delete(msg.leaseId);
    });

    socket.on(WS.jobResult, (msg: JobResultMsg) => {
      pendingJobs.get(msg.jobId)?.resolve(msg);
      pendingJobs.delete(msg.jobId);
    });

    socket.on("disconnect", () => {
      if (boundNodeId) {
        // The node's gone — bill + end any leases it was hosting, then mark it offline.
        for (const lease of leasesForNode(boundNodeId)) {
          void closeLease(lease.id, "node-disconnected");
        }
        markOffline(boundNodeId);
        if (agentSockets.get(boundNodeId) === socket) agentSockets.delete(boundNodeId);
        console.log(`[ws] node offline: ${boundNodeId}`);
      }
    });
  });

  return io;
}

export function isNodeConnected(nodeId: string): boolean {
  return agentSockets.has(nodeId);
}

/**
 * Ask the agent to start a sandbox; resolves with the SSH access details when
 * the container is up and the bore endpoint is known.
 */
export function startContainer(args: {
  nodeId: string;
  leaseId: string;
  image: string;
  limits: SandboxLimits;
  /** SSH password (the renter's address), or null under key auth. */
  sshPassword: string | null;
  /** OpenSSH public key to install in the sandbox, or null. */
  sshPubKey: string | null;
  timeoutMs?: number;
}): Promise<SandboxAccess> {
  const { nodeId, leaseId, image, limits, sshPassword, sshPubKey } = args;
  const timeoutMs = args.timeoutMs ?? config.sandboxReadyTimeoutMs;
  const socket = agentSockets.get(nodeId);
  if (!socket) return Promise.reject(new Error("node not connected"));

  return new Promise<SandboxAccess>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingContainers.delete(leaseId);
      reject(new Error("container start timed out"));
    }, timeoutMs);

    pendingContainers.set(leaseId, {
      sshPubKey,
      resolve: (access) => {
        clearTimeout(timer);
        resolve(access);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });

    const msg: StartContainerMsg = { leaseId, image, limits, sshPassword, sshPubKey };
    socket.emit(WS.startContainer, msg);
  });
}

/** Tell the agent to destroy a lease's sandbox (best-effort). */
export function destroyContainer(nodeId: string, leaseId: string): void {
  agentSockets.get(nodeId)?.emit(WS.destroyContainer, { leaseId });
}

/** Run a job inside an existing lease's sandbox; resolves with the result. */
export function runJob(
  nodeId: string,
  leaseId: string,
  jobId: string,
  payload: string,
  timeoutMs = 120_000,
): Promise<JobResultMsg> {
  const socket = agentSockets.get(nodeId);
  if (!socket) return Promise.reject(new Error("node not connected"));

  return new Promise<JobResultMsg>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingJobs.delete(jobId);
      reject(new Error("job timed out"));
    }, timeoutMs);

    pendingJobs.set(jobId, {
      resolve: (r) => {
        clearTimeout(timer);
        resolve(r);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });

    socket.emit(WS.runJob, { leaseId, jobId, payload });
  });
}
