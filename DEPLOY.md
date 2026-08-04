# Tendril — Setup & Deployment

This covers full local setup, Algorand testnet account prep, and production deployment of each
component. For the project overview and the demo script, see [README.md](./README.md).

---

## 1. Prerequisites

| Tool | Why | Install |
|---|---|---|
| Node 20+ & npm | runs everything | https://nodejs.org |
| **Neon** Postgres | stores wallets, top-ups, charges, earnings, withdrawals, API keys (`DATABASE_URL`) — *not* nodes/leases | https://neon.tech (free tier) |
| Docker (daemon running) | the contributor agent's SSH sandboxes | https://docs.docker.com |
| SSH client | renters connect to a rented box (public exposure uses an in-container **bore** tunnel — nothing to install on the contributor) | built into macOS/Linux/Windows |
| Algorand **testnet** accounts | platform (receives top-ups **+ pays contributors**), contributor, consumer (pays) | see below |

### Algorand testnet account prep

Payments are **native ALGO**, so there's no USDC and no ASA opt-in. Users **top up** a prepaid
balance by sending ALGO to the **platform custodial address** (`PLATFORM_PAYTO`); the registry
confirms each deposit on-chain and credits an off-chain ledger in Neon. On lease end it bills the
usage once and **credits the contributor's earnings balance**, which they withdraw on-chain from the
platform account (minimum `MIN_WITHDRAW_ATOMIC`, default 5 USDC).

- **Platform account (`PLATFORM_PAYTO` + `PLATFORM_PRIVATE_KEY`):** generate a key with
  `npm run keygen`; use its **Address** as `PLATFORM_PAYTO` and the key it prints as
  `PLATFORM_PRIVATE_KEY` (the registry signs contributor withdrawals with it). Fund it with enough
  ALGO to cover withdrawals + txn fees — it's the pool that holds every user's prepaid balance.
- **Consumer accounts:** funded with ALGO to cover top-ups + the ~0.001 ALGO deposit txn fee.

1. **Generate the platform key** (prints `Address` + `PLATFORM_PRIVATE_KEY`):
   ```bash
   npm run keygen
   ```
2. **Fund with testnet ALGO:** https://bank.testnet.algorand.network/ (paste the address).
3. Keep every private key secret. The base64 value is a 64-byte key (seed + public key).

---

## 2. Local setup

```bash
git clone <repo> tendril && cd tendril
npm install
cp .env.example .env          # edit values; root .env is picked up by all Node apps
```

`.env` is read by the backend, contributor, and example-buyer (each app's own `.env` overrides the
root one; inline `FOO=bar npm run ...` overrides both). The web app reads `web/.env` (Vite,
`VITE_*` only).

Run each piece in its own terminal:

```bash
npm run backend       # http://localhost:4000  (needs DATABASE_URL + PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)
npm run contributor   # contributor daemon (needs TENDRIL_API_KEY + Docker running)
npm run web           # http://localhost:5173
npm run client        # the autonomous consumer agent (needs its own funded AVM_PRIVATE_KEY)
```

Tips:
- The SSH sandbox image builds locally on the first rent (from `contributor/sandbox-ssh`) and is
  cached after — the first rent waits on that one-time build.
- Running the agent on the **same machine** as the consumer? Set `TUNNEL_MODE=local` to skip bore and
  SSH to `127.0.0.1:<port>` instead.
- Useful checks: `curl localhost:4000/health`, `curl localhost:4000/explorer`.

---

## 3. Production deployment

Three independently deployable pieces: **backend** (central registry service), **web** (static
site), **contributor** (runs on each contributor's own machine). The autonomous client runs anywhere.

### 3a. Backend / registry (central API)

Requirements: a long-running Node host with **WebSocket** support, a **Neon** Postgres database
(`DATABASE_URL`), outbound HTTPS to an **Algod** endpoint (to confirm top-ups **and send withdrawals**),
and (if the web app is HTTPS) **TLS**. No local disk/volume — only money state lives in Neon; nodes
and leases are in-memory.

**Option A — Docker (provided):**
```bash
# build from the repo root
docker build -f backend/Dockerfile -t tendril-backend .
docker run -d --name tendril-backend \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" \
  -e PLATFORM_PAYTO=<your-platform-algorand-address> \
  -e PLATFORM_PRIVATE_KEY=<base64-64-byte-key-for-that-address> \
  -e PLATFORM_FEE_PCT=10 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e CORS_ORIGIN=https://tendril.your-domain.com \
  tendril-backend
```

**Option B — PaaS (Railway / Render / Fly.io):**
- Start command: `npm run start -w backend` (no build step — `tsx` runs the TS directly).
- Set env vars (below). No volume needed — point `DATABASE_URL` at Neon.
- Ensure WebSockets are enabled (Render/Railway: on by default; Fly: TCP/HTTP service is fine).

**Option C — bare VPS + systemd + nginx:**
- `npm ci --omit=dev` on the box, run `npm run start -w backend` under systemd (or pm2).
- Put nginx/Caddy in front for TLS, and **proxy WebSocket upgrades**:
  ```nginx
  location / {
      proxy_pass http://127.0.0.1:4000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
  }
  ```

Registry env vars:

| Var | Default | Notes |
|---|---|---|
| `REGISTRY_PORT` | `4000` | |
| `DATABASE_URL` | — | **required** — Neon Postgres connection string (keep `?sslmode=require`) |
| `PLATFORM_PAYTO` | — | **required** — custodial Algorand address that receives top-ups |
| `PLATFORM_PRIVATE_KEY` | — | **required for withdrawals** — base64 64-byte key for `PLATFORM_PAYTO`; signs contributor withdrawals. If unset, earnings still accrue but `POST /withdraw` returns 503 |
| `PLATFORM_FEE_PCT` | `10` | platform's % cut of each charge; the rest is paid to the contributor |
| `JWT_SECRET` | dev value | **set a strong secret in prod** (signs wallet-session + lease tokens) |
| `CORS_ORIGIN` | `*` | set to your web origin(s), comma-separated |
| `HEARTBEAT_TIMEOUT_MS` | `30000` | node considered offline after this gap |
| `X402_NETWORK` | testnet CAIP-2 | Network every payment must be on; must match the facilitator's `/supported` exactly |
| `X402_ASSET_ID` | `10458941` | ASA every price is denominated in (testnet USDC; mainnet `31566704`) |
| `X402_FACILITATOR_URL` | `https://facilitator.goplausible.xyz` | Verifies + settles payments and sponsors the network fee |
| `MIN_TOPUP_ATOMIC` / `MAX_TOPUP_ATOMIC` | `100000` / `1000000000` | Top-up bounds, in atomic units |
| `MIN_PAYABLE_ATOMIC` | `10000` | Floor an **unauthenticated** rent must pay on-chain, whatever credit `?payer=` holds |
| `MIN_LEASE_SECONDS` / `MAX_LEASE_SECONDS` / `LEASE_SECONDS_GRANULARITY` | `60` / `14400` / `60` | Bounds on a prepaid block |
| `SANDBOX_READY_TIMEOUT_MS` | `45000` | How long to wait for a sandbox before 503 — nothing is settled if it elapses |
| `METER_INTERVAL_MS` | `10000` | how often the **watchdog** checks active leases for balance exhaustion (no per-tick billing) |
| `ALGOD_TESTNET_URL` | `https://testnet-api.algonode.cloud` | Algod used to confirm top-ups + send withdrawals |

### 3b. Web app (static SPA)

It's a Vite build — pure static assets. Set `VITE_REGISTRY_URL` **at build time**.

```bash
VITE_REGISTRY_URL=https://api.your-tendril-domain.com npm run build -w web
# output: web/dist  → upload to any static host
```

**Vercel / Netlify / Cloudflare Pages:**
- Build command: `npm install && npm run build -w web`
- Output directory: `web/dist`
- Env var: `VITE_REGISTRY_URL = https://api.your-tendril-domain.com`
- SPA rewrite: serve `index.html` for all routes (Netlify `_redirects`: `/* /index.html 200`;
  Vercel/CF Pages handle SPAs automatically).

**Optional — social sign-in (Magic):** set `VITE_MAGIC_API_KEY` to a publishable key from
[dashboard.magic.link](https://dashboard.magic.link) and add your site's origin to that app's
allowed origins. It adds a **Social sign-in** branch (Google + email OTP) to the connect modal for
renters who have no Algorand wallet; unset, the modal shows only Pera / Lute / Defly and nothing
else changes. The key is meant to ship in the bundle — it grants no signing power on its own.

**Magic Google OAuth setup:**
1. Magic Dashboard → **Social Login** → enable **Email OTP** and **Google** (add Google OAuth Client ID + Secret).
2. Add your site origin(s) under the Magic app's allowed origins (`http://localhost:5173` for local dev).
3. OAuth redirect URI is `{your-origin}/callback` (e.g. `https://tendril.algo/callback`).
4. In Google Cloud Console, add Magic's redirect URI from the Magic Dashboard to your OAuth app.

> **Mixed content:** if the site is served over HTTPS, the registry **must** also be HTTPS/WSS,
> or browsers will block the API + socket calls.

### 3c. Contributor agent (on each contributor's machine)

The agent is *not* centrally deployed — each contributor runs it on the machine whose compute they
share. It needs Docker locally; SSH is exposed by a **bore** tunnel that runs *inside* each sandbox
(it dials out), so there's nothing extra to install or open.

A contributor needs **no Algorand key**. They connect their wallet in the web app, sign in, open
**CONTRIBUTE** and mint an API key — that key identifies the node and names the wallet its earnings
go to. Contributors can clone the standalone
[TendrilContributor](https://github.com/) repo instead of the monorepo; it's the agent alone.

```bash
# on the contributor's machine
git clone <repo> tendril && cd tendril && npm install
TENDRIL_API_KEY=<key from the web app> \
REGISTRY_URL=https://api.your-tendril-domain.com \
NODE_LABEL="ryzen-3090-box" PRICE_PER_HOUR_USD=2.0 SANDBOX_GPUS=all \
  npm run contributor
```

Keep it alive with **pm2** (`pm2 start "npm run contributor" --name tendril-contributor`) or a systemd unit.
The renter gets an `ssh root@<bore-host> -p <port>` command (password = the renter's wallet address).

Agent env vars: `TENDRIL_API_KEY` (required), `NODE_LABEL`, `PRICE_PER_HOUR_USD`, `SANDBOX_IMAGE`
(defaults to the locally-built `tendril-ssh-sandbox`), `SANDBOX_MEMORY`, `SANDBOX_CPUS`,
`SANDBOX_GPUS` (`all` to pass GPUs), `TUNNEL_MODE` (`bore`|`local`), `REGISTRY_URL` (only when the
backend isn't the hosted one). `BORE_SERVER`/`BORE_SECRET` are set on the **backend** and pushed to
every agent, so a self-hosted bore server is one change in one place.

### 3d. Autonomous consumer agent

Runs anywhere (CI, a laptop, a server) with a funded key:

```bash
AVM_PRIVATE_KEY=<buyer-key> REGISTRY_URL=https://api.your-tendril-domain.com \
AGENT_MIN_RAM_MB=2048 AGENT_TOPUP_ATOMIC=500000 npm run client
```

It tops up `AGENT_TOPUP_ATOMIC` over x402 (no sign-in), rents the cheapest
matching node, runs its job, and releases — reporting how much balance it drew down.

---

## 4. Production checklist

- [ ] Strong `JWT_SECRET` on the registry.
- [ ] `DATABASE_URL` points at Neon; `PLATFORM_PAYTO` + `PLATFORM_PRIVATE_KEY` set to an account you
      control and **funded** (it pays out every contributor); `PLATFORM_FEE_PCT` reviewed.
- [ ] `CORS_ORIGIN` locked to your web origin.
- [ ] Registry + web both HTTPS (avoid mixed-content blocking); WebSocket upgrades proxied.
- [ ] Algod (`ALGOD_TESTNET_URL`) reachable from the registry host (top-ups + withdrawals) and clients.
- [ ] `PLATFORM_PAYTO` **opted into** `X402_ASSET_ID` — payments to an address that has not opted in fail.
- [ ] `X402_NETWORK` matches the facilitator's `/supported` byte for byte; `METER_INTERVAL_MS` reviewed.
- [ ] `VITE_REGISTRY_URL` + `VITE_ALGOD_URL` baked into the web build (plus
      `VITE_MAGIC_API_KEY` if you want email sign-in).
- [ ] Contributors pre-build `SANDBOX_IMAGE` (`docker build -t tendril-ssh-sandbox contributor/sandbox-ssh`);
      agents kept alive (pm2/systemd) with Docker running + outbound network for bore.
- [ ] Consumer accounts hold **ALGO** for top-ups (+ txn fees). No USDC / ASA opt-in needed.
- [ ] Safeguard `PLATFORM_PRIVATE_KEY` — it custodies user top-ups *and* signs every withdrawal.

## 5. Known limitations

- **Custodial:** top-ups pool at `PLATFORM_PAYTO` and balances are an off-chain ledger in Neon.
  Contributor earnings **are** settled on-chain at lease end (via `PLATFORM_PRIVATE_KEY`); there's no
  on-chain *renter* withdrawal path for unused balance yet.
- **Billing granularity:** usage is calculated continuously but **charged once**, at lease end,
  prorated at the hourly rate. The watchdog only checks balance exhaustion every `METER_INTERVAL_MS`,
  so worst-case over-use is one tick before teardown.
- **In-memory nodes/leases:** a registry restart drops live sessions (their sockets die too). This is
  deliberate — it keeps Postgres out of the heartbeat/watchdog hot path. For HA, persist + externalize.
- **SSH auth** is a per-lease password (the renter's wallet address) on a throwaway root container —
  fine for ephemeral compute, but use a key-based flow for anything sensitive.
- Contributors earn whether or not they've opted into `X402_ASSET_ID` — the opt-in is only checked at
  **withdrawal**, which is refused (409) until it's done. A node whose address hasn't opted in is
  still flagged `payoutBlocked` as a heads-up.
- A single registry instance owns the WebSocket hub *and* the in-memory state; for horizontal scale
  externalize both (e.g. a socket.io Redis adapter + shared store).
- The public `bore.pub` server is best-effort/rate-limited; run your own and set `BORE_SERVER` on the
  backend (it reaches every agent from there) for anything beyond demos.
