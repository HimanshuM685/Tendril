# 🌿 Tendril

**A prepaid compute marketplace for individual contributors — metered in native ALGO on Algorand.**

Tendril is a lean, agent-first take on Akash / io.net, but for *individuals* instead of data
centers. Anyone can rent out their PC's CPU/RAM/GPU. A human (or an autonomous AI agent) **tops up a
prepaid ALGO balance once**, then rents a node and gets a sandboxed **SSH session** billed **by the
hour, prorated** — usage is tracked as it runs and **charged once when the lease ends** (or when the
balance is exhausted, which stops the session). The contributor is **paid on-chain** to their own
address when the lease ends, minus a small platform fee. No per-action signing, no x402.

## The trust model (why this is safe to contribute to)

A contributor gives *compute*, never filesystem or account access. The safety boundary isn't a
permissions system — it's an **ephemeral Docker container**:

- no host filesystem mounts (`-v` is never used),
- no inbound host ports — the sandbox dials *out* over a [bore](https://github.com/ekzhang/bore)
  tunnel for SSH (in local mode it publishes SSH only to `127.0.0.1`),
- nearly all Linux capabilities dropped (`--cap-drop ALL` + only the handful sshd needs to let a
  root password login in, `--security-opt no-new-privileges`),
- hard CPU / memory / PID caps (cgroups),
- **destroyed the moment the paid lease ends.**

This is the same containerization trade-off the entire DePIN compute sector already runs on —
Tendril just makes it prepaid and individual-scale.

## Architecture

```
   Contributor PC                Registry + API                 Consumer / Agent
 ┌──────────────────┐  WebSocket ┌────────────────────────┐    ┌────────────────────┐
 │ contributor agent│◄──────────►│ GET  /explorer   (free)│◄──►│ browser (Explore UI)│
 │  docker run ...  │            │ POST /x402/topup       │    │   or                │
 │  (nodes/leases   │            │ POST /x402/rent/:id    │    │ autonomous agent    │
 │   in memory)     │            │ watchdog + payout      │    └────────────────────┘
 └──────────────────┘            └──────────┬─────────────┘   both are x402 clients
        │ bore tunnel (SSH)        ┌─────────┴────────┬──────────────┐
        ▼                          │                  │              │
  sandboxed SSH shell     Neon (Postgres)      x402 facilitator   Algorand
                    credits·payments·charges  (verify/settle,   (contributor
                          ·payouts             sponsors fees)     payouts)
```

| Folder | What it is |
|---|---|
| `backend/` | **The backend.** Express + **Neon (Postgres)** + socket.io. In-memory node registry, free `/explorer`, the flat-price `POST /rent/:id`, `POST /lease/:id/run` and `POST /topup`, the metered `POST /x402/topup` and `POST /x402/rent/:id`, and the early-close `DELETE /x402/leases/:id`, a **watchdog** that ends a lease when its prepaid time runs out, and **on-chain USDC payout** to the contributor when the lease ends. Only money state hits the DB. |
| `contributor/` | **The contributor script.** The daemon a contributor runs. Proves node ownership by signing a nonce, heartbeats, and on a lease spins up a hardened Docker **SSH** sandbox that exposes itself over a **bore** tunnel — torn down when the lease ends. |
| `web/` | **The website.** Vite + React + `@txnlab/use-wallet` (Pera/Defly). **Explore** (browse + rent + copyable **SSH** connect command + balance countdown), a **wallet panel** (balance + top-up + history), and **Contribute**. |
| `example-buyer/` | A headless autonomous "training agent": tops up over x402 → discovers → rents → runs a script → releases, with zero clicks **and no sign-in** — the payment is the identity. |
| `shared/` | Shared types, the WebSocket contract, and pricing helpers — imported by all of the above as `@tendril/shared`. |

How money flows: **x402 is the only door.** An unpaid request to any payable endpoint gets back
HTTP 402 naming an exact amount in **USDC**; the client builds an Algorand atomic group (its own
asset transfer plus the facilitator's unsigned fee transaction), signs only its own, and retries. The
facilitator **verifies** the group by simulation, the backend **provisions**, and only then does the
facilitator **settle** it on-chain — so a sandbox that fails to come up costs the caller nothing. The
credit is keyed to the **sender of the settled transaction**, never to anything the client claims
about itself.

Nodes are priced in USD per hour (`PRICE_PER_HOUR_USD`). USDC is a dollar with 6 decimals, so
`PRICE_PER_HOUR_USD × 1e6` is the atomic rate — there is no exchange rate to set or keep current.
Because the facilitator sponsors the network fee, **a client needs USDC and zero ALGO**.

Renting buys a **prepaid block** of seconds. When the lease ends (early release, the block running
out, or the node going away) the unused time is **refunded as credit** and the contributor is paid
on-chain in USDC minus `PLATFORM_FEE_PCT`. That refund is what makes the next 402 for that address
smaller. Signing in still exists, but its job has shrunk to reading and spending an existing balance.

## The payable endpoints

`GET /explorer` is **free**, so an agent can survey live nodes (specs + price) and choose for itself.
Everything that costs money is x402: an unpaid request gets a 402 naming an exact USDC amount, the
client pays, the backend then does the ordinary thing.

**Any amount — top up.** `POST /topup?amount=<atomic>` (alias `POST /x402/topup`) credits whatever
you ask for: 4 USDC, 400, 609, anything between `MIN_TOPUP_ATOMIC` and `MAX_TOPUP_ATOMIC`. **No
auth** — a brand-new address can pay on its very first request, and the credit lands on the *paying*
address. On settlement the backend writes one `topups` row and raises that address's `credits`
balance by the same amount in a single transaction; the response returns both. Replaying the same
payment returns the original receipt and credits nothing twice. Omit `?amount=` to get
`DEFAULT_TOPUP_ATOMIC`.

**Flat price — "give me 0.01 USDC and I'll do the thing."** No quote, no credit arithmetic, no
session. 402, pay, done, normal flow underneath.

| Endpoint | Price | What you get |
|---|---|---|
| `POST /rent/:nodeId` | `FLAT_RENT_ATOMIC` (0.01 USDC) | `FLAT_RENT_SECONDS` of sandbox — lease created, container up, SSH + lease token returned |
| `POST /lease/:id/run` | `FLAT_RUN_ATOMIC` (0.01 USDC) | one job execution — payload shipped to the contributor, output returned |

**Metered — priced from the URL and your balance.**

| Endpoint | Price | Notes |
|---|---|---|
| `POST /x402/rent/:nodeId?seconds=<n>[&payer=<addr>]` | `ceil(seconds/3600 x rate)` minus your credit | Existing credit is applied first, so the 402 asks only for the remainder. Cover it all (signed in) and there is no 402 at all. |
| `DELETE /x402/leases/:id` | free | Closes early; unused time comes back as credit. |

The flat rent price is deliberately independent of the node's hourly rate — that is what makes it
flat. The contributor is paid a cut of what was actually paid, not of the list price, so money in and
money out stay equal either way.

Wallet popups, end to end: top up = 1, flat rent = 1, metered rent with enough credit = 0, metered
rent without = 1, each job execution = 1, and release/SSH = 0.

Full request/response reference, every status code and error string: **[docs/x402-api.md](docs/x402-api.md)**.

**The payable routes are CORS-free.** They answer any origin, so a browser anywhere can pay one —
the Tendril web app has no privileged access, and the frontend is just another x402 client.
`CORS_ORIGIN` still guards everything else (sign-in, `/wallet`, `/metrics`, `/explorer`, `/nodes`).
CORS only ever constrained browsers; a headless agent was never subject to it.


## Prerequisites

- Node 20+ and npm
- A **Neon** Postgres database (free at [neon.tech](https://neon.tech)) — its connection string is `DATABASE_URL`
- A **platform Algorand account** that receives top-ups *and* pays contributors: its address is
  `PLATFORM_PAYTO` and its 64-byte key is `PLATFORM_PRIVATE_KEY` (both from one `npm run keygen`)
- **Docker** (daemon running) — for the contributor agent's SSH sandboxes
- An **SSH client** to connect to a rented box (built into macOS/Linux/Windows). Public exposure uses
  an in-container **bore** tunnel — nothing to install on the contributor; or `TUNNEL_MODE=local`
  when consumer + agent share a machine
- **Algorand testnet** accounts funded with **ALGO** ([ALGO faucet](https://bank.testnet.algorand.network/)) —
  no USDC, no ASA opt-in

> **Full setup, account prep, and production deployment (registry / web / agent) live in
> [DEPLOY.md](./DEPLOY.md).** The quick start below is for local dev.

## Quick start

Install once at the root (it's one npm-workspaces monorepo), then run each piece in its own
terminal. Every command has a root shortcut **and** works from inside its own folder — use whichever
you prefer.

```bash
npm install
cp .env.example .env            # set DATABASE_URL (Neon), PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY — REQUIRED
```

```bash
# 1. Backend / registry                          # http://localhost:4000
#    needs DATABASE_URL (Neon) + PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY set in .env
npm run backend                 # …or:  cd backend     && npm run dev

# 2. Contributor agent — generate + fund a key first
npm run keygen                  # prints Address + AVM_PRIVATE_KEY  (cd contributor && npm run keygen)
AVM_PRIVATE_KEY=<key> PRICE_PER_HOUR_USD=1.0 npm run contributor   # …or:  cd contributor && npm run dev
#   tip: the SSH sandbox image builds locally on the FIRST rent, then is cached.
#        that build compiles `bore` from source for your CPU arch (~30s), so the
#        tunnel works on both x86_64 and arm64 (bore ships no arm64-linux binary).
#   tip: same machine as the consumer? add TUNNEL_MODE=local

# 3a. Web UI                                      # http://localhost:5173
cp web/.env.example web/.env    # set VITE_REGISTRY_URL (defaults to localhost:4000)
npm run web                     # connect Pera → Sign in → Top up → Rent → copy the ssh command

# 3b. …or the autonomous agent (its own funded key — signs in, tops up, rents)
AVM_PRIVATE_KEY=<buyer-key> npm run client       # …or:  cd example-buyer && npm run start
```

Each top-level folder is a self-contained piece you can `cd` into: **`backend/`**, **`contributor/`**,
**`web/`**, **`example-buyer/`**, with **`shared/`** holding the types they all import.

## Run with Docker

Each piece is its own Compose service, run independently. The backend usually lives on a server; a
contributor runs on each machine sharing compute and points at that backend via **`REGISTRY_URL`**
in `.env`. The **web app is not dockerized** (it's a static Vite SPA — see [Web app](#web-app-static-spa) below).

```bash
cp .env.example .env                     # then set REGISTRY_URL to your backend

docker compose up --build backend        # run the backend / registry  → :4000
docker compose up --build contributor    # share THIS machine's compute
docker compose run  --rm   buyer         # one-shot autonomous buyer
```

> Use `docker-compose` (with the hyphen) if you're on Compose **v1** — `docker compose` is v2.

The contributor **doesn't run a Docker of its own**: it mounts the host Docker socket and launches
each rented sandbox as a sibling container on the host daemon, so there's nothing extra to install
or start. Just set `REGISTRY_URL` in `.env` (e.g. `http://YOUR_SERVER_IP:4000`) and bring it up.
The first rent then builds the SSH sandbox image on the host (compiles `bore` for the host arch,
~30s) and caches it — later rents are instant.

- **backend** keeps only money state in **Neon** (`DATABASE_URL`) — no local volume; set
  `PLATFORM_PAYTO` + `PLATFORM_PRIVATE_KEY` too.
- **contributor** needs no inbound ports in the default `TUNNEL_MODE=bore` — each SSH sandbox dials
  *out* over bore. `network_mode: host` is only needed for `TUNNEL_MODE=local` (same-machine SSH),
  and on Docker Desktop (**Mac/Windows**) host networking doesn't share the loopback, so for local
  mode run the **contributor natively** (`npm run contributor`) instead.

### Web app (static SPA)

The web app isn't a container — it's a static build you host anywhere:

```bash
VITE_REGISTRY_URL=http://your-host:4000 npm run build -w web   # → web/dist
```

Drop `web/dist` on Vercel / Netlify / Cloudflare Pages / nginx (full steps in [DEPLOY.md](./DEPLOY.md)).

## Configuration

All Node services read the repo-root `.env` (and each app's own `.env`, which overrides it);
inline `FOO=bar npm run …` overrides both. The web app reads `web/.env` (`VITE_*` only, baked
in at build time). See [`.env.example`](./.env.example), [`web/.env.example`](./web/.env.example),
and the env tables in [DEPLOY.md](./DEPLOY.md) for every variable.

## Demo script (the money shot)

1. Start the **registry** and one **contributor** (a real machine sharing CPU/RAM).
2. Show the node appear in **Explore** at `http://localhost:5173`.
3. **Human path:** connect Pera (testnet) → **Sign in** → **Top up** (approve one ALGO deposit) →
   watch the balance appear → click **Rent** (no popup) → a copyable **`ssh root@… -p …`** command
   appears (password = your wallet address) with a balance-driven countdown. `ssh` in. **Release**
   (or letting the balance hit zero) bills the exact time used and destroys the sandbox.
4. **Autonomous path:** run `npm run client` and narrate the logs — the agent signs in, tops up if
   low, rents the cheapest node, runs a tiny training loop *on someone else's machine*, prints the
   falling loss, then releases and reports how much balance it drew down. No human clicked anything.
5. Show `docker ps` during the lease (a hardened, mount-less container) and that it's **gone** after
   release. On a testnet explorer, confirm the top-up *and* the **payout to the contributor**; in
   Neon, the single `charges` row (with the billed seconds) and the `payouts` row.

## What's verified vs. what needs your machine

Compiles + builds clean (full `npm run typecheck`, web production build). Requires your environment
to run end-to-end: a **Neon** database (`DATABASE_URL`), a **platform account** (`PLATFORM_PAYTO` +
`PLATFORM_PRIVATE_KEY`), the Docker sandbox lifecycle (a running Docker daemon), outbound network for
the bore tunnel, an SSH client, and Algod reachable to confirm top-ups + send payouts (funded testnet
accounts).

## Notes & limitations

- **Custodial model:** top-ups pool at one platform address and balances are an off-chain ledger in
  Neon. Top-ups are confirmed on-chain and recorded by `txid` (idempotent — a deposit can't credit
  twice). Contributor earnings **are** settled on-chain on lease end (needs `PLATFORM_PRIVATE_KEY`);
  if it's unset, payouts are recorded as unpaid (`txid` null) instead.
- **Billing:** usage is **calculated continuously but charged once**, at lease end, prorated at the
  hourly rate (`elapsed/3600 × rate`) — no per-tick debits. A watchdog only checks every
  `METER_INTERVAL_MS` whether the balance is exhausted, so worst-case over-use is one tick.
- **Nodes + leases are in-memory:** a registry restart drops live sessions (the sockets die anyway).
  This is what keeps the DB quiet — heartbeats and the watchdog never write to Postgres.
- **SSH auth is a per-lease password (your wallet address)** over a throwaway root container; fine for
  ephemeral compute, but it's a password, not a key — use a real key flow for anything sensitive.
- **Auth:** spending the balance (rent, top-up, wallet read) requires a wallet **session token**,
  minted only after the user signs a login nonce — so nobody can spend someone else's balance.
- `web/` uses Vite (not Next.js) deliberately: the wallet stack is client-only, so an SPA
  avoids SSR/hydration friction.
