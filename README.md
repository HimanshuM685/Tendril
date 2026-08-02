# 🌿 Tendril

**A pay-per-call compute marketplace for individual contributors — x402 over USDC on Algorand.**

Tendril is a lean, agent-first take on Akash / io.net, but for *individuals* instead of data
centers. Anyone can rent out their PC's CPU/RAM/GPU. A human (or an autonomous AI agent) pays for
what it wants over **x402** — an HTTP 402 names an exact price in **USDC**, the client signs, and the
backend does the thing. Renting starts a **metered SSH session** — click once, the clock runs, and
only the seconds you actually used are billed when you release. The contributor is **paid on-chain in USDC**
when the lease ends, minus a small platform fee.

Because the facilitator sponsors the network fee, **a client needs USDC and zero ALGO** — and
because payment *is* the identity, a brand-new address can pay on its very first request with no
sign-up and no sign-in.

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

Renting opens an **open-ended metered session**. It ends when you release it, or when your credit can
no longer pay for the next second — and only then is the time you used billed, from credit, in one
charge. The contributor is paid on-chain in USDC out of what was collected, minus `PLATFORM_FEE_PCT`.
Signing in still exists, but its job has shrunk to reading your balance.

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
| `POST /rent/:nodeId` | `FLAT_RENT_ATOMIC` (0.01 USDC) gate fee | opens a **metered** session — container up, SSH + lease token returned, then billed by the second from credit |
| `POST /lease/:id/run` | `FLAT_RUN_ATOMIC` (0.01 USDC) | one job execution — payload shipped to the contributor, output returned |

**Free.**

| Endpoint | Price | Notes |
|---|---|---|
| `DELETE /x402/leases/:id` | free | Stops the meter and bills the seconds actually used. |

Renting buys **no fixed block**. The gate fee starts the clock; the session then runs for as long as
your credit covers the node's hourly rate, and only the seconds you actually used are billed when you
release. Top up mid-session and the cut-off moves out. Nobody is disconnected at the end of a block
they guessed wrong.

Wallet popups, end to end: top up = 1, rent = 1, each job execution = 1, release/SSH = 0.

API reference: **[docs/api.md](docs/api.md)** for the plain HTTP endpoints (with `curl` for
each), **[docs/x402-api.md](docs/x402-api.md)** for the three paid ones — every status code,
error string, and a CLI-only renting walkthrough.

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
- **Algorand testnet** accounts holding **USDC** (ASA `10458941`). Opt in, then use the
  [asset dispenser](https://asset-dispenser.testnet.algorand.network/). A little
  [ALGO](https://bank.testnet.algorand.network/) is needed *only* to opt in — the facilitator pays
  transaction fees after that. `PLATFORM_PAYTO` must be opted in too, or payments to it fail.

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

### Testnet / mainnet

One switch picks the chain:

```bash
ALGORAND_NETWORK=testnet        # backend, contributor, buyer
VITE_ALGORAND_NETWORK=testnet   # web — Vite inlines it, so set it at BUILD time
```

Everything chain-specific derives from it — the CAIP-2 id every payment must be on, the algod
endpoint, the USDC asset id (`10458941` testnet / `31566704` mainnet) and the block explorer — so
the pieces can't be left half-migrated. Each still has its own override (`ALGOD_URL`,
`X402_ASSET_ID`, `VITE_EXPLORER_URL`) for a private node or a non-USDC ASA. An unrecognised value
throws at boot rather than defaulting: silently running testnet while you believe you configured
mainnet is worse than not starting.

**The two ledgers never mix.** One database, one Postgres schema per network — tables live in
`testnet.*` or `mainnet.*`, and the connection's `search_path` points at the right one, so every
query in the process resolves to that network's tables and testnet play money can never be read as
a mainnet balance. Both schemas are created at boot; switching networks starts from an empty ledger
rather than inheriting the other's rows.

> Because of this, `public` holds **no** tables. A SQL console (Neon's included) defaults to
> `public`, so `SELECT * FROM credits` will say the relation does not exist — qualify it as
> `SELECT * FROM testnet.credits`, or switch the console's schema.

Before switching to mainnet, check that `PLATFORM_PAYTO` has opted into **mainnet** USDC and holds
a little ALGO for payout fees, that your facilitator's `/supported` advertises the mainnet CAIP-2
id (if it doesn't, every payment fails to verify), and that node prices are what you want to charge
in real dollars.

### Being findable (Bazaar discovery)

Settling payments and being *discoverable* are separate systems — an endpoint can settle perfectly
and still never appear in the [GoPlausible](https://facilitator.goplausible.xyz) Bazaar or on the
leaderboard. A settlement is only proof that an address paid an amount; it carries no method, no
input shape, no example output, so there is nothing in it to build a catalog entry from.

Tendril declares that metadata in every 402, and any v2 client copies it onto the payment payload
automatically. Set these so the listing is right:

```bash
PUBLIC_BASE_URL=https://api.your-domain.com   # REQUIRED behind a proxy — see below
X402_TAG=x402-global-challenge                # how the facilitator attributes activity
X402_SERVICE_NAME=TENDRIL
X402_ICON_URL=https://your-domain.com/logo.png
```

`PUBLIC_BASE_URL` is the one that bites: discovery canonicalises the catalog entry on that origin,
so leaving it unset behind a proxy catalogs you as `http://localhost:4000` — listed, but
unreachable.

Every payable route is declared in one place,
[`backend/src/x402/discovery.ts`](backend/src/x402/discovery.ts). **Adding an endpoint means adding
an entry there and passing it to `requirePayment` — that's the whole job.** An endpoint that skips
it still takes payments; it just stays invisible.

Discovery is triggered by a **settled payment**, so an endpoint nobody has paid yet is never
cataloged. That includes a rent covered entirely by existing credit, which settles nothing on
chain — pass `?credit=none` (the web UI exposes this as a checkbox) to pay on chain instead. To
check your listing, after at least one payment:

```bash
curl -s "https://facilitator.goplausible.xyz/discovery/resources?includeTestnets=true&limit=1000" \
  | jq '.items[] | select(.resourceUrl | contains("your-domain"))'
```

## Demo script (the money shot)

1. Start the **registry** and one **contributor** (a real machine sharing CPU/RAM).
2. Show the node appear in **Explore** at `http://localhost:5173`.
3. **Human path:** connect Pera (testnet) → **Top up** (one wallet approval, any amount) → watch
   the credit appear → click **Rent**. With enough credit that's **zero popups**; without, one 402
   and one approval. A copyable **`ssh root@… -p …`** command appears (password = your wallet
   address) with a countdown to `paidUntil`. `ssh` in. **Release** refunds the unused time as credit
   and destroys the sandbox.
4. **Autonomous path:** run `npm run client` and narrate the logs — **no sign-in anywhere**. The
   agent tops up over x402, rents the cheapest node, runs a tiny training loop *on someone else's
   machine*, prints the falling loss, then releases and shows the refund landing back as credit.
5. Show `docker ps` during the lease (a hardened, mount-less container) and that it's **gone** after
   release. On a testnet explorer, confirm the top-up *and* the **payout to the contributor**; in
   Neon, the single `testnet.charges` row (with the billed seconds) and the `testnet.payouts` row.

## What's verified vs. what needs your machine

Compiles + builds clean (full `npm run typecheck`, web production build). Requires your environment
to run end-to-end: a **Neon** database (`DATABASE_URL`), a **platform account** (`PLATFORM_PAYTO` +
`PLATFORM_PRIVATE_KEY`), the Docker sandbox lifecycle (a running Docker daemon), outbound network for
the bore tunnel, an SSH client, a reachable **x402 facilitator** (`X402_FACILITATOR_URL`) to verify
and settle payments, and Algod for asset opt-in checks + contributor payouts (funded testnet
accounts holding USDC).

## Notes & limitations

- **Custodial model:** payments pool at one platform address and credit is an off-chain ledger in
  Neon, in a schema per network (`testnet.*` / `mainnet.*`). Every payment is recorded by `txid`
  (idempotent — replaying one can't credit twice).
  Contributor earnings **are** settled on-chain in USDC on lease end (needs `PLATFORM_PRIVATE_KEY`);
  if it's unset — or the payout address never opted into the asset — payouts are recorded as unpaid
  (`txid` null) instead, and the node is flagged `payoutBlocked`.
- **Billing:** nothing is charged for compute up front. A session is billed **once**, when it
  closes, for the seconds it actually ran (`elapsed/3600 × rate`), and the debit is clamped to the
  balance. A watchdog checks every `METER_INTERVAL_MS` whether credit has run out, so worst-case
  overrun is one tick — absorbed by the platform, never billed past what the renter holds.
- **Running dry doesn't cut you off mid-keystroke:** the watchdog re-reads the live balance first (a
  mid-session top-up extends the window), and if the credit really is gone it opens a grace window
  worth `GRACE_ATOMIC` (default 1.00 USDC) of runtime *at that lease's rate* to save work in, then
  destroys the sandbox. `GET /lease/:id` exposes it as `graceUntil`; topping up clears it.
- **Settlement ordering:** verify → do the work → settle. A sandbox that fails to start returns
  `503` with **nothing settled**, so a failed rent costs the caller nothing.
- **Nodes + leases are in-memory:** a registry restart drops live sessions (the sockets die anyway).
  This is what keeps the DB quiet — heartbeats and the watchdog never write to Postgres.
- **SSH auth** is a throwaway root container either way. Send `sshPubKey` in the rent body and it
  becomes the container's `authorized_keys` (`authMethod: "publickey"`) — the only option that works
  without a session, since there is no wallet address to use as a password. Otherwise it falls back
  to a per-lease password (your wallet address), which is fine for ephemeral compute but is a
  password, not a key.
- **Auth:** paying needs no account at all — the settled transaction's sender *is* the identity.
  A **session token** (minted after signing a login nonce) is only needed to *spend existing credit*.
  Unauthenticated callers can still hint `?payer=`, but the discount is floored at
  `MIN_PAYABLE_ATOMIC` so nobody can drain a stranger's balance.
- `web/` uses Vite (not Next.js) deliberately: the wallet stack is client-only, so an SPA
  avoids SSR/hydration friction.
