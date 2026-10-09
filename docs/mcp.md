# Tendril MCP

Stdio [Model Context Protocol](https://modelcontextprotocol.io) server. Agents call named tools; this process pays [x402](./x402-api.md) with a local Algorand key. Same payment path as the headless buyer — the MCP is not a privileged client.

It talks to the **registry HTTP API**. It does **not** start the contributor daemon, open Docker, or SSH for you.

---

## Table of contents

- [Run](#run)
- [Environment](#environment)
- [Clients](#clients)
- [Spend cap](#spend-cap)
- [Tools](#tools)
  - [Consumer](#consumer)
  - [Contributor](#contributor)
- [Recipes](#recipes)

---

## Run

Anyone, no clone:

```bash
npx -y @tendril/mcp-server
```

Stdio only — do not pipe logs to stdout. From this repo, `npm run mcp` is the same server.

## Environment

| Var | Default | What |
|---|---|---|
| `REGISTRY_URL` | `https://tendrilregister.007575.xyz` | Registry origin. Not the Vercel site (`tendrilhq.com`). |
| `AVM_PRIVATE_KEY` | — | **Required** for paid tools and `tendril_account`. Base64 64-byte secret (`npm run keygen`). |
| `TENDRIL_MAX_ATOMIC` | `1000000` ($1) | Per x402 quote cap. Topup / run / rent / mint-key refuse if the 402 amount is higher. |
| `ALGORAND_NETWORK` | inferred from `GET /platform` | `testnet` \| `mainnet` |
| `ALGOD_URL` | follows the network | Algod for login txns and x402 construction |

The wallet must be **opted into USDC** and hold enough of it for on-chain gate fees. Prepaid **credit** (`balanceAtomic`) is separate: top up once, then execution time bills that ledger. Contributor **earnings** (`earningsAtomic`) only leave via `tendril_withdraw`.

## Clients

Stdio only. Package is `@tendril/mcp-server`. Restart the client after saving. Do not commit the secret. A contributor `TENDRIL_API_KEY` does not belong in these files — it cannot pay x402.

Cline and Roo take the same `mcpServers` object as Claude Desktop. Only the settings file path differs.

### Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

### Cursor

Global: `~/.cursor/mcp.json`. Project: `.cursor/mcp.json`. Same JSON as Claude Desktop.

### Claude Code

```bash
claude mcp add --transport stdio tendril \
  --env REGISTRY_URL=https://tendrilregister.007575.xyz \
  --env AVM_PRIVATE_KEY=<base64 64-byte secret> \
  -- npx -y @tendril/mcp-server
```

Or commit a project `.mcp.json` with the same `mcpServers` object (leave the secret out of git; pass it via the shell env the command already supports).

### VS Code

`.vscode/mcp.json` (or the user `mcp.json`). The key is `servers`, and `type` is required.

```json
{
  "servers": {
    "tendril": {
      "type": "stdio",
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

## Spend cap

Before paying, the MCP probes the 402 and reads `accepts[0].amount`. If that integer is greater than `TENDRIL_MAX_ATOMIC`, it aborts and nothing settles.

`tendril_withdraw` is **not** capped that way: it sends existing earnings, all-or-nothing, floored at `minWithdrawAtomic` from `tendril_platform`.

---

## Tools

### Consumer

| Tool | HTTP | Notes |
|---|---|---|
| `tendril_platform` | `GET /platform` | Network, USDC ASA, `flatMintKeyAtomic`, `minWithdrawAtomic`. |
| `tendril_list_nodes` | `GET /explorer` | Live machines, RAM, $/hr. |
| `tendril_account` | nonce + `POST /auth/wallet-login` then `GET /wallet` | `balanceAtomic` (prepaid) vs `earningsAtomic` (contributor). Session cached. |
| `tendril_topup` | `POST /x402/topup?amount=` | Paid. `amountAtomic` is USDC atomic units (`1000000` = $1). |
| `tendril_run` | `POST /x402/run` `{payload}` | Paid. Python in, stdout out. Optional `leaseToken` runs inside a rented box. |
| `tendril_run_notebook` | `POST /x402/run` `{notebook, lane?}` | Paid. Python nbformat 4. Contributor, priority (Modal) or e2b CPU. Returns `jobId` and `jobToken`. |
| `tendril_notebook_job` | `GET /x402/run/:id` | Free. Pass `jobId`/`jobToken`; poll until `run` or `error` arrives for cells, artifacts, and billed usage. |
| `tendril_rent` | `POST /x402/rent?nodeId=` | Paid. Returns `ssh`, `leaseId`, `leaseToken`. Optional `sshPubKey`. |
| `tendril_lease` | `GET /lease/:id` | Needs `leaseToken`. |
| `tendril_release` | `DELETE /x402/leases/:id` | Stops the meter; bills seconds used. |

### Contributor

Same `AVM_PRIVATE_KEY` session. Minting a key does **not** launch `npm run contributor`.

| Tool | HTTP | Notes |
|---|---|---|
| `tendril_my_nodes` | `GET /nodes?owner=` | Nodes registered to this wallet. |
| `tendril_list_keys` | `GET /keys` | Previews only. |
| `tendril_mint_key` | `POST /x402/keys` `{label}` | Paid (`flatMintKeyAtomic`). **`secret` is returned once** — stash as `TENDRIL_API_KEY` on the daemon. |
| `tendril_revoke_key` | `DELETE /keys/:id` | Next daemon `hello` is rejected. |
| `tendril_withdraw` | `POST /withdraw` | Cashes **all** earnings to the signed-in address. Requires USDC opt-in. No amount argument. |

HTTP shapes and errors: [api.md](./api.md) and [x402-api.md](./x402-api.md).

---

## Recipes

**One-shot job**

1. `tendril_platform` — confirm asset/network.
2. `tendril_topup` with enough atomic units (at least `minTopUpAtomic`).
3. `tendril_run` with `payload` = Python source.

**Rent + SSH**

1. `tendril_list_nodes` — pick an id.
2. `tendril_rent` `{nodeId}`.
3. SSH with the returned command (password is the wallet address unless you passed `sshPubKey`).
4. `tendril_release` when done.

**Share a machine**

1. `tendril_mint_key` `{label}` — copy `secret`.
2. On the host: `TENDRIL_API_KEY=<secret> PRICE_PER_HOUR_USD=1.0 npm run contributor`.
3. `tendril_my_nodes` to confirm it is online.
4. `tendril_withdraw` when `earningsAtomic` is at least `minWithdrawAtomic`.
