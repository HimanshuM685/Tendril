import { createConnection } from "node:net";
import { config } from "../config.js";
import type { RelayAllocation, RelayRequest } from "./types.js";

export function relayRequest<T>(request: RelayRequest, socketPath = config.relaySocket): Promise<T> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(socketPath);
    let data = "", settled = false;
    const finish = (err?: Error, value?: T) => {
      if (settled) return;
      settled = true; clearTimeout(timer); socket.destroy();
      if (err) reject(err); else resolve(value as T);
    };
    const timer = setTimeout(() => finish(new Error("relay acknowledgement timed out")), config.sandboxStopTimeoutMs);
    socket.once("connect", () => socket.write(JSON.stringify(request) + "\n"));
    socket.on("data", (chunk) => {
      data += chunk.toString();
      if (data.length > 64_000) return finish(new Error("relay response too large"));
      if (!data.includes("\n")) return;
      try {
        const result = JSON.parse(data.split("\n")[0]) as { ok: boolean; value: T; error?: string };
        finish(result.ok ? undefined : new Error(result.error || "relay failed"), result.value);
      } catch { finish(new Error("invalid relay response")); }
    });
    socket.once("error", (err) => finish(err));
    socket.once("end", () => { if (!settled) finish(new Error("relay disconnected before acknowledgement")); });
  });
}
export const relayClient = {
  allocate: (leaseId: string, ssh: boolean, notebook: boolean, publicNotebook: boolean) =>
    relayRequest<RelayAllocation>({ op: "allocate", leaseId, ssh, notebook, publicNotebook }),
  destroy: (leaseId: string) => relayRequest<void>({ op: "destroy", leaseId }),
};
