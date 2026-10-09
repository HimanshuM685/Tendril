# Build on Tendril

Integrate autonomous agents, execute Python sandboxes, or monetize idle CPU and GPU hardware with the contributor daemon.

## Serverless Python Execution

`POST /x402/run` accepts scripts over HTTP. An unpaid request receives a `402` quote; paid execution requires an x402 signer or an existing authorized payment path.

```python
import os
import requests

API = os.environ.get("REGISTRY_URL", "http://localhost:4000")
response = requests.post(
    f"{API}/x402/run",
    json={"payload": "import math; print(math.factorial(20))"},
)
print(response.status_code, response.json())
```

See [client recipes](/docs/api/x402#client-recipes) for signing and payment retries, or use the [MCP server](/docs/build/mcp) to pay from agent tools.

## Best-Value Scoring Algorithm

Tendril ranks useful capacity relative to hourly price rather than blindly selecting the cheapest node:

```text
score = (cores + (ram_gb / 4.0)) / price_per_hour_usd
```

A machine at half the price that takes three times as long can cost more overall.

## Become a Provider

Share spare CPU or GPU capacity. The contributor daemon holds no wallet private key; the wallet that minted its API key on [Contribute](https://tendrilhq.com/contribute) owns the node and receives earnings.

### Installing & Running the Daemon

Install Docker and Node.js, mint a contributor API key, then run from the repository root:

```bash
git clone https://github.com/HimanshuM685/Tendril.git
cd Tendril
npm install
TENDRIL_API_KEY="<your-api-key>" PRICE_PER_HOUR_USD=0.20 npm run contributor
```

Set `REGISTRY_URL` when targeting a different registry. Use `SANDBOX_GPUS=all` when passing GPUs into a supported sandbox. The bore tunnel connects outward; no router port forwarding is needed.

### Earnings & On-Chain Payouts

Lease release credits contributor earnings. Withdraw accumulated USDC from **Contribute** once the configured minimum is met (default 5 USDC). The receiving wallet must be opted into the configured USDC asset.

## Model Context Protocol (MCP)

Run the stdio server without cloning:

```bash
npx -y @tendril/mcp-server
```

Paid tools use `AVM_PRIVATE_KEY`, a base64 64-byte Algorand secret key. A contributor API key cannot pay. See [MCP tools](/docs/build/mcp) for environment variables, tool schemas, spend caps, and recipes.

### Claude Desktop, Cursor, Claude Code, VS Code

Claude Desktop uses `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows. Cursor uses `~/.cursor/mcp.json`. Both accept:

```json
{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "<registry-url>",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}
```

Cline and Roo use that object too. Restart your client after saving.

Claude Code:

```bash
claude mcp add --transport stdio tendril \
  --env REGISTRY_URL="$API" \
  --env AVM_PRIVATE_KEY="<base64 64-byte secret>" \
  -- npx -y @tendril/mcp-server
```

VS Code uses `servers` and requires `type` in `.vscode/mcp.json`:

```json
{
  "servers": {
    "tendril": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "<registry-url>",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}
```

## Autonomous Agent Tool Loop

A minimal agent loop checks wallet credit, surveys live nodes, executes a job, and collects the result. Use an x402-aware client for paid requests; raw HTTP can inspect quotes and free discovery endpoints.

```python
import os
import requests

API = os.environ.get("REGISTRY_URL", "http://localhost:4000")
nodes = requests.get(f"{API}/explorer").json()["nodes"]
print(f"Discovered {len(nodes)} active machines.")

# This requests a quote. An x402 signer must authorize the paid retry.
quote = requests.post(f"{API}/x402/run", json={
    "payload": "import sys; print(f'Running on Python {sys.version}')"
})
print(quote.status_code, quote.json())
```
