import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { WS, JOB_RESULT_MAX_BYTES, type AgentHelloMsg, type ContainerFailedMsg, type ContainerReadyMsg,
  type ContainerDestroyedMsg, type HeartbeatMsg, type HelloAckMsg, type JobResultMsg,
  type SandboxAccess, type StartContainerMsg } from "@tendril/shared";
import { ownerOfApiKey } from "./db.js";
import { config } from "./config.js";
import { getNode, markOffline, touchHeartbeat, upsertNode } from "./registry.js";
import { closeLease, getLease, leasesForNode } from "./leases.js";

const agentSockets = new Map<string, Socket>();
interface Pending<T> { nodeId: string; leaseId: string; resolve(value: T): void; reject(err: Error): void }
const starts = new Map<string, Pending<SandboxAccess | null>>();
const jobs = new Map<string, Pending<JobResultMsg>>();
const stops = new Map<string, Pending<void>>();
const destroyed = new Set<string>();
export const wsEffects = { ownerOfApiKey };
const receiptKey = (nodeId: string, leaseId: string) => `${nodeId}:${leaseId}`;

export function initWs(httpServer: HttpServer, corsOrigin: string | string[] = "*"): Server {
  // Default Socket.IO's 1 MB would disconnect a healthy agent returning an
  // allowed notebook result (output + artifacts).
  const io = new Server(httpServer, { cors: { origin: corsOrigin }, maxHttpBufferSize: JOB_RESULT_MAX_BYTES + 100_000 });
  io.on("connection", (socket) => {
    let bound: string | null = null;
    const owns = (leaseId: string) => !!bound && getLease(leaseId)?.nodeId === bound && agentSockets.get(bound) === socket;
    const onDestroyed = (msg: ContainerDestroyedMsg) => {
      if (!owns(msg.leaseId)) return;
      const key = receiptKey(bound!, msg.leaseId);
      if (msg.ok) { destroyed.add(key); stops.get(key)?.resolve(); }
      else stops.get(key)?.reject(new Error(msg.error || "agent cleanup failed"));
      stops.delete(key);
      const lease = getLease(msg.leaseId);
      if (msg.ok && lease && (lease.status === "active" || lease.status === "starting")) void closeLease(lease.id, "agent-stopped").catch(() => undefined);
    };
    socket.on(WS.hello, async (msg: AgentHelloMsg) => {
      try {
        const ownerAddr = await wsEffects.ownerOfApiKey(msg.apiKey);
        const existing = msg.nodeId ? getNode(msg.nodeId) : undefined;
        if (!ownerAddr || (existing && existing.ownerAddr !== ownerAddr)) throw new Error("unknown key or node owner");
        const node = await upsertNode({ ...msg.spec, id: msg.nodeId, ownerAddr, payToAddr: ownerAddr });
        bound = node.id;
        agentSockets.set(node.id, socket);
        const ack: HelloAckMsg = { nodeId: node.id, ownerAddr, bore: { server: config.boreServer, secret: config.boreSecret } };
        socket.emit(WS.helloAck, ack);
      } catch {
        socket.emit("error-message", "hello rejected");
        socket.disconnect(true);
      }
    });
    socket.on(WS.heartbeat, (msg: HeartbeatMsg) => {
      if (!bound || agentSockets.get(bound) !== socket) return;
      touchHeartbeat(bound, msg);
      for (const leaseId of msg.destroyed ?? []) onDestroyed({ leaseId, ok: true });
    });
    socket.on(WS.containerReady, (msg: ContainerReadyMsg) => {
      if (!owns(msg.leaseId)) return;
      const pending = starts.get(msg.leaseId);
      if (!pending || getLease(msg.leaseId)?.status !== "starting") {
        socket.emit(WS.destroyContainer, { leaseId: msg.leaseId });
        return;
      }
      pending.resolve(msg.access !== undefined ? msg.access : {
        kind: "ssh", host: msg.host, port: msg.port, username: "root",
        authMethod: "password", password: getLease(msg.leaseId)!.renterAddr,
        command: `ssh root@${msg.host} -p ${msg.port}`,
      });
      starts.delete(msg.leaseId);
    });
    socket.on(WS.containerFailed, (msg: ContainerFailedMsg) => {
      if (!owns(msg.leaseId)) return;
      starts.get(msg.leaseId)?.reject(new Error(msg.error));
      starts.delete(msg.leaseId);
      if (getLease(msg.leaseId)?.status === "active") void closeLease(msg.leaseId, "guest-exited").catch(() => undefined);
    });
    socket.on(WS.containerDestroyed, onDestroyed);
    socket.on(WS.jobResult, (msg: JobResultMsg) => {
      const pending = jobs.get(msg.jobId);
      if (!pending || !owns(pending.leaseId)) return;
      if (typeof msg.result !== "string" || Buffer.byteLength(msg.result) > JOB_RESULT_MAX_BYTES) {
        pending.reject(new Error("job result exceeded output limit"));
      } else pending.resolve(msg);
      jobs.delete(msg.jobId);
    });
    socket.on("disconnect", () => {
      if (!bound || agentSockets.get(bound) !== socket) return;
      agentSockets.delete(bound);
      markOffline(bound);
      for (const map of [starts, jobs, stops]) for (const [key, pending] of map) {
        if (pending.nodeId === bound) { pending.reject(new Error("agent disconnected; cleanup pending")); map.delete(key); }
      }
      for (const lease of leasesForNode(bound)) void closeLease(lease.id, "node-disconnected").catch(() => undefined);
    });
  });
  return io;
}

export function isNodeConnected(nodeId: string): boolean { return agentSockets.get(nodeId)?.connected === true; }

function request<T>(map: Map<string, Pending<T>>, key: string, nodeId: string, leaseId: string, timeoutMs: number,
  send: (socket: Socket) => void): Promise<T> {
  const socket = agentSockets.get(nodeId);
  if (!socket?.connected) return Promise.reject(new Error("node not connected; cleanup pending"));
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { map.delete(key); reject(new Error("agent acknowledgement timed out")); }, timeoutMs);
    map.set(key, { nodeId, leaseId, resolve: (value) => { clearTimeout(timer); resolve(value); },
      reject: (err) => { clearTimeout(timer); reject(err); } });
    send(socket);
  });
}

export function startContainer(args: StartContainerMsg & { nodeId: string; timeoutMs?: number }): Promise<SandboxAccess | null> {
  const { nodeId, timeoutMs = config.sandboxReadyTimeoutMs, ...msg } = args;
  destroyed.delete(receiptKey(nodeId, msg.leaseId));
  return request(starts, msg.leaseId, nodeId, msg.leaseId, timeoutMs,
    (socket) => socket.emit(WS.startContainer, { ...msg, deadline: Date.now() + timeoutMs }));
}

export function destroyContainer(nodeId: string, leaseId: string): Promise<void> {
  const key = receiptKey(nodeId, leaseId);
  starts.get(leaseId)?.reject(new Error("lease stopping"));
  starts.delete(leaseId);
  if (destroyed.has(key)) return Promise.resolve();
  return request(stops, key, nodeId, leaseId, config.sandboxStopTimeoutMs,
    (socket) => socket.emit(WS.destroyContainer, { leaseId }));
}

export function runJob(nodeId: string, leaseId: string, jobId: string, payload: string, timeoutMs = 120_000,
  notebookJob = false): Promise<JobResultMsg> {
  return request(jobs, jobId, nodeId, leaseId, timeoutMs,
    (socket) => socket.emit(WS.runJob, { leaseId, jobId, payload, notebookJob, deadline: Date.now() + timeoutMs, timeoutMs }));
}
