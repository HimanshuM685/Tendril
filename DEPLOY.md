# Tendril — Setup & Deployment

This covers full local setup, Algorand testnet account prep, and production deployment of each
component. For the project overview and the demo script, see [README.md](./README.md).

---

## 1. Prerequisites

| Tool | Why | Install |
|---|---|---|
| Node 20+ & npm | runs everything | https://nodejs.org |
| **Neon** Postgres | stores wallets, top-ups, charges, earnings, withdrawals, API keys (`DATABASE_URL`) — *not* nodes/leases | https://neon.tech (free tier) |
| Docker (daemon running) | OCI guest packaging or legacy execution | https://docs.docker.com |
| Native Linux/KVM, Firecracker/jailer, cgroup v2 | microVM contributor runtime | [runtime setup](docs/runtime.md) |
| Native Linux TLS/bore relay beside backend | per-lease contributor SSH/notebook transport | [relay setup](docs/runtime.md#platform-boretls-relay) |
| SSH client | renter access and agent readiness through the platform's TLS/bore relay | built into macOS/Linux/Windows |
| Algorand **testnet** accounts | platform (receives top-ups **+ pays contributors**), contributor, consumer (pays) | see below |

### Algorand testnet account prep

Payments are **USDC on Algorand** (testnet ASA `10458941`). Users top up through x402 at
`PLATFORM_PAYTO`; the facilitator settles the transfer and the backend credits the Neon ledger.
Lease close bills usage once and credits eligible contributor earnings, withdrawn later on-chain
(minimum `MIN_WITHDRAW_ATOMIC`, default 5 USDC). `payoutBlocked` skips earnings credit, not renter
billing. Every 402 payment still goes to `PLATFORM_PAYTO`.

- **Platform account (`PLATFORM_PAYTO` + `PLATFORM_PRIVATE_KEY`):** generate a key with
  `npm run keygen`; use its **Address** as `PLATFORM_PAYTO` and the key it prints as
  `PLATFORM_PRIVATE_KEY` (the registry signs contributor withdrawals with it). Fund it with enough
  ALGO for withdrawal fees, opt into USDC, and fund with USDC for payouts.
- **Consumer accounts:** opt into USDC and fund with testnet USDC. The facilitator sponsors
  payment fees, so ALGO is needed only for account setup/opt-in.
- **Contributor accounts:** opt into USDC before registering to receive earnings credit.

1. **Generate the platform key** (prints `Address` + `PLATFORM_PRIVATE_KEY`):
   ```bash
   npm run keygen
   ```
2. **Fund with testnet ALGO:** https://bank.testnet.algorand.network/ (paste the address).
3. Opt into ASA `10458941`, then get testnet USDC from https://asset-dispenser.testnet.algorand.network/.
4. Keep every private key secret. The base64 value is a 64-byte key (seed + public key).

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
npm run admin         # http://localhost:5174  (admin portal; needs ADMIN_EMAILS on backend)
npm run client        # the autonomous consumer agent (needs its own funded AVM_PRIVATE_KEY)
```

Tips:
- MicroVM startup builds the OCI image and cached rootfs before registration. Paid leases copy
  that template; they never export OCI. Legacy Docker builds its image on first use if absent.
- `TENDRIL_RUNTIME=auto` falls back to legacy Docker when Linux/KVM prerequisites are missing;
  explicit `firecracker` refuses startup. Explore defaults to microVM/KVM nodes.
- Contributor SSH/notebooks require the native TLS relay, including legacy Docker SSH.
  Full native contributor/backend/relay instructions: [docs/runtime.md](docs/runtime.md).
- Useful checks: `curl localhost:4000/health`, `curl localhost:4000/explorer`.

---

## 3. Production deployment

Three independently deployable pieces: **backend** (central registry service), **web** (static
site), **contributor** (runs on each contributor's own machine). The autonomous client runs anywhere.

### 3a. Backend / registry (central API)

Requirements: a long-running Node host with **WebSocket** support, a **Neon** Postgres database
(`DATABASE_URL`), outbound HTTPS to an **Algod** endpoint (to confirm top-ups **and send withdrawals**),
and (if the web app is HTTPS) **TLS**. Money state lives in Neon; nodes/leases are in-memory.
Contributor SSH/notebooks additionally require a native Linux relay beside the backend, protected
Unix IPC, wildcard DNS/TLS and root-owned relay cleanup metadata. Use Option C for this P1 topology.
Stock Docker/PaaS examples below support hosted-only compute; they do not provision the native relay.

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
| `SANDBOX_STOP_TIMEOUT_MS` | `30000` | Agent destruction acknowledgement deadline; failure retains reservation and frozen cutoff |
| `RELAY_SOCKET` | `/run/tendril-relay/control.sock` | Protected Unix IPC to native relay beside backend |
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

> **Mixed content:** if the site is served over HTTPS, the registry **must** also be HTTPS/WSS,
> or browsers will block the API + socket calls.

### 3b2. Admin app (static SPA)

Separate Vite build for `admin.tendrilhq.com` — Google sign-in with an email allowlist (`ADMIN_EMAILS`).
Admins review one-time ALGO gas grants for Google custodial users.

```bash
VITE_REGISTRY_URL=https://api.your-tendril-domain.com npm run build -w admin
# output: admin/dist  → upload to admin subdomain static host
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

**Vercel / Netlify / Cloudflare Pages:**
- Build command: `npm install && npm run build -w admin`
- Output directory: `admin/dist`
- Env var: `VITE_REGISTRY_URL = https://api.your-tendril-domain.com`

### 3c. Contributor agent (on each contributor's machine)

Each contributor runs the agent on the machine whose compute they share. The P1 microVM runtime
requires native Linux/root/KVM, matching Firecracker/jailer, a `-tendril` guest kernel, delegated
cgroup v2 and Docker for userspace packaging. Guest SSH/Jupyter dial out through per-lease TLS/bore;
no contributor inbound ports. Install the native systemd service using [docs/runtime.md](docs/runtime.md).

A contributor needs **no Algorand key**. They connect their wallet in the web app, sign in, open
**CONTRIBUTE** and mint an API key — that key identifies the node and names the wallet its earnings
go to. Contributors can clone the standalone
[TendrilContributor](https://github.com/) repo instead of the monorepo; it's the agent alone.

```bash
# on the contributor's machine
git clone <repo> tendril && cd tendril && npm install
TENDRIL_API_KEY=<key from the web app> \
REGISTRY_URL=https://api.your-tendril-domain.com \
TENDRIL_RUNTIME=firecracker NODE_LABEL="linux-cpu-box" PRICE_PER_HOUR_USD=2.0 \
  npm run contributor
```

Use `deploy/contributor/tendril-contributor.service` after configuring prerequisites and runtime paths.
The renter gets an `ssh root@<bore-host> -p <port>` command (password = the renter's wallet address).

Agent env vars: `TENDRIL_API_KEY` (required), `NODE_LABEL`, `PRICE_PER_HOUR_USD`, `SANDBOX_IMAGE`
(defaults to the locally-built `tendril-ssh-sandbox`), `SANDBOX_MEMORY`, `SANDBOX_CPUS`,
`TENDRIL_RUNTIME`, `GUEST_KERNEL`, `FIRECRACKER_BIN`, `JAILER_BIN`, `JAILER_UID`, `JAILER_GID`,
`TENDRIL_STATE_DIR` and `TENDRIL_CGROUP_PARENT`. Per-lease relay settings come from the backend.
P1 microVMs are CPU/Linux only. Compose contributor remains legacy Docker (SSH/Python), sharing
the host kernel; it still needs the platform relay for public SSH.

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
- [ ] `VITE_REGISTRY_URL` + `VITE_ALGOD_URL` baked into the web build.
- [ ] Native contributor preflight/cache succeeds; relay IPC, wildcard DNS and trusted TLS configured.
- [ ] Opt-in Linux/KVM harness passes separate-kernel and resource-removal gates.
- [ ] Consumer and contributor accounts opted into USDC; consumers hold USDC for top-ups.
- [ ] Safeguard `PLATFORM_PRIVATE_KEY` — it custodies user top-ups *and* signs every withdrawal.

## 5. Known limitations

- **Custodial:** top-ups pool at `PLATFORM_PAYTO` and balances are an off-chain ledger in Neon.
  Eligible contributor earnings accrue off-chain at lease end and settle only on withdrawal; there's no
  on-chain *renter* withdrawal path for unused balance yet.
- **Billing granularity:** usage is calculated continuously but **charged once**, at lease end,
  prorated at the hourly rate. The watchdog only checks balance exhaustion every `METER_INTERVAL_MS`,
  so worst-case over-use is one tick before teardown.
- **In-memory nodes/leases:** a registry restart drops live sessions (their sockets die too). This is
  deliberate — it keeps Postgres out of the heartbeat/watchdog hot path. For HA, persist + externalize.
- **SSH auth** accepts a renter public key or verified payer address as root password. Agent
  readiness uses its own key and verifies the guest host key before settlement.
- A node whose address has not opted into `X402_ASSET_ID` is `payoutBlocked`; its leases still
  charge the renter but skip earnings credit. Opt in and reconnect before opening new leases.
- A single registry instance owns the WebSocket hub *and* the in-memory state; for horizontal scale
  externalize both (e.g. a socket.io Redis adapter + shared store).
- Release freezes `endedAt` immediately. `stopping` retains reservation through guest/relay cleanup;
  `503 cleanup_pending` can be retried without extending billing or duplicating charge/earnings.
