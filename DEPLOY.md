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
root one; inline `FOO=bar npm run ...` overrides both). Browser apps read public `NEXT_PUBLIC_*`
values from their own `.env.local` files.

Run each piece in its own terminal:

```bash
npm run backend       # http://localhost:4000  (needs DATABASE_URL + PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)
npm run contributor   # contributor daemon (needs TENDRIL_API_KEY + Docker running)
npm run web           # http://localhost:5173
npm run docs          # http://localhost:5175 (standalone documentation)
npm run admin         # http://localhost:5174  (admin portal; needs ADMIN_EMAILS on backend)
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

Independently deployable pieces: **backend** (central registry service), **web** (main Next.js
site), **docs-web** (documentation Next.js site), **admin**, and **contributor** (runs on each
contributor's own machine). The autonomous client runs anywhere.

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
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | optional — enable Google OAuth custodial login |
| `GOOGLE_REDIRECT_URI` | — | backend callback, e.g. `https://api.your-domain.com/auth/google/callback` |
| `WEB_ORIGIN` | first `CORS_ORIGIN` | where to redirect after Google login, e.g. `https://tendril.your-domain.com` |
| `WALLET_ENCRYPTION_KEY` | — | **required when Google auth enabled** — `openssl rand -base64 32` |
| `ADMIN_EMAILS` | — | optional — comma-separated Google emails allowed into admin portal |
| `ADMIN_WEB_ORIGIN` | `http://localhost:5174` | admin SPA origin (OAuth handoff + CORS) |
| `ADMIN_GOOGLE_REDIRECT_URI` | — | admin OAuth callback, e.g. `https://api.your-domain.com/admin/auth/google/callback` |
| `GAS_GRANT_MICRO_ALGOS` | `260000` | ALGO (microAlgos) sent per accepted gas request (0.26 ALGO) |
| `CORS_ORIGIN` | `*` | set to your web origin(s), comma-separated; include admin origin |
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

### 3b. Web app (Next.js)

The main app at **https://tendrilhq.com** is a Next.js app. Set public browser configuration
(`NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_ALGORAND_NETWORK`, and optional overrides) **at build time**.
Documentation is built and deployed separately from
`docs-web/`, not rendered by this app.

```bash
NEXT_PUBLIC_REGISTRY_URL=https://api.your-tendril-domain.com npm run build -w web
# output: web/.next  → deploy with `npm run start -w web` or Vercel
```

**Vercel / Node host:**
- Build command: `npm install && npm run build -w web`
- Framework preset: Next.js
- Env var: `NEXT_PUBLIC_REGISTRY_URL = https://api.your-tendril-domain.com`
- Start command on a Node host: `npm run start -w web`

For Vercel projects with **Root Directory = `web`**, use `npm run build` and deploy the Next.js
output. Enable **Include source files outside of the Root Directory** for the shared workspace.
`web/next.config.ts` owns the `/x402` API proxy and permanent redirects. `web/vercel.json`
pins Vercel to Next.js output (`.next`) so an old Vite `dist` setting cannot be reused:

- `/docs` and `/docs/` → `https://docs.tendrilhq.com`
- `/docs/<path>` → `https://docs.tendrilhq.com/docs/<path>`
- `/api` → `https://docs.tendrilhq.com/docs/api`

Queries pass through those redirects; browsers preserve URL fragments. A client-side redirect also
handles legacy Docs paths. All documentation links in the main app point to `docs.tendrilhq.com`.

> **Mixed content:** if the site is served over HTTPS, the registry **must** also be HTTPS/WSS,
> or browsers will block the API + socket calls.

### 3b1. Documentation app (separate Next.js app)

Create a **second hosting project** from this repository for **https://docs.tendrilhq.com**.
Do not attach that domain to the main app's deployment.

```bash
npm install
npm run build -w docs-web
# output: docs-web/.next
```

Docs is an independent Next.js + React app. It imports repository Markdown from `docs/`, including
the existing API and MCP references. It has no wallet provider, payment client, registry polling,
or backend requirement. `NEXT_PUBLIC_REGISTRY_URL` is optional and only changes the base URL displayed
in examples (default `https://tendrilregister.007575.xyz`).

**Vercel settings for the Docs project:**

| Setting | Value |
|---|---|
| Root Directory | `docs-web` |
| Include source files outside of the Root Directory | **Enabled** — Markdown lives in sibling `docs/` |
| Framework | Next.js |
| Install command | `npm install` (npm workspaces) |
| Build command | `npm run build` |
| Output Directory | Next.js default (`.next`) |
| Custom domain | `docs.tendrilhq.com` |

Next.js serves deep links and metadata directly. Use a Node/Next host or Vercel; do not apply a
static SPA rewrite to `index.html`. `docs-web/vercel.json` pins Vercel output to `.next`.

The Docs homepage lives at `https://docs.tendrilhq.com/`; `/docs` is a compatibility redirect
to that homepage. Dedicated section routes retain the `/docs` prefix, for example:

- `https://docs.tendrilhq.com/docs/start/architecture-flow#request-flow`
- `https://docs.tendrilhq.com/docs/build`
- `https://docs.tendrilhq.com/docs/api`

Old query links such as `/docs?tab=build` and `/docs?doc=x402`, plus legacy section fragments,
resolve to the corresponding dedicated pages. Docs **Launch App** links to
`https://tendrilhq.com/explore`; the Docs brand links to `https://tendrilhq.com`.

Deploy the Docs project and attach its domain before publishing the main app's Docs redirects.
Domain DNS and TLS are configured in the respective hosting projects.

**Local development and checks:**

```bash
npm run docs                       # http://localhost:5175/
npm run typecheck -w docs-web
npm exec -w docs-web -- playwright install chromium
npm run test -w docs-web           # starts Docs and main-app dev servers
```

### 3b2. Admin app (Next.js)

Separate Next.js app for `admin.tendrilhq.com` — Google sign-in with an email allowlist (`ADMIN_EMAILS`).
Admins review one-time ALGO gas grants for Google custodial users.

```bash
NEXT_PUBLIC_REGISTRY_URL=https://api.your-tendril-domain.com npm run build -w admin
# output: admin/.next  → deploy with `npm run start -w admin` or Vercel
```

**Google Cloud Console:** register a second OAuth redirect URI:
`https://api.your-tendril-domain.com/admin/auth/google/callback`

Backend env (in addition to Google OAuth vars):

| Var | Example |
|---|---|
| `ADMIN_EMAILS` | `you@tendrilhq.com` |
| `ADMIN_WEB_ORIGIN` | `https://admin.tendrilhq.com` |
| `ADMIN_GOOGLE_REDIRECT_URI` | `https://api…/admin/auth/google/callback` |
| `GAS_GRANT_MICRO_ALGOS` | `260000` (0.26 ALGO) |
| `CORS_ORIGIN` | `https://tendrilhq.com,https://admin.tendrilhq.com` |

`PLATFORM_PRIVATE_KEY` must hold enough ALGO for gas grants (plus txn fees) in addition to USDC for withdrawals.

**Vercel / Node host:**
- Build command: `npm install && npm run build -w admin`
- Framework preset: Next.js
- Env var: `NEXT_PUBLIC_REGISTRY_URL = https://api.your-tendril-domain.com`
- Start command on a Node host: `npm run start -w admin`

`admin/vercel.json` pins Vercel output to `.next`.

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
- [ ] Google OAuth (if enabled): `GOOGLE_*` + `WALLET_ENCRYPTION_KEY` set; redirect URI registered in Google Cloud Console (user **and** admin callback if using admin portal).
- [ ] Admin portal (if enabled): `ADMIN_EMAILS`, `ADMIN_WEB_ORIGIN`, `ADMIN_GOOGLE_REDIRECT_URI`; `CORS_ORIGIN` includes admin origin; platform wallet funded with ALGO for gas grants.
- [ ] Registry + web both HTTPS (avoid mixed-content blocking); WebSocket upgrades proxied.
- [ ] Algod (`ALGOD_TESTNET_URL`) reachable from the registry host (top-ups + withdrawals) and clients.
- [ ] `PLATFORM_PAYTO` **opted into** `X402_ASSET_ID` — payments to an address that has not opted in fail.
- [ ] `X402_NETWORK` matches the facilitator's `/supported` byte for byte; `METER_INTERVAL_MS` reviewed.
- [ ] `NEXT_PUBLIC_REGISTRY_URL` + `NEXT_PUBLIC_ALGOD_URL` baked into the web build.
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
