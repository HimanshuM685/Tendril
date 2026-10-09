# Deploying Tendril

This guide walks you through running Tendril locally and putting it into production. For what
Tendril is and how to demo it, see [README.md](./README.md).

---

## The big picture

Tendril has six pieces. Only two of them live on your server.

| Piece | Where it runs | What it does |
|---|---|---|
| **Backend** (registry) | Your Linux server | The API. Handles sign-in, payments, billing, and keeps track of every contributor machine. |
| **Relay** | Same Linux server as the backend | Gives each rental its own public SSH address (and Jupyter URL), so renters can reach a contributor's machine without that machine opening any ports. |
| **Web app** | Vercel or any Node host | The website people use to rent and contribute (Next.js). |
| **Docs site** | Vercel or any Node host | Public documentation at docs.tendrilhq.com (Next.js). |
| **Admin app** | Vercel or any Node host | Small internal dashboard for approving gas grants (Next.js). |
| **Contributor agent** | Each contributor's own Linux machine | Boots a fresh Firecracker microVM for every rental and tears it down afterwards. |

How a rental reaches the renter:

```
 renter ── ssh ──▶ relay (your server) ◀── outbound tunnel ── microVM on contributor's machine
                     ▲
                     │ Unix socket: "open a tunnel for lease X" / "close it"
                   backend
```

The contributor's microVM always dials **out** to the relay, and the renter connects to the relay.
Nobody has to open inbound ports on a contributor's machine.

> **Why the backend and relay share a server:** they talk over a local Unix socket, and the backend
> reaches each notebook through a private network address that only exists on that host. If you run
> the backend on a PaaS or in a stock Docker container, everything still works *except* contributor
> SSH and notebooks.

---

## 1. What you need

| Thing | Why |
|---|---|
| Node 20+ and npm | Runs the backend, relay, and agents |
| A [Neon](https://neon.tech) Postgres database | Stores wallets, top-ups, charges, earnings, withdrawals, and API keys. Nodes and leases live in memory. |
| A Linux server (Ubuntu/Debian is easiest) | Hosts the backend and relay |
| A domain where you control DNS | The relay needs three wildcard subdomains (details below) |
| Algorand **testnet** accounts | One for the platform, plus test buyers and contributors |
| Docker | Builds the guest image on contributor machines |

### Algorand accounts

Payments are **USDC on Algorand** (testnet asset `10458941`).

How the money moves:

- Users top up over x402. The money lands in the platform account (`PLATFORM_PAYTO`), and the
  backend records the balance in Neon.
- When a rental ends, the backend charges the renter once for the time used. It credits the
  contributor's earnings minus the platform fee.
- Contributors withdraw their earnings on-chain. The minimum is 5 USDC by default
  (`MIN_WITHDRAW_ATOMIC`).

**Set up the platform account:**

1. Generate a key:
   ```bash
   npm run keygen
   ```
   It prints an **Address** and a **private key**. Use the address as `PLATFORM_PAYTO` and the key as
   `PLATFORM_PRIVATE_KEY`. The backend uses this key to sign contributor withdrawals.
2. Get testnet ALGO for transaction fees: https://bank.testnet.algorand.network/
3. Opt the account into asset `10458941`, then get testnet USDC from
   https://asset-dispenser.testnet.algorand.network/

**Buyers:** opt into USDC and hold some testnet USDC. The facilitator pays the network fees, so a
buyer only needs a little ALGO for the opt-in.

**Contributors:** opt into USDC to receive earnings. Without the opt-in, rentals still work, but the
contributor isn't credited.

Keep every private key secret. The platform key holds everyone's top-ups and signs every payout.

---

## 2. Run it locally

```bash
git clone <repo> tendril && cd tendril
npm install
cp .env.example .env      # fill in DATABASE_URL, PLATFORM_PAYTO, PLATFORM_PRIVATE_KEY
```

The root `.env` is shared by the backend, contributor, and example buyer. An app's own `.env`
overrides it, and `FOO=bar npm run ...` overrides both. The browser apps (web, docs, admin) read
public `NEXT_PUBLIC_*` values from their own `.env.local` files.

Start each piece in its own terminal:

```bash
npm run backend       # API on http://localhost:4000
npm run web           # website on http://localhost:5173
npm run docs          # documentation on http://localhost:5175
npm run admin         # admin dashboard on http://localhost:5174 (needs ADMIN_EMAILS)
npm run contributor   # contributor agent (needs TENDRIL_API_KEY)
npm run client        # autonomous buyer (needs its own funded AVM_PRIVATE_KEY)
```

Quick checks: `curl localhost:4000/health` and `curl localhost:4000/explorer`.

You can browse, top up, and run the hosted CPU locally. Renting a **contributor** machine over SSH
also needs the relay, which only runs on Linux (section 3b).

---

## 3. Production

### 3a. Backend

The recommended setup is a plain Linux server running the backend under systemd, with nginx in
front for HTTPS. This is the only setup that supports the relay.

**1. Install the code and create the service account.**

```bash
sudo useradd --system --create-home --home-dir /var/lib/tendril-backend --shell /usr/sbin/nologin tendril
sudo git clone <repo> /opt/tendril
cd /opt/tendril && sudo npm ci --omit=dev
```

**2. Write the config** to `/etc/tendril/backend.env`, readable only by root. The variables are
listed in [section 4](#4-backend-settings). The essentials:

```dotenv
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
PLATFORM_PAYTO=<platform address>
PLATFORM_PRIVATE_KEY=<platform key>
JWT_SECRET=<output of: openssl rand -hex 32>
CORS_ORIGIN=https://tendril.example.com,https://admin.example.com
RELAY_SOCKET=/run/tendril-relay/control.sock
```

```bash
sudo install -d -m 0755 /etc/tendril
sudo chmod 600 /etc/tendril/backend.env
```

**3. Create the systemd service** at `/etc/systemd/system/tendril-backend.service`:

```ini
[Unit]
Description=Tendril backend
After=network-online.target tendril-relay.service
Wants=network-online.target tendril-relay.service

[Service]
User=tendril
WorkingDirectory=/opt/tendril
EnvironmentFile=/etc/tendril/backend.env
ExecStart=/usr/bin/npm run start -w backend
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Don't start it yet. Set up the relay first (next section), so the backend finds the relay socket
when it boots.

**4. Put nginx in front** for HTTPS on `api.example.com`, and make sure WebSocket upgrades get
through:

```nginx
server {
    server_name api.example.com;
    listen 443 ssl;
    # ssl_certificate / ssl_certificate_key from certbot

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

<details>
<summary>Alternatives: Docker or PaaS (no contributor SSH)</summary>

These are fine if you only need the hosted CPU and payments. Neither can run the relay, so
contributor SSH and notebooks won't work.

**Docker:**
```bash
docker build -f backend/Dockerfile -t tendril-backend .
docker run -d --name tendril-backend -p 4000:4000 --env-file backend.env tendril-backend
```

**Railway / Render / Fly.io:** start command `npm run start -w backend` (no build step). Set the
env vars and make sure WebSockets are enabled.

</details>

### 3b. Relay

#### What it does

When someone rents a contributor's machine, the backend asks the relay for a tunnel. The relay
then:

1. starts a private [bore](https://github.com/ekzhang/bore) tunnel server just for that rental, in
   its own network namespace, with its own secret;
2. hands back a public address like `ssh root@a1b2c3.ssh.example.com -p 20417`;
3. tears it all down the moment the rental ends.

The contributor's microVM connects out to the relay over TLS (port 9443). The relay checks which
rental the connection belongs to from its hostname, and joins it to the renter's side. Jupyter
works the same way, over HTTPS at `https://<id>.lab.example.com`.

#### Step 1: DNS

Point three wildcard records at your server's public IP:

| Record | Used for |
|---|---|
| `*.control.example.com` | Tunnels coming in from contributor microVMs (TLS, port 9443) |
| `*.ssh.example.com` | Renters connecting over SSH (ports 20000–24999) |
| `*.lab.example.com` | Renters opening Jupyter in the browser (HTTPS) |

#### Step 2: TLS certificate

You need one certificate that covers `*.control.example.com` and `*.lab.example.com`. SSH needs
no certificate. Wildcards need a DNS challenge, so use the certbot plugin for your DNS provider.
Cloudflare example:

```bash
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/cloudflare.ini \
  -d '*.control.example.com' -d '*.lab.example.com' --cert-name relay \
  --deploy-hook 'systemctl restart tendril-relay'
```

This writes `/etc/letsencrypt/live/relay/fullchain.pem` and `privkey.pem`. The deploy hook restarts
the relay on renewal so it picks up the new certificate. A restart drops tunnels that are open at
that moment, so live rentals lose their connection briefly.

#### Step 3: Install bore and the system tools

```bash
sudo apt-get install -y iproute2 util-linux cargo
sudo cargo install bore-cli --version 0.5.1 --locked --root /usr/local   # → /usr/local/bin/bore
```

#### Step 4: Create the bore account

The relay itself runs as root, because it creates network namespaces. Each tunnel server, though,
runs as a separate unprivileged account:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin tendril-bore
id -u tendril-bore; id -g tendril-bore        # → RELAY_UID / RELAY_GID
getent group tendril | cut -d: -f3            # → RELAY_BACKEND_GID (the backend's group)
```

#### Step 5: Configure

```bash
sudo cp deploy/bore-relay/relay.env.example /etc/tendril/relay.env
sudo chmod 600 /etc/tendril/relay.env
sudo nano /etc/tendril/relay.env
```

Fill in your domains, the certificate paths, and the three IDs from step 4:

```dotenv
RELAY_SOCKET=/run/tendril-relay/control.sock
RELAY_STATE_DIR=/var/lib/tendril-relay
RELAY_CONTROL_DOMAIN=control.example.com
RELAY_SSH_DOMAIN=ssh.example.com
RELAY_NOTEBOOK_DOMAIN=lab.example.com
RELAY_CONTROL_PORT=9443
RELAY_HTTPS_PORT=8443          # see note below
RELAY_TLS_CERT=/etc/letsencrypt/live/relay/fullchain.pem
RELAY_TLS_KEY=/etc/letsencrypt/live/relay/privkey.pem
RELAY_UID=<id -u tendril-bore>
RELAY_GID=<id -g tendril-bore>
RELAY_BACKEND_GID=<gid of the tendril group>
RELAY_BORE_BIN=/usr/local/bin/bore
RELAY_BIND=0.0.0.0
```

> **Port 443 note:** the relay serves Jupyter on `RELAY_HTTPS_PORT`, which defaults to 443. If
> nginx already uses 443 for the API on the same IP, set it to `8443`; notebook links then include
> `:8443`. If the relay gets its own IP address, you can leave it at 443.

#### Step 6: Start the relay, then the backend

```bash
sudo cp deploy/bore-relay/tendril-relay.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tendril-relay
sudo systemctl enable --now tendril-backend
```

The relay creates `/run/tendril-relay/control.sock` and lets only root and the backend's group
use it. That socket is how the backend opens and closes tunnels. It's never exposed over the
network.

#### Step 7: Open the firewall

```bash
sudo ufw allow 443/tcp              # API (nginx)
sudo ufw allow 9443/tcp             # tunnels from contributor microVMs
sudo ufw allow 8443/tcp             # Jupyter (skip if RELAY_HTTPS_PORT=443)
sudo ufw allow 20000:24999/tcp      # renter SSH
```

Ports 25000–29999 are used for notebooks too, but only inside private namespaces on this host. Keep
them closed.

#### Step 8: Check it works

```bash
journalctl -u tendril-relay -n 20
# → [relay] ready (Unix IPC, TLS transport and Jupyter proxy)

echo '{"op":"inspect","leaseId":"test"}' | sudo -u tendril nc -U /run/tendril-relay/control.sock
# → {"ok":true,"value":{"exists":false}}     (proves the backend account can reach the relay)

curl https://api.example.com/health
```

Then rent a contributor machine from the website. You should get an
`ssh root@<id>.ssh.example.com -p <port>` command that connects. After you release the rental,
`ip netns` on the server shows no leftover `tnd-…` entries.

#### Day-to-day

- **Logs:** `journalctl -u tendril-relay -f` and `journalctl -u tendril-backend -f`
- **Restarting the relay** closes every open tunnel. On startup it cleans up anything left from
  before, so no stale tunnels pile up.
- **If the relay is down,** new rentals fail cleanly before anyone is charged. Rentals that are
  ending wait in `stopping` until the relay confirms cleanup, and billing stops at the moment of
  release either way.
- Deeper technical details are in [docs/runtime.md](docs/runtime.md#platform-boretls-relay).

### 3c. Web app

The website is a Next.js app. Set the API address **at build time**:

```bash
NEXT_PUBLIC_REGISTRY_URL=https://api.example.com npm run build -w web
npm run start -w web      # on a Node host; or deploy to Vercel
```

On Vercel:

- **Root Directory:** `web`, with **Include source files outside of the Root Directory** turned on
  (the app uses the shared workspace)
- **Framework:** Next.js, **build command** `npm run build`
- **Env vars:** `NEXT_PUBLIC_REGISTRY_URL=https://api.example.com` and
  `NEXT_PUBLIC_ALGORAND_NETWORK`

`web/next.config.ts` proxies `/x402` to the API and redirects `/docs/...` and `/api` to the docs
site. If the site uses HTTPS, the API must too. Otherwise browsers block the calls.

### 3c2. Docs site

The docs are a separate Next.js app, deployed as a **second project** on its own domain
(`docs.tendrilhq.com`). It reads the Markdown in `docs/` and needs no backend.

```bash
npm run build -w docs-web
```

On Vercel: Root Directory `docs-web`, **Include source files outside of the Root Directory** on
(the Markdown lives in `docs/`), framework Next.js, build command `npm run build`. Deploy it and
attach its domain before publishing the web app, since the web app redirects its old docs links
there. `NEXT_PUBLIC_REGISTRY_URL` is optional and only changes the API address shown in examples.

### 3d. Admin app

This is a separate Next.js app where admins approve one-time ALGO gas grants for Google sign-in
users. Access is limited to the emails in `ADMIN_EMAILS`.

```bash
NEXT_PUBLIC_REGISTRY_URL=https://api.example.com npm run build -w admin
npm run start -w admin    # on a Node host; or deploy to Vercel with Root Directory `admin`
```

In Google Cloud Console, add a second OAuth redirect URI:
`https://api.example.com/admin/auth/google/callback`

Backend settings for the admin app:

| Var | Example |
|---|---|
| `ADMIN_EMAILS` | `you@example.com` |
| `ADMIN_WEB_ORIGIN` | `https://admin.example.com` |
| `ADMIN_GOOGLE_REDIRECT_URI` | `https://api.example.com/admin/auth/google/callback` |
| `GAS_GRANT_MICRO_ALGOS` | `260000` (0.26 ALGO per grant) |
| `CORS_ORIGIN` | must include the admin origin |

The platform account also needs ALGO to cover these grants.

### 3e. Contributor agent

Contributors run the agent on their own Linux machine with KVM. They don't need an Algorand key.
They sign in on the website, open **Contribute**, and mint an API key. That key identifies the
machine and says which wallet gets paid.

The easiest route is the standalone **TendrilContributor** repo. It's just the agent, run with
Docker Compose:

```bash
git clone <TendrilContributor repo> && cd TendrilContributor
# one-time host prep (KVM, guest kernel, ip_forward): see its README
cp .env.example .env               # TENDRIL_API_KEY, NODE_LABEL, PRICE_PER_HOUR_USD
docker compose up -d --build
docker compose logs -f             # look for: runtime=microvm kvm=true
```

The agent stays online and runs no VMs while idle. Each rental boots one microVM, which is
destroyed when the rental ends. `docker compose down` stops everything cleanly.

You can run the same thing from this monorepo with `docker compose up -d contributor`. For a
systemd service instead of Compose, use `deploy/contributor/tendril-contributor.service`. Both are
covered in [docs/runtime.md](docs/runtime.md).

Common settings: `TENDRIL_API_KEY` (required), `NODE_LABEL`, `PRICE_PER_HOUR_USD`,
`SANDBOX_MEMORY`, `SANDBOX_CPUS`, `TENDRIL_RUNTIME`, `GUEST_KERNEL`, `JAILER_UID`, and `JAILER_GID`.
Tunnel addresses come from your backend and relay automatically. Contributors don't configure them.

### 3f. Autonomous buyer

The buyer runs anywhere with a funded key:

```bash
AVM_PRIVATE_KEY=<buyer key> REGISTRY_URL=https://api.example.com \
AGENT_MIN_RAM_MB=2048 AGENT_TOPUP_ATOMIC=500000 npm run client
```

It tops up over x402, rents the cheapest matching machine, runs its job, releases it, and reports
what it spent.

---

## 4. Backend settings

| Var | Default | What it's for |
|---|---|---|
| `REGISTRY_PORT` | `4000` | Port the API listens on |
| `DATABASE_URL` | — | **Required.** Neon connection string (keep `?sslmode=require`) |
| `PLATFORM_PAYTO` | — | **Required.** Platform address that receives top-ups |
| `PLATFORM_PRIVATE_KEY` | — | Key for `PLATFORM_PAYTO`. Signs withdrawals. Without it, earnings still add up but withdrawals return 503. |
| `PLATFORM_FEE_PCT` | `10` | Platform's cut of each charge |
| `JWT_SECRET` | dev value | **Set a strong one in production** |
| `CORS_ORIGIN` | `*` | Your web and admin origins, comma-separated |
| `RELAY_SOCKET` | `/run/tendril-relay/control.sock` | Where to find the relay |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Turn on Google sign-in |
| `GOOGLE_REDIRECT_URI` | — | e.g. `https://api.example.com/auth/google/callback` |
| `WEB_ORIGIN` | first `CORS_ORIGIN` | Where to send users after Google sign-in |
| `WALLET_ENCRYPTION_KEY` | — | **Required with Google sign-in.** `openssl rand -base64 32` |
| `ADMIN_EMAILS` | — | Who can use the admin app |
| `ADMIN_WEB_ORIGIN` | `http://localhost:5174` | Admin app address |
| `ADMIN_GOOGLE_REDIRECT_URI` | — | Admin Google callback |
| `GAS_GRANT_MICRO_ALGOS` | `260000` | ALGO sent per approved gas grant |
| `HEARTBEAT_TIMEOUT_MS` | `30000` | How long before a silent machine counts as offline |
| `X402_NETWORK` | testnet | Payment network. Must match the facilitator's `/supported` exactly. |
| `X402_ASSET_ID` | `10458941` | Payment asset (testnet USDC; mainnet is `31566704`) |
| `X402_FACILITATOR_URL` | `https://facilitator.goplausible.xyz` | Verifies and settles payments |
| `MIN_TOPUP_ATOMIC` / `MAX_TOPUP_ATOMIC` | `100000` / `1000000000` | Top-up limits (atomic units) |
| `MIN_PAYABLE_ATOMIC` | `10000` | Minimum on-chain payment for a rental without sign-in |
| `MIN_LEASE_SECONDS` / `MAX_LEASE_SECONDS` / `LEASE_SECONDS_GRANULARITY` | `60` / `14400` / `60` | Limits for prepaid blocks |
| `SANDBOX_READY_TIMEOUT_MS` | `45000` | How long to wait for a machine to come up. Nothing is charged if it times out. |
| `SANDBOX_STOP_TIMEOUT_MS` | `30000` | How long to wait for a machine and its tunnel to confirm cleanup |
| `METER_INTERVAL_MS` | `10000` | How often to check whether a renter's balance has run out |
| `ALGOD_TESTNET_URL` | `https://testnet-api.algonode.cloud` | Algorand node used for top-ups and withdrawals |

---

## 5. Go-live checklist

**Secrets and money**
- [ ] Strong `JWT_SECRET` set.
- [ ] `DATABASE_URL` points at Neon.
- [ ] `PLATFORM_PAYTO` and `PLATFORM_PRIVATE_KEY` belong to an account you control.
- [ ] Platform account is funded with ALGO and USDC, and opted into `X402_ASSET_ID`.
- [ ] `X402_NETWORK` matches the facilitator exactly.

**Web and API**
- [ ] `CORS_ORIGIN` lists only your real web and admin origins.
- [ ] Website, admin, and API all use HTTPS, and WebSocket upgrades pass through nginx.
- [ ] `NEXT_PUBLIC_REGISTRY_URL` is set on the web and admin builds; docs domain is live.
- [ ] Google sign-in (if used): `GOOGLE_*` and `WALLET_ENCRYPTION_KEY` set, with both redirect URIs
      registered.

**Relay**
- [ ] Relay is running, the wildcard DNS resolves, and the certificate covers `*.control` and `*.lab`.
- [ ] Firewall has ports 9443, 20000–24999 and the Jupyter port open.
- [ ] Certificate renewal restarts the relay.
- [ ] A real rental gives a working SSH command and cleans up after release.

**Contributors and buyers**
- [ ] At least one contributor shows `runtime=microvm kvm=true`.
- [ ] Buyer and contributor wallets are opted into USDC.

---

## 6. Known limitations

- **Custodial balances.** Top-ups pool in the platform account, and balances live in Neon. Renters
  can't withdraw unused balance on-chain yet.
- **One charge per rental.** Usage is charged once, when the rental ends. The balance check runs
  every `METER_INTERVAL_MS`, so a renter can overrun by up to one interval.
- **Memory-only sessions.** Restarting the backend drops live rentals. This keeps the database
  out of the hot path. Running more than one backend would need shared state (for example, a
  socket.io Redis adapter).
- **SSH login** uses the renter's public key, or their wallet address as the password.
- **Contributors without a USDC opt-in** can still serve rentals, but they aren't credited until
  they opt in and reconnect.
- **Release is final.** Clicking Release stops billing immediately, even if cleanup takes a few
  seconds. If cleanup is slow, the API returns `503 cleanup_pending`. Retrying is safe and never
  charges twice.
