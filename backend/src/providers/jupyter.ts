import { randomUUID } from "node:crypto";
import WebSocket from "ws";
import type { RunArtifact } from "@tendril/shared";

export async function jupyterJson(base: string, token: string, path: string, method = "GET", body?: unknown, timeoutMs = 10_000): Promise<any> {
  const res = await fetch(new URL(path, base), { method, headers: { authorization: `token ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(Math.max(1, timeoutMs)) });
  if (!res.ok) { await res.body?.cancel(); throw new Error(`Jupyter request failed (${res.status})`); }
  if (res.status === 204) return null;
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 6_000_000) throw new Error("Jupyter response limit exceeded");
      chunks.push(value);
    }
  } catch (err) { await reader.cancel(); throw err; }
  return JSON.parse(Buffer.concat(chunks).toString());
}

/** Status and a real kernel roundtrip must pass before activation/settlement. */
export async function waitForJupyter(base: string, token: string, deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    try {
      await jupyterJson(base, token, "api/status", "GET", undefined, Math.min(3000, deadline - Date.now()));
      const kernel = await jupyterJson(base, token, "api/kernels", "POST", { name: "python3" }, Math.min(3000, deadline - Date.now()));
      try {
        const url = new URL(`api/kernels/${encodeURIComponent(kernel.id)}/channels`, base);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(url, { headers: { authorization: `token ${token}` }, origin: new URL(base).origin,
            handshakeTimeout: Math.max(1, Math.min(3000, deadline - Date.now())) });
          const finish = (err?: Error) => { clearTimeout(timer); ws.terminate(); err ? reject(err) : resolve(); };
          const timer = setTimeout(() => finish(new Error("Jupyter WebSocket readiness failed")), Math.max(1, Math.min(5000, deadline - Date.now())));
          ws.once("error", () => finish(new Error("Jupyter WebSocket readiness failed")));
          ws.once("open", () => ws.send(JSON.stringify({ header: { msg_id: randomUUID(), username: "tendril", session: randomUUID(),
            msg_type: "kernel_info_request", version: "5.3", date: new Date().toISOString() }, parent_header: {}, metadata: {}, content: {}, channel: "shell", buffers: [] })));
          ws.on("message", (data) => { try { if (JSON.parse(data.toString()).header?.msg_type === "kernel_info_reply") finish(); } catch { /* unrelated kernel messages */ } });
        });
      } finally { await jupyterJson(base, token, `api/kernels/${encodeURIComponent(kernel.id)}`, "DELETE", undefined, 3000); }
      return;
    } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  throw new Error("Jupyter status/WebSocket readiness timed out");
}

export async function stageNotebook(base: string, token: string, jobId: string, notebook: Record<string, unknown>) {
  await jupyterJson(base, token, `api/contents/jobs/${jobId}`, "PUT", { type: "directory" });
  await jupyterJson(base, token, `api/contents/jobs/${jobId}/in.ipynb`, "PUT", { type: "notebook", format: "json", content: notebook });
}
const mediaTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", svg: "image/svg+xml", csv: "text/csv", json: "application/json", txt: "text/plain", html: "text/html", pdf: "application/pdf" };
export async function notebookOutput(base: string, token: string, jobId: string): Promise<{ notebook: Record<string, unknown>; artifacts: RunArtifact[] }> {
  const path = `jobs/${jobId}`;
  const executed = await jupyterJson(base, token, `api/contents/${path}/out.ipynb`);
  const artifacts: RunArtifact[] = [];
  let used = 0;
  const visit = async (dir: string, depth = 0): Promise<void> => {
    if (depth > 8) return;
    const listed = await jupyterJson(base, token, `api/contents/${dir}`);
    for (const item of listed.content ?? []) {
      const name = String(item.name);
      if (!name || name.includes("/") || name === ".." || name === "." || ["in.ipynb", "out.ipynb", ".ipynb_checkpoints"].includes(name)) continue;
      const child = `${dir}/${encodeURIComponent(name)}`;
      if (item.type === "directory") { await visit(child, depth + 1); continue; }
      if (typeof item.size !== "number" || item.size < 0 || item.size + used > 4_000_000 || artifacts.length >= 100) continue;
      const file = await jupyterJson(base, token, `api/contents/${child}?type=file&format=base64`);
      const bytes = Buffer.from(file.content, "base64");
      if (bytes.length + used > 4_000_000) continue;
      used += bytes.length;
      artifacts.push({ name: decodeURIComponent(child.slice(path.length + 1)), mediaType: mediaTypes[name.split(".").pop()!.toLowerCase()] ?? "application/octet-stream", base64: bytes.toString("base64") });
    }
  };
  await visit(path);
  return { notebook: executed.content, artifacts };
}
