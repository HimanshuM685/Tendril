import assert from "node:assert/strict";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { waitForJupyter, stageNotebook, notebookOutput } from "./jupyter.js";
let allowUpgrade = true, statusCalls = 0, wsCalls = 0, uploaded: unknown;
const server = createServer(async (req, res) => {
  if (req.headers.authorization !== "token fixture-secret") { res.writeHead(403).end(); return; }
  res.setHeader("content-type", "application/json");
  if (req.url === "/api/status") { statusCalls++; res.end('{"started":true}'); }
  else if (req.url === "/api/kernels" && req.method === "POST") res.end('{"id":"fixture-kernel"}');
  else if (req.url === "/api/kernels/fixture-kernel" && req.method === "DELETE") res.writeHead(204).end();
  else if (req.method === "PUT") {
    let body = ""; for await (const chunk of req) body += chunk;
    if (req.url?.endsWith("in.ipynb")) uploaded = JSON.parse(body).content;
    res.end('{}');
  } else if (req.url?.endsWith("out.ipynb")) res.end(JSON.stringify({ content: uploaded }));
  else res.end('{"content":[]}');
});
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
  if (!allowUpgrade) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => { wsCalls++; ws.once("message", () => ws.send('{"header":{"msg_type":"kernel_info_reply"}}')); });
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const addr = server.address(); assert.ok(addr && typeof addr === "object");
const base = `http://127.0.0.1:${addr.port}/`;
try {
  await waitForJupyter(base, "fixture-secret", Date.now() + 2000);
  assert.ok(statusCalls > 0 && wsCalls > 0);
  const notebook = { nbformat: 4, cells: [], metadata: {} };
  await stageNotebook(base, "fixture-secret", "job", notebook);
  assert.deepEqual((await notebookOutput(base, "fixture-secret", "job")).notebook, notebook);
  allowUpgrade = false;
  await assert.rejects(waitForJupyter(base, "fixture-secret", Date.now() + 350), /readiness timed out/);
  console.log("Jupyter transport: HTTP notebook bytes and status + WebSocket readiness ok");
} finally {
  for (const ws of wss.clients) ws.terminate(); wss.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
