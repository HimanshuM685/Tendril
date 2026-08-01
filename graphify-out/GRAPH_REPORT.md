# Graph Report - .  (2026-08-01)

## Corpus Check
- 48 files · ~52,863 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 611 nodes · 1052 edges · 40 communities (35 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.83)
- Token cost: 83,801 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web UI Components|Web UI Components]]
- [[_COMMUNITY_Contributor Docker Sandbox|Contributor Docker Sandbox]]
- [[_COMMUNITY_Backend Auth & Routing|Backend Auth & Routing]]
- [[_COMMUNITY_Backend Bootstrap & Config|Backend Bootstrap & Config]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Lease Lifecycle & Billing|Lease Lifecycle & Billing]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_Buyer x402 Dependencies|Buyer x402 Dependencies]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Monorepo Scripts|Monorepo Scripts]]
- [[_COMMUNITY_Autonomous Buyer Agent|Autonomous Buyer Agent]]
- [[_COMMUNITY_Shared TypeScript Base Config|Shared TypeScript Base Config]]
- [[_COMMUNITY_Metrics Leaderboards UI|Metrics Leaderboards UI]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Pricing & Credit Self-Checks|Pricing & Credit Self-Checks]]
- [[_COMMUNITY_Deployment Topology|Deployment Topology]]
- [[_COMMUNITY_Top-Up & Payment Schemas|Top-Up & Payment Schemas]]
- [[_COMMUNITY_Flat Routes & Settle Ordering|Flat Routes & Settle Ordering]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Contributor TypeScript Config|Contributor TypeScript Config]]
- [[_COMMUNITY_Buyer TypeScript Config|Buyer TypeScript Config]]
- [[_COMMUNITY_Hash Hero Animation|Hash Hero Animation]]
- [[_COMMUNITY_x402 Protocol & Bazaar Listing|x402 Protocol & Bazaar Listing]]
- [[_COMMUNITY_Sandbox Trust Boundary|Sandbox Trust Boundary]]
- [[_COMMUNITY_Metered Rent & State Model|Metered Rent & State Model]]
- [[_COMMUNITY_Wallet Signing Queue|Wallet Signing Queue]]
- [[_COMMUNITY_Custodial Ledger & Payer Identity|Custodial Ledger & Payer Identity]]
- [[_COMMUNITY_Shared TypeScript Config|Shared TypeScript Config]]
- [[_COMMUNITY_Hero Artwork Motifs|Hero Artwork Motifs]]
- [[_COMMUNITY_Architecture & Docs Pages|Architecture & Docs Pages]]
- [[_COMMUNITY_Web Registry URL Config|Web Registry URL Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Prepaid Watchdog & Refund|Prepaid Watchdog & Refund]]
- [[_COMMUNITY_Brand Identity|Brand Identity]]
- [[_COMMUNITY_CORS & Payable Route Policy|CORS & Payable Route Policy]]
- [[_COMMUNITY_Key Generation|Key Generation]]
- [[_COMMUNITY_Sandbox Entrypoint|Sandbox Entrypoint]]
- [[_COMMUNITY_Vercel Rewrites|Vercel Rewrites]]

## God Nodes (most connected - your core abstractions)
1. `config` - 17 edges
2. `formatUsdc()` - 16 edges
3. `compilerOptions` - 15 edges
4. `topUp()` - 14 edges
5. `compilerOptions` - 13 edges
6. `apiError()` - 13 edges
7. `formatUsdcExact()` - 12 edges
8. `Fetch` - 11 edges
9. `SignTransactions` - 11 edges
10. `q()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Prepaid balance, charge-once model` --conceptually_related_to--> `x402 V2 exact scheme, AVM mechanism`  [AMBIGUOUS]
  README.md → docs/x402-api.md
- `In-memory nodes and leases` --semantically_similar_to--> `No node reservation held during the 402 round trip`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Custodial off-chain ledger in Neon` --semantically_similar_to--> `Payer identity read off the settled transaction`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Top-up replay idempotency` --semantically_similar_to--> `payoutBlocked (payout address not opted into ASA)`  [INFERRED] [semantically similar]
  docs/x402-api.md → DEPLOY.md
- `fetchNonce()` --calls--> `Fetch`  [INFERRED]
  contributor/src/index.ts → example-buyer/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **x402 402-pay-verify-work-settle round trip** — docs_x402_api_payment_required, docs_x402_api_payment_payload, docs_x402_api_verify_work_settle, docs_x402_api_settle_response, docs_x402_api_facilitator, docs_x402_api_fee_sponsorship [EXTRACTED 1.00]
- **Independently deployable Tendril components** — deploy_backend_deployment, deploy_web_static_spa, deploy_contributor_agent_deployment, deploy_autonomous_consumer_agent [EXTRACTED 1.00]
- **Lease lifecycle: rent, run, watchdog, close, payout** — docs_x402_api_post_x402_rent_nodeid, docs_x402_api_post_lease_run, docs_x402_api_delete_x402_leases, readme_watchdog, readme_prepaid_balance_model, deploy_meter_interval_ms [INFERRED 0.85]

## Communities (40 total, 5 thin omitted)

### Community 0 - "Web UI Components"
Cohesion: 0.06
Nodes (61): About(), BalanceChart(), Contribute(), AlgoStat(), Dashboard(), ExplorerLink(), Props, short() (+53 more)

### Community 1 - "Contributor Docker Sandbox"
Cohesion: 0.05
Nodes (60): main(), containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint (+52 more)

### Community 2 - "Backend Auth & Routing"
Cohesion: 0.08
Nodes (51): addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces (+43 more)

### Community 3 - "Backend Bootstrap & Config"
Cohesion: 0.07
Nodes (35): main(), algod, Props, Pt, config, net, repoRoot, cumulativeByDay() (+27 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+21 more)

### Community 5 - "Web Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, algosdk, @blockshake/defly-connect, lute-connect, @perawallet/connect, react, react-dom, react-router-dom (+20 more)

### Community 6 - "Lease Lifecycle & Billing"
Cohesion: 0.12
Nodes (25): recordPayout(), Lease, proratedCost(), SandboxAccess, abandonLease(), activateLease(), closeLease(), createLease() (+17 more)

### Community 7 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 8 - "Buyer x402 Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 9 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 10 - "Monorepo Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 11 - "Autonomous Buyer Agent"
Cohesion: 0.18
Nodes (14): main(), LEASE_SECONDS, LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), repoRoot, request() (+6 more)

### Community 12 - "Shared TypeScript Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 13 - "Metrics Leaderboards UI"
Cohesion: 0.20
Nodes (5): BoardTab, Metrics(), MetricPoint, Metrics, RankRow

### Community 14 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 15 - "Pricing & Credit Self-Checks"
Cohesion: 0.22
Nodes (9): anon, mainnet, quote, rate, signedIn, testnet, applicableCredit(), atomicPerHour() (+1 more)

### Community 16 - "Deployment Topology"
Cohesion: 0.31
Nodes (9): Autonomous consumer agent deployment, Web app static SPA deployment, Backend / registry service, Contributor agent daemon, example-buyer autonomous training agent, @tendril/shared types and pricing helpers, Vite chosen over Next.js for the web app, Web app (Vite + React + use-wallet) (+1 more)

### Community 17 - "Top-Up & Payment Schemas"
Cohesion: 0.22
Nodes (9): payoutBlocked (payout address not opted into ASA), Atomic amounts as integer strings, Error envelope and the two shapes of 402, Sponsored fees via extra.feePayer, GET /explorer, PaymentRequired schema, PaymentRequirements schema, POST /topup (+1 more)

### Community 18 - "Flat Routes & Settle Ordering"
Cohesion: 0.22
Nodes (9): X402_NETWORK must match facilitator /supported, x402 facilitator (verify / settle / sponsor), GET /lease/:id, Lease token, POST /lease/:id/run, POST /rent/:nodeId (flat price), Verify, then work, then settle ordering, Flat rent price independent of hourly rate (+1 more)

### Community 19 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 20 - "Contributor TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 21 - "Buyer TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 22 - "Hash Hero Animation"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 23 - "x402 Protocol & Bazaar Listing"
Cohesion: 0.29
Nodes (7): Algod endpoint (ALGOD_TESTNET_URL), Backend / registry deployment (Docker, PaaS, VPS), WebSocket upgrade proxying requirement, x402 V2 exact scheme, AVM mechanism, Tendril prepaid compute marketplace, Bazaar listing metadata (title is the service name only), og:image must be an absolute HTTPS URL

### Community 24 - "Sandbox Trust Boundary"
Cohesion: 0.33
Nodes (7): Contributor agent deployment (per contributor machine), tendril-ssh-sandbox image (bore built from source), TUNNEL_MODE (bore | local), SandboxAccess schema, bore tunnel SSH exposure, Ephemeral Docker container as the trust boundary, Per-lease SSH password = wallet address

### Community 25 - "Metered Rent & State Model"
Cohesion: 0.29
Nodes (7): Neon Postgres money store (DATABASE_URL), Single registry instance owns hub + state, No node reservation held during the 402 round trip, ?payer= hint and the MIN_PAYABLE_ATOMIC discount floor, POST /x402/rent/:nodeId (metered), Wallet session token, In-memory nodes and leases

### Community 26 - "Wallet Signing Queue"
Cohesion: 0.33
Nodes (5): main(), serialize(), SignTransactions, walletQueue, Wallet

### Community 27 - "Custodial Ledger & Payer Identity"
Cohesion: 0.33
Nodes (6): Platform custodial account (PLATFORM_PAYTO / PLATFORM_PRIVATE_KEY), GET /platform, Payer identity read off the settled transaction, PaymentPayload schema, SettleResponse schema, Custodial off-chain ledger in Neon

### Community 28 - "Shared TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 29 - "Hero Artwork Motifs"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 32 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 33 - "Prepaid Watchdog & Refund"
Cohesion: 0.50
Nodes (4): METER_INTERVAL_MS watchdog tick, DELETE /x402/leases/:id (early close + refund), Prepaid balance, charge-once model, Lease watchdog

### Community 34 - "Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 35 - "CORS & Payable Route Policy"
Cohesion: 0.67
Nodes (3): Payment headers in Access-Control-Expose-Headers, CORS-free payable routes, x402 is the only door to payable endpoints

## Ambiguous Edges - Review These
- `Prepaid balance, charge-once model` → `x402 V2 exact scheme, AVM mechanism`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **230 isolated node(s):** `NonceEntry`, `nonces`, `extends`, `rootDir`, `outDir` (+225 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Prepaid balance, charge-once model` and `x402 V2 exact scheme, AVM mechanism`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `formatUsdc()` connect `Web UI Components` to `Contributor Docker Sandbox`, `Backend Auth & Routing`, `Backend Bootstrap & Config`, `Metrics Leaderboards UI`, `Pricing & Credit Self-Checks`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `config` connect `Backend Bootstrap & Config` to `Contributor Docker Sandbox`, `Backend Auth & Routing`, `Lease Lifecycle & Billing`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Web UI Components` to `Contributor Docker Sandbox`, `Backend Bootstrap & Config`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `NonceEntry`, `nonces`, `extends` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05823293172690763 - nodes in this community are weakly interconnected._
- **Should `Contributor Docker Sandbox` be split into smaller, more focused modules?**
  _Cohesion score 0.0504828797190518 - nodes in this community are weakly interconnected._