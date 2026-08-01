# Graph Report - .  (2026-08-01)

## Corpus Check
- 6 files · ~53,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 628 nodes · 1092 edges · 44 communities (37 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.83)
- Token cost: 60,000 input · 1,264 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web UI Components|Web UI Components]]
- [[_COMMUNITY_Contributor Docker Runtime|Contributor Docker Runtime]]
- [[_COMMUNITY_Agent Rules & Deploy Concepts|Agent Rules & Deploy Concepts]]
- [[_COMMUNITY_Lease Lifecycle & Billing|Lease Lifecycle & Billing]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Web Wallet Dependencies|Web Wallet Dependencies]]
- [[_COMMUNITY_x402 Paywall & Discovery|x402 Paywall & Discovery]]
- [[_COMMUNITY_x402 Protocol Semantics|x402 Protocol Semantics]]
- [[_COMMUNITY_Auth Tokens & Nonces|Auth Tokens & Nonces]]
- [[_COMMUNITY_Postgres Ledger & Isolation|Postgres Ledger & Isolation]]
- [[_COMMUNITY_Metrics UI & Shared DTOs|Metrics UI & Shared DTOs]]
- [[_COMMUNITY_Contributor Package Config|Contributor Package Config]]
- [[_COMMUNITY_Buyer Package Config|Buyer Package Config]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Server Bootstrap & CORS|Server Bootstrap & CORS]]
- [[_COMMUNITY_Web x402 Client|Web x402 Client]]
- [[_COMMUNITY_Monorepo Root Scripts|Monorepo Root Scripts]]
- [[_COMMUNITY_Autonomous Buyer Agent|Autonomous Buyer Agent]]
- [[_COMMUNITY_Shared TS Base Config|Shared TS Base Config]]
- [[_COMMUNITY_Web API Client|Web API Client]]
- [[_COMMUNITY_Network Config & Wallet Signing|Network Config & Wallet Signing]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Money Math Self-Check|Money Math Self-Check]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Discovery Self-Check|Discovery Self-Check]]
- [[_COMMUNITY_Wallet Queue Self-Check|Wallet Queue Self-Check]]
- [[_COMMUNITY_Deployment Prerequisites|Deployment Prerequisites]]
- [[_COMMUNITY_Network Switch & App Entry|Network Switch & App Entry]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Contribute Page|Contribute Page]]
- [[_COMMUNITY_Hero Illustration Art|Hero Illustration Art]]
- [[_COMMUNITY_Buyer Config|Buyer Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Brand Identity|Brand Identity]]
- [[_COMMUNITY_Payment Payload Schemas|Payment Payload Schemas]]
- [[_COMMUNITY_Platform Keygen|Platform Keygen]]
- [[_COMMUNITY_SPA Deployment|SPA Deployment]]
- [[_COMMUNITY_Sandbox Entrypoint|Sandbox Entrypoint]]
- [[_COMMUNITY_Vercel SPA Rewrites|Vercel SPA Rewrites]]
- [[_COMMUNITY_Single-Instance Registry|Single-Instance Registry]]
- [[_COMMUNITY_CORS Payment Headers|CORS Payment Headers]]

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
- `Top-up replay idempotency` --semantically_similar_to--> `payoutBlocked (payout address not opted into ASA)`  [INFERRED] [semantically similar]
  docs/x402-api.md → DEPLOY.md
- `fetchNonce()` --calls--> `Fetch`  [INFERRED]
  contributor/src/index.ts → example-buyer/src/index.ts
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `topUp()` --calls--> `usdToAtomic()`  [INFERRED]
  web/src/wallet.ts → shared/src/index.ts
- `SandboxAccess schema` --shares_data_with--> `bore Tunnel`  [INFERRED]
  docs/x402-api.md → README.md

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Lease money flow: 402 quote → verify → provision → settle → payout/refund** — readme_x402, readme_facilitator, readme_settlement_ordering, readme_prepaid_block, readme_credit_ledger, readme_contributor_payout [EXTRACTED 1.00]
- **Ephemeral sandbox isolation stack** — readme_trust_model, readme_ssh_sandbox, readme_bore_tunnel, readme_contributor, readme_watchdog [EXTRACTED 1.00]
- **One-switch network isolation (chain config + ledger separation)** — readme_network_switch, readme_per_network_schemas, readme_neon_postgres, readme_usdc_pricing [EXTRACTED 1.00]

## Communities (44 total, 7 thin omitted)

### Community 0 - "Web UI Components"
Cohesion: 0.06
Nodes (43): About(), ArchDiagram(), BalanceChart(), Props, Pt, AlgoStat(), Dashboard(), ExplorerLink() (+35 more)

### Community 1 - "Contributor Docker Runtime"
Cohesion: 0.08
Nodes (38): main(), containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint (+30 more)

### Community 2 - "Agent Rules & Deploy Concepts"
Cohesion: 0.10
Nodes (40): AGENTS.md (caveman rule), Caveman Response Style Convention, .clinerules/caveman.md, Autonomous consumer agent deployment, Contributor agent deployment (per contributor machine), METER_INTERVAL_MS watchdog tick, tendril-ssh-sandbox image (bore built from source), TUNNEL_MODE (bore | local) (+32 more)

### Community 3 - "Lease Lifecycle & Billing"
Cohesion: 0.09
Nodes (29): recordPayout(), isOnline(), Lease, proratedCost(), SandboxAccess, abandonLease(), activateLease(), closeLease() (+21 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+21 more)

### Community 5 - "Web Wallet Dependencies"
Cohesion: 0.07
Nodes (28): dependencies, algosdk, @blockshake/defly-connect, lute-connect, @perawallet/connect, react, react-dom, react-router-dom (+20 more)

### Community 6 - "x402 Paywall & Discovery"
Cohesion: 0.19
Nodes (23): q(), topUp(), RouteDiscovery, ServiceMetadata, PaidRequest, requirePayment(), asset, challenge() (+15 more)

### Community 7 - "x402 Protocol Semantics"
Cohesion: 0.08
Nodes (25): payoutBlocked (payout address not opted into ASA), X402_NETWORK must match facilitator /supported, Atomic amounts as integer strings, DELETE /x402/leases/:id (early close + refund), Error envelope and the two shapes of 402, x402 facilitator (verify / settle / sponsor), Sponsored fees via extra.feePayer, GET /explorer (+17 more)

### Community 8 - "Auth Tokens & Nonces"
Cohesion: 0.12
Nodes (20): addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces (+12 more)

### Community 9 - "Postgres Ledger & Isolation"
Cohesion: 0.13
Nodes (17): cumulativeByDay(), metrics(), pool, Row, [{ n }], otherAfter, otherBefore, [{ s }] (+9 more)

### Community 10 - "Metrics UI & Shared DTOs"
Cohesion: 0.11
Nodes (14): BoardTab, Metrics(), AlgorandNetwork, AssetInfo, Job, LeaseBilling, MetricPoint, Metrics (+6 more)

### Community 11 - "Contributor Package Config"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 12 - "Buyer Package Config"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 13 - "Web TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 14 - "Server Bootstrap & CORS"
Cohesion: 0.19
Nodes (13): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+5 more)

### Community 15 - "Web x402 Client"
Cohesion: 0.17
Nodes (12): payingFetch(), PayStage, serialize(), walletQueue, PaymentReceipt, WalletLoginResponse, WalletNonceResponse, X402TopUpResponse (+4 more)

### Community 16 - "Monorepo Root Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 17 - "Autonomous Buyer Agent"
Cohesion: 0.18
Nodes (14): main(), ExplorerNode, LEASE_SECONDS, LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), repoRoot (+6 more)

### Community 18 - "Shared TS Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 19 - "Web API Client"
Cohesion: 0.35
Nodes (12): apiError(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes(), fetchPlatform(), fetchWallet(), releaseLease() (+4 more)

### Community 20 - "Network Config & Wallet Signing"
Cohesion: 0.25
Nodes (7): algod, config, net, repoRoot, decodeSigned(), noteText(), verifyLoginSignature()

### Community 21 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 22 - "Money Math Self-Check"
Cohesion: 0.22
Nodes (9): anon, mainnet, quote, rate, signedIn, testnet, applicableCredit(), atomicPerHour() (+1 more)

### Community 23 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 24 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 25 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 26 - "Discovery Self-Check"
Cohesion: 0.29
Nodes (7): discoveryExtensions(), discovered, otherNode, payloadFor(), rent, service, topup

### Community 27 - "Wallet Queue Self-Check"
Cohesion: 0.33
Nodes (5): main(), serialize(), SignTransactions, walletQueue, Wallet

### Community 28 - "Deployment Prerequisites"
Cohesion: 0.33
Nodes (6): Algod endpoint (ALGOD_TESTNET_URL), Backend / registry deployment (Docker, PaaS, VPS), Neon Postgres money store (DATABASE_URL), Platform custodial account (PLATFORM_PAYTO / PLATFORM_PRIVATE_KEY), WebSocket upgrade proxying requirement, GET /platform

### Community 29 - "Network Switch & App Entry"
Cohesion: 0.40
Nodes (4): network, App(), NetworkDefaults, walletManager

### Community 30 - "Workspace TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 31 - "Contribute Page"
Cohesion: 0.50
Nodes (3): Contribute(), writeClipboard(), ComputeNode

### Community 32 - "Hero Illustration Art"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 34 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 35 - "Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 36 - "Payment Payload Schemas"
Cohesion: 0.67
Nodes (3): Payer identity read off the settled transaction, PaymentPayload schema, SettleResponse schema

## Ambiguous Edges - Review These
- `Caveman Response Style Convention` → `Tendril`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **239 isolated node(s):** `NonceEntry`, `nonces`, `extends`, `rootDir`, `outDir` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Caveman Response Style Convention` and `Tendril`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `formatUsdc()` connect `Web UI Components` to `Auth Tokens & Nonces`, `Metrics UI & Shared DTOs`, `Money Math Self-Check`, `x402 Paywall & Discovery`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `config` connect `Network Config & Wallet Signing` to `Contributor Docker Runtime`, `Lease Lifecycle & Billing`, `x402 Paywall & Discovery`, `Auth Tokens & Nonces`, `Postgres Ledger & Isolation`, `Server Bootstrap & CORS`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Web UI Components` to `Postgres Ledger & Isolation`, `Metrics UI & Shared DTOs`, `Web API Client`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `NonceEntry`, `nonces`, `extends` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.062003968253968256 - nodes in this community are weakly interconnected._
- **Should `Contributor Docker Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._