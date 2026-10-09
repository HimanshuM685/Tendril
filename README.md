# 🌿 Tendril

**A pay-per-call compute marketplace for individual contributors — x402 over USDC on Algorand.**

Tendril is a lean, agent-first take on Akash / io.net, but for *individuals* instead of data
centers. Anyone can rent out their PC's CPU/RAM/GPU. A human (or an autonomous AI agent) pays for
what it wants over **x402** — an HTTP 402 names an exact price in **USDC**, the client signs, and the
backend does the thing. Renting starts a **metered SSH session** — click once, the clock runs, and
only the seconds you actually used are billed when you release. The contributor **earns USDC** on
every closed lease, minus a small platform fee, and **withdraws that balance to their wallet**
whenever they like.

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
 │  (nodes/leases   │            │ POST /x402/rent         │    │ autonomous agent    │
 │   in memory)     │            │ watchdog + earnings    │    └────────────────────┘
 └──────────────────┘            └──────────┬─────────────┘   both are x402 clients
        │ bore tunnel (SSH)        ┌─────────┴────────┬──────────────┐
        ▼                          │                  │              │
  sandboxed SSH shell     Neon (Postgres)      x402 facilitator   Algorand
                    credits·payments·charges  (verify/settle,   (contributor
                    ·earnings·withdrawals    sponsors fees)    withdrawals)
```

| Folder | What it is |
|---|---|
| `backend/` | **The backend.** Express + **Neon (Postgres)** + socket.io. In-memory node registry, free `/explorer`, the flat-price `POST /x402/rent` and `POST /x402/run`, the metered `POST /x402/topup`, and the early-close `DELETE /x402/leases/:id`, a **watchdog** that ends a lease when its prepaid time runs out, contributor **API keys**, and the **earnings balance + `POST /withdraw`** that pays contributors on-chain. Only money state hits the DB. |
| `contributor/` | **The contributor script.** The daemon a contributor runs. Authenticates with an API key minted in the web app (no wallet key on the machine), heartbeats, and on a lease spins up a hardened Docker **SSH** sandbox that exposes itself over a **bore** tunnel — torn down when the lease ends. |
| `web/` | **The website.** Next.js + React + `@txnlab/use-wallet` — connect a wallet (Pera/Lute/Defly). **Explore** (browse + rent + copyable **SSH** connect command + balance countdown), a **wallet panel** (balance + top-up + history), and **Contribute**. |
| `docs-web/` | **The documentation website.** Independently deployable Next.js + React app at [docs.tendrilhq.com](https://docs.tendrilhq.com). Dedicated pages, searchable navigation, per-page anchors, and responsive architecture diagrams; content comes from `docs/`. |
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
charge. The contributor is credited out of what was collected, minus `PLATFORM_FEE_PCT`, and
withdraws that balance on-chain in one transfer ($5 minimum) rather than one per lease.
Signing in still exists, but its job has shrunk to reading your balance.

Or skip renting entirely: `POST /x402/run` takes Python source or a Python notebook and runs it in
a throwaway sandbox. No lease to open, choose or release. Script execution can overdraw credit;
notebook jobs stop at their prepaid execution budget. A negative balance blocks further runs until
it is topped back up.

### Notebook jobs

Upload an nbformat 4 `.ipynb` in Explore, or send `{ "notebook": <notebook>, "lane": "contributor" }`
to `POST /x402/run`. Use `"priority"` for Modal's 2-vCPU/4-GiB CPU sandbox, or `"e2b"` for an E2B cloud sandbox (needs `E2B_API_KEY`; pick 1–8 vCPU and 1–8 GiB with `"e2b": {"vCpu": 4, "memGiB": 8}`, priced per size). All lanes use a real
IPython kernel: `%pip`, `!commands`, cell magics, top-level `await`, plots, and process pools work.
Bundled images include NumPy, pandas, matplotlib, SciPy, scikit-learn, Pillow, requests, and psutil.
Custom contributor images must supply `nbclient`, `nbformat`, `ipykernel`, and workload dependencies.

- Upload: **1.5 MB**, **500 cells**, Python only. Syntax errors stop before earlier cells execute;
  source is never silently repaired. Runtime errors preserve earlier cell output when available.
- Execution: `RUN_TIMEOUT_MS` (default **120 seconds**, maximum **15 minutes**), additionally capped
  by prepaid credit. One notebook per payer; release existing sessions first. Failed executed jobs
  still consume billable time.
- Results: **2 MB** cell output, **4 MB total** artifacts, **12 MB** transport. Save small files in
  `/work`; hidden files, symlinks, and special files are not returned. Oversized artifacts are skipped.
- `POST` settles the gate fee before provisioning and returns `jobId`/`jobToken`. Poll
  `GET /x402/run/:id` with `Authorization: Bearer <jobToken>` until `run` or `error` is present.
  Terminal status can appear before billing/result collection finishes. The gate fee remains paid
  if provisioning fails; execution charges begin only when the sandbox is ready.
- Results are in-memory: download promptly. Retained for up to one hour, subject to oldest-first
  eviction at 32 jobs or 64 MB total; restart or eviction makes old job tokens return `404`.

Contributor one-shot sandboxes have no SSH/bore tunnel, no host mounts, no added capabilities,
a read-only image, and bounded writable `/work`/`/tmp`. `%pip` installs into a disposable venv.
Registry and contributor agents must both be updated; bundled sandbox image tags include a content
hash and rebuild after Dockerfile changes. Explicit custom images need rebuilding by their operator.

Try [the training QA notebook](example-buyer/notebooks/tendril_qa_training.ipynb) for offline training,
checkpoint resume, plots, artifacts, and opt-in failure/limit cases. Its configuration cell selects the QA mode;
the default `smoke` mode is upload-ready. The final Markdown cell includes an end-to-end QA checklist.
For compute-focused checks, use [the bounded benchmark](example-buyer/notebooks/tendril_benchmark.ipynb).
Local execution tests:

```bash
docker build -t tendril-notebook-test contributor/sandbox-ssh
TENDRIL_NOTEBOOK_TEST_IMAGE=tendril-notebook-test npx tsx --test backend/src/providers/notebookRunner.test.ts backend/src/runLimits.test.ts backend/src/leases.lifecycle.test.ts contributor/tests/docker.test.ts
```

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
| `POST /x402/rent` | `FLAT_RENT_ATOMIC` (0.01 USDC) gate fee | opens a **metered** session — container up, SSH + lease token returned, then billed by the second from credit |
| `POST /x402/run` | `FLAT_RUN_ATOMIC` (0.01 USDC) + the seconds it takes | **one job, no lease needed** — Tendril picks the best-value idle machine, runs your code in a throwaway sandbox, returns stdout, and bills the execution time from credit |

**Free.**

| Endpoint | Price | Notes |
|---|---|---|
| `DELETE /x402/leases/:id` | free | Stops the meter and bills the seconds actually used. |

Renting buys **no fixed block**. The gate fee starts the clock; the session then runs for as long as
your credit covers the node's hourly rate, and only the seconds you actually used are billed when you
release. Top up mid-session and the cut-off moves out. Nobody is disconnected at the end of a block
they guessed wrong.

Wallet popups, end to end: top up = 1, rent = 1, each job execution = 1, release/SSH = 0.

API reference: **[docs/api.md](docs/api.md)** (plain HTTP), **[docs/x402-api.md](docs/x402-api.md)**
(paid endpoints), **[docs/mcp.md](docs/mcp.md)** (agent MCP tools). Browse dedicated pages at
**[Tendril Docs](https://docs.tendrilhq.com)**. Run `npm run docs` for the local Docs app;
build all browser apps with `npm run build:apps`. Separate domain deployment settings
are in [DEPLOY.md](./DEPLOY.md#3b1-documentation-app-separate-nextjs-app).

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
cp web/.env.example web/.env.local
cp docs-web/.env.example docs-web/.env.local
cp admin/.env.example admin/.env.local
```

```bash
# 1. Backend / registry                          # http://localhost:4000
#    needs DATABASE_URL (Neon) + PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY set in .env
npm run backend                 # …or:  cd backend     && npm run dev

# 2. Contributor agent — mint an API key in the web app (CONTRIBUTE → MINT API KEY) first.
#    No wallet key on this machine: the key names the wallet that earns for the node.
TENDRIL_API_KEY=<key> PRICE_PER_HOUR_USD=1.0 npm run contributor   # …or:  cd contributor && npm run dev
#   tip: the SSH sandbox image builds locally on the FIRST rent, then is cached.
#        that build compiles `bore` from source for your CPU arch (~30s), so the
#        tunnel works on both x86_64 and arm64 (bore ships no arm64-linux binary).
#   tip: same machine as the consumer? add TUNNEL_MODE=local

# 3a. Web UI                                      # http://localhost:5173
npm run web                     # connect (wallet or email) → Sign in → Top up → Rent → ssh

# 3b. Documentation UI                            # http://localhost:5175
npm run docs

# 3c. Admin UI                                    # http://localhost:5174
#     requires ADMIN_EMAILS + Google OAuth config on backend
npm run admin

# 3d. …or the autonomous agent (its own funded key — signs in, tops up, rents)
AVM_PRIVATE_KEY=<buyer-key> npm run client       # …or:  cd example-buyer && npm run start
```

Each top-level folder is a self-contained piece you can `cd` into: **`backend/`**, **`contributor/`**,
**`web/`**, **`docs-web/`**, **`admin/`**, **`example-buyer/`**, with **`shared/`** holding the types they all import.

## Run with Docker

Each piece is its own Compose service, run independently. The backend usually lives on a server; a
contributor runs on each machine sharing compute and needs only a **`TENDRIL_API_KEY`** in `.env`
(`REGISTRY_URL` only when self-hosting). The **web app is not dockerized** (it runs as a Next.js app — see [Web app](#web-app-nextjs) below).

```bash
cp .env.example .env                     # then set REGISTRY_URL to your backend

docker compose up --build backend        # run the backend / registry  → :4000
docker compose up --build contributor    # share THIS machine's compute
docker compose run  --rm   buyer         # one-shot autonomous buyer
```

> Use `docker-compose` (with the hyphen) if you're on Compose **v1** — `docker compose` is v2.

The contributor **doesn't run a Docker of its own**: it mounts the host Docker socket and launches
each rented sandbox as a sibling container on the host daemon, so there's nothing extra to install
or start. Just set `TENDRIL_API_KEY` in `.env` (plus `REGISTRY_URL` if the backend isn't the hosted
one, e.g. `http://YOUR_SERVER_IP:4000`) and bring it up.
The first rent then builds the SSH sandbox image on the host (compiles `bore` for the host arch,
~30s) and caches it — later rents are instant.

- **backend** keeps only money state in **Neon** (`DATABASE_URL`) — no local volume; set
  `PLATFORM_PAYTO` + `PLATFORM_PRIVATE_KEY` too.
- **contributor** needs no inbound ports in the default `TUNNEL_MODE=bore` — each SSH sandbox dials
  *out* over bore. `network_mode: host` is only needed for `TUNNEL_MODE=local` (same-machine SSH),
  and on Docker Desktop (**Mac/Windows**) host networking doesn't share the loopback, so for local
  mode run the **contributor natively** (`npm run contributor`) instead.

### Web app (Next.js)

The web app isn't a container — run its Next.js server or deploy to Vercel:

```bash
NEXT_PUBLIC_REGISTRY_URL=http://your-host:4000 npm run build -w web   # → web/.next
# Build web, docs, and admin together:
npm run build:apps
```

Deploy `web/.next` with `npm run start -w web` on a Node host or use Vercel (full steps in [DEPLOY.md](./DEPLOY.md)).

## Configuration

All Node services read the repo-root `.env` (and each app's own `.env`, which overrides it);
inline `FOO=bar npm run …` overrides both. Browser apps read public `NEXT_PUBLIC_*` values from
their `.env.local` files. See [`.env.example`](./.env.example), [`web/.env.example`](./web/.env.example),
[`docs-web/.env.example`](./docs-web/.env.example), [`admin/.env.example`](./admin/.env.example),
and the env tables in [DEPLOY.md](./DEPLOY.md) for every variable.

### Testnet / mainnet

One switch picks the chain:

```bash
ALGORAND_NETWORK=testnet        # backend, contributor, buyer
NEXT_PUBLIC_ALGORAND_NETWORK=testnet   # web/.env.local — set it at BUILD time
```

Frontend configuration is app-local:

| App | Example file | Main values |
|---|---|---|
| Web | `web/.env.local` | `NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_ALGORAND_NETWORK`, `NEXT_PUBLIC_ALGOD_URL`, `NEXT_PUBLIC_EXPLORER_URL` |
| Docs | `docs-web/.env.local` | `NEXT_PUBLIC_REGISTRY_URL` for URLs shown in examples |
| Admin | `admin/.env.local` | `NEXT_PUBLIC_REGISTRY_URL`, `NEXT_PUBLIC_EXPLORER_URL` |

`NEXT_PUBLIC_*` values are browser-visible and embedded by Next.js at build time. Never put private
keys, database credentials, or admin secrets in these files.

Everything chain-specific derives from it — the CAIP-2 id every payment must be on, the algod
endpoint, the USDC asset id (`10458941` testnet / `31566704` mainnet) and the block explorer — so
the pieces can't be left half-migrated. Each still has its own override (`ALGOD_URL`,
`X402_ASSET_ID`, `NEXT_PUBLIC_EXPLORER_URL`) for a private node or a non-USDC ASA. An unrecognised value
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
a little ALGO for withdrawal fees, that your facilitator's `/supported` advertises the mainnet CAIP-2
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
   release. On a testnet explorer, confirm the top-up; in Neon, the single `testnet.charges` row
   (with the billed seconds) and the `testnet.payouts` row that credited the contributor. Then hit
   **WITHDRAW** on the contributor's wallet and confirm that transfer on-chain.

## What's verified vs. what needs your machine

Compiles + builds clean (full `npm run typecheck`, web production build). Requires your environment
to run end-to-end: a **Neon** database (`DATABASE_URL`), a **platform account** (`PLATFORM_PAYTO` +
`PLATFORM_PRIVATE_KEY`), the Docker sandbox lifecycle (a running Docker daemon), outbound network for
the bore tunnel, an SSH client, a reachable **x402 facilitator** (`X402_FACILITATOR_URL`) to verify
and settle payments, and Algod for asset opt-in checks + contributor withdrawals (funded testnet
accounts holding USDC).

## Notes & limitations

- **Custodial model:** payments pool at one platform address and credit is an off-chain ledger in
  Neon, in a schema per network (`testnet.*` / `mainnet.*`). Every payment is recorded by `txid`
  (idempotent — replaying one can't credit twice).
  Contributor earnings are **credited to a balance** on lease end, post-fee, and cashed out on-chain
  by `POST /withdraw` — one transfer per withdrawal rather than one per lease, with a **$5 minimum**
  (`MIN_WITHDRAW_ATOMIC`) so fees never outweigh what moves. Withdrawing needs
  `PLATFORM_PRIVATE_KEY` and an address opted into the asset; earning needs neither.
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
 - `web/` uses a Next.js client shell for wallet operations. Wallet-only code remains browser-bound,
  while Next.js owns deployment, route handling, metadata, and asset delivery.
