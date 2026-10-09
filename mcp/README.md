# Tendril MCP

Stdio MCP so any agent can buy compute and manage contributor keys against the Tendril registry. Payments use `AVM_PRIVATE_KEY` over x402. Contributor API keys cannot pay.

```bash
npx -y @tendril/mcp-server
```

Claude Desktop / Cursor:

```json
{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "https://tendrilregister.007575.xyz",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}
```

`tendril_platform` and `tendril_list_nodes` work without a key. Paid tools need `AVM_PRIVATE_KEY`. Do not put a contributor `TENDRIL_API_KEY` here — that secret only registers a node.

From this repo: `npm run mcp`. Tool list: [docs/mcp.md](../docs/mcp.md).

Publish (needs an `@tendril` npm token):

```bash
npm publish -w @tendril/mcp-server --access public
```
