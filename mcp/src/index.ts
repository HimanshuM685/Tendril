/**
 * Tendril MCP — stdio. Agents call named tools; this process pays x402.
 * Do not log to stdout (that is the MCP transport).
 * Published bin is dist/cli.js (shebang added at build).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as tools from "./tools.js";

function text(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const server = new McpServer({ name: "tendril", version: "0.1.0" });

server.tool(
  "tendril_platform",
  "Tendril platform config: network, USDC asset, facilitator, top-up bounds, mint-key fee, min withdraw.",
  {},
  async () => {
    try {
      return text(await tools.platform());
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_list_nodes",
  "List live Tendril machines (specs + USD/hr). Free GET /explorer.",
  {},
  async () => {
    try {
      return text(await tools.listNodes());
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_account",
  "Sign in with AVM_PRIVATE_KEY and return wallet summary: prepaid balanceAtomic vs contributor earningsAtomic.",
  {},
  async () => {
    try {
      return text(await tools.account());
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_topup",
  "Buy prepaid credit via x402 POST /x402/topup. amountAtomic is USDC atomic units (1_000_000 = $1). Capped by TENDRIL_MAX_ATOMIC.",
  { amountAtomic: z.number().int().positive().describe("USDC atomic units to credit") },
  async ({ amountAtomic }) => {
    try {
      return text(await tools.topup(amountAtomic));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_run",
  "Run Python on Tendril. POST /x402/run {payload}. No lease: picks a machine, bills seconds from credit. Optional leaseToken runs inside a rented sandbox. Gate fee is on-chain (x402); execution bills credit.",
  {
    payload: z.string().describe("Python source; stdout comes back in result"),
    leaseToken: z.string().optional().describe("Lease bearer token from tendril_rent"),
  },
  async ({ payload, leaseToken }) => {
    try {
      return text(await tools.run(payload, leaseToken));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_run_notebook",
  "Run a Jupyter notebook on hosted CPU. POST /x402/run {notebook}. notebook is nbformat JSON (cells array). Returns the executed notebook plus artifacts. Gate fee on-chain; seconds bill from credit. Needs AVM_PRIVATE_KEY.",
  {
    notebook: z
      .record(z.unknown())
      .describe("nbformat JSON object, under 1.5 MB"),
  },
  async ({ notebook }) => {
    try {
      return text(await tools.runNotebook(notebook));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_rent",
  "Open a metered SSH sandbox. POST /x402/rent?nodeId=. Pick nodeId from tendril_list_nodes. Returns ssh command, leaseId, leaseToken. Gate fee on-chain; time bills from credit until tendril_release.",
  {
    nodeId: z.string().describe("Node id from tendril_list_nodes / GET /explorer"),
    sshPubKey: z.string().optional().describe("OpenSSH public key to authorize; otherwise wallet address is the password"),
  },
  async ({ nodeId, sshPubKey }) => {
    try {
      return text(await tools.rent(nodeId, sshPubKey));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_lease",
  "Lease status. GET /lease/:id with the leaseToken from tendril_rent.",
  {
    leaseId: z.string(),
    leaseToken: z.string(),
  },
  async ({ leaseId, leaseToken }) => {
    try {
      return text(await tools.lease(leaseId, leaseToken));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_release",
  "Stop the meter and bill seconds used. DELETE /x402/leases/:id. Needs leaseToken from tendril_rent.",
  {
    leaseId: z.string(),
    leaseToken: z.string(),
  },
  async ({ leaseId, leaseToken }) => {
    try {
      return text(await tools.release(leaseId, leaseToken));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_my_nodes",
  "Nodes registered to this wallet. GET /nodes?owner=. Does not start the contributor daemon.",
  {},
  async () => {
    try {
      return text(await tools.myNodes());
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_list_keys",
  "List contributor API key previews for this wallet. Secrets are never stored after mint.",
  {},
  async () => {
    try {
      return text(await tools.listKeys());
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_mint_key",
  "Mint a contributor API key (paid x402 POST /x402/keys). Secret is returned ONCE — stash it as TENDRIL_API_KEY on the contributor daemon. This tool does not start the daemon. Payer must be the signed-in wallet. Capped by TENDRIL_MAX_ATOMIC.",
  { label: z.string().optional().describe("Display label, max 64 chars") },
  async ({ label }) => {
    try {
      return text(await tools.mintKey(label));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_revoke_key",
  "Revoke a contributor API key. DELETE /keys/:id. Next daemon hello with that secret is rejected.",
  { id: z.number().int().positive() },
  async ({ id }) => {
    try {
      return text(await tools.revokeKey(id));
    } catch (err) {
      return fail(err);
    }
  },
);

server.tool(
  "tendril_withdraw",
  "Cash out ALL contributor earnings to the signed-in wallet (POST /withdraw). All-or-nothing, floored at platform minWithdrawAtomic. Requires USDC opt-in. Not x402; not capped by TENDRIL_MAX_ATOMIC.",
  {},
  async () => {
    try {
      return text(await tools.withdraw());
    } catch (err) {
      return fail(err);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
