# Graph Report - .  (2026-08-04)

## Corpus Check
- 31 files · ~69,464 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 652 nodes · 1135 edges · 43 communities (31 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 121,490 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend Dashboard & UI Components|Frontend Dashboard & UI Components]]
- [[_COMMUNITY_Lease Lifecycle & Node Registry|Lease Lifecycle & Node Registry]]
- [[_COMMUNITY_Contributor Sandbox & WS Protocol|Contributor Sandbox & WS Protocol]]
- [[_COMMUNITY_Project Docs & Design Rationale|Project Docs & Design Rationale]]
- [[_COMMUNITY_Wallet & x402 Payment Client|Wallet & x402 Payment Client]]
- [[_COMMUNITY_Database & Credit Ledger|Database & Credit Ledger]]
- [[_COMMUNITY_x402 Paywall & Facilitator|x402 Paywall & Facilitator]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Web Package Config|Web Package Config]]
- [[_COMMUNITY_Balance Display & USDC Formatting|Balance Display & USDC Formatting]]
- [[_COMMUNITY_Contributor Package Config|Contributor Package Config]]
- [[_COMMUNITY_Example Buyer Package Config|Example Buyer Package Config]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Backend App Bootstrap|Backend App Bootstrap]]
- [[_COMMUNITY_Monorepo Root Config|Monorepo Root Config]]
- [[_COMMUNITY_Shared TypeScript Base Config|Shared TypeScript Base Config]]
- [[_COMMUNITY_Example Buyer Agent Script|Example Buyer Agent Script]]
- [[_COMMUNITY_Auth Endpoints & Contributor Deploy|Auth Endpoints & Contributor Deploy]]
- [[_COMMUNITY_API Docs Renderer Component|API Docs Renderer Component]]
- [[_COMMUNITY_Shared Package Config|Shared Package Config]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Contributor TypeScript Config|Contributor TypeScript Config]]
- [[_COMMUNITY_Example Buyer TypeScript Config|Example Buyer TypeScript Config]]
- [[_COMMUNITY_x402 Client Tests|x402 Client Tests]]
- [[_COMMUNITY_Shared TypeScript Config|Shared TypeScript Config]]
- [[_COMMUNITY_Backend Wallet Signature Verification|Backend Wallet Signature Verification]]
- [[_COMMUNITY_Hero Illustration Concepts|Hero Illustration Concepts]]
- [[_COMMUNITY_Contributor Config Module|Contributor Config Module]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Favicon Brand Identity|Favicon Brand Identity]]
- [[_COMMUNITY_Contributor Keygen Script|Contributor Keygen Script]]
- [[_COMMUNITY_Sandbox SSH Entrypoint|Sandbox SSH Entrypoint]]
- [[_COMMUNITY_Bazaar Listing Metadata|Bazaar Listing Metadata]]
- [[_COMMUNITY_Vercel Rewrites Config|Vercel Rewrites Config]]
- [[_COMMUNITY_DELETE keys Endpoint|DELETE /keys Endpoint]]
- [[_COMMUNITY_GET health Endpoint|GET /health Endpoint]]
- [[_COMMUNITY_GET keys Endpoint|GET /keys Endpoint]]
- [[_COMMUNITY_GET metrics Endpoint|GET /metrics Endpoint]]
- [[_COMMUNITY_GET nodes Endpoint|GET /nodes Endpoint]]
- [[_COMMUNITY_GET platform Endpoint|GET /platform Endpoint]]
- [[_COMMUNITY_SPA Mount Point|SPA Mount Point]]

## God Nodes (most connected - your core abstractions)
1. `formatUsdc()` - 20 edges
2. `apiError()` - 17 edges
3. `compilerOptions` - 15 edges
4. `topUp()` - 14 edges
5. `Fetch` - 14 edges
6. `compilerOptions` - 13 edges
7. `runAnywhere()` - 13 edges
8. `WalletSummary` - 12 edges
9. `formatUsdcExact()` - 12 edges
10. `creditBalance()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Self-hosted BORE_SERVER/BORE_SECRET` --semantically_similar_to--> `Ephemeral Docker sandbox (trust model)`  [INFERRED] [semantically similar]
  DEPLOY.md → README.md
- `Watchdog (lease balance monitor)` --semantically_similar_to--> `Grace window (GRACE_ATOMIC)`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Open-ended metered session (bill once at close)` --semantically_similar_to--> `Verify → work → settle payment ordering`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Bazaar discovery (GoPlausible listing)` --semantically_similar_to--> `Production deployment checklist`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `Custodial balance model` --semantically_similar_to--> `Known limitations (custodial, billing granularity, in-memory state)`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **x402 verify→work→settle payment flow** — docs_x402_api_post_topup, docs_x402_api_post_rent, docs_x402_api_post_run, docs_x402_api_payment_flow [INFERRED 0.85]
- **Tendril monorepo workspaces** — readme_backend_folder, readme_contributor_folder, readme_web_folder, readme_example_buyer_folder, readme_shared_folder [EXTRACTED 1.00]
- **Tendril authentication credential model** — docs_api_auth_model, docs_api_get_wallet, docs_api_post_keys, docs_api_get_lease [EXTRACTED 1.00]

## Communities (43 total, 12 thin omitted)

### Community 0 - "Frontend Dashboard & UI Components"
Cohesion: 0.05
Nodes (54): About(), ArchDiagram(), Contribute(), Props, Dashboard(), ExplorerLink(), Props, short() (+46 more)

### Community 1 - "Lease Lifecycle & Node Registry"
Cohesion: 0.06
Nodes (63): addressFromSession(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), verifyLeaseToken(), verifyWalletNonce(), atomicPerHour() (+55 more)

### Community 2 - "Contributor Sandbox & WS Protocol"
Cohesion: 0.07
Nodes (44): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SANDBOX_CTX, SandboxEndpoint (+36 more)

### Community 3 - "Project Docs & Design Rationale"
Cohesion: 0.07
Nodes (41): AGENTS.md (caveman rule), Caveman Response Style Convention, .clinerules/caveman.md, Backend/registry production deployment, Autonomous consumer agent deployment, Known limitations (custodial, billing granularity, in-memory state), PLATFORM_PAYTO / PLATFORM_PRIVATE_KEY, Production deployment checklist (+33 more)

### Community 4 - "Wallet & x402 Payment Client"
Cohesion: 0.08
Nodes (24): config, repoRoot, PRESETS, Props, TopUpControl(), Props, network, payingFetch() (+16 more)

### Community 5 - "Database & Credit Ledger"
Cohesion: 0.10
Nodes (29): activeUsersByChange(), ActiveWindow, createApiKey(), cumulativeByChange(), hashKey(), listApiKeys(), metrics(), ownerOfApiKey() (+21 more)

### Community 6 - "x402 Paywall & Facilitator"
Cohesion: 0.14
Nodes (29): topUp(), discoveryExtensions(), RouteDiscovery, ServiceMetadata, discovered, payloadFor(), rent, run (+21 more)

### Community 7 - "Backend Package Config"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+21 more)

### Community 8 - "Web Package Config"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 9 - "Balance Display & USDC Formatting"
Cohesion: 0.16
Nodes (17): BalanceChart(), Props, Pt, AlgoStat(), Props, short(), WalletBar(), WalletPanel() (+9 more)

### Community 10 - "Contributor Package Config"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 11 - "Example Buyer Package Config"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 12 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 13 - "Backend App Bootstrap"
Cohesion: 0.19
Nodes (13): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+5 more)

### Community 14 - "Monorepo Root Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 15 - "Shared TypeScript Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 16 - "Example Buyer Agent Script"
Cohesion: 0.22
Nodes (12): main(), LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), repoRoot, request(), RunResponse (+4 more)

### Community 17 - "Auth Endpoints & Contributor Deploy"
Cohesion: 0.25
Nodes (11): Self-hosted BORE_SERVER/BORE_SECRET, Contributor agent deployment, Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, GET /lease/:id, GET /wallet, POST /keys (+3 more)

### Community 18 - "API Docs Renderer Component"
Cohesion: 0.20
Nodes (5): DocId, DOCS, Group, Heading, Section

### Community 19 - "Shared Package Config"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 20 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 21 - "Contributor TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 22 - "Example Buyer TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 23 - "x402 Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 24 - "Shared TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 25 - "Backend Wallet Signature Verification"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 26 - "Hero Illustration Concepts"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 28 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 29 - "Favicon Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

## Ambiguous Edges - Review These
- `Caveman Response Style Convention` → `Tendril`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **247 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+242 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Caveman Response Style Convention` and `Tendril`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `formatUsdc()` connect `Balance Display & USDC Formatting` to `Frontend Dashboard & UI Components`, `Lease Lifecycle & Node Registry`, `Contributor Sandbox & WS Protocol`, `Wallet & x402 Payment Client`, `x402 Paywall & Facilitator`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Frontend Dashboard & UI Components` to `Contributor Sandbox & WS Protocol`, `Wallet & x402 Payment Client`, `Database & Credit Ledger`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Contributor Sandbox & WS Protocol` to `Lease Lifecycle & Node Registry`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `apiError()` (e.g. with `loginWithWallet()` and `topUp()`) actually correct?**
  _`apiError()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _251 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend Dashboard & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05160662122687439 - nodes in this community are weakly interconnected._