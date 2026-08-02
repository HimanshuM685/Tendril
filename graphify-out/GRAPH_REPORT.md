# Graph Report - .  (2026-08-03)

## Corpus Check
- 81 files · ~60,317 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 643 nodes · 1094 edges · 51 communities (40 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.84)
- Token cost: 92,217 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth and Money Persistence|Auth and Money Persistence]]
- [[_COMMUNITY_Contributor Agent and Docker Sandbox|Contributor Agent and Docker Sandbox]]
- [[_COMMUNITY_Leases and Money Math|Leases and Money Math]]
- [[_COMMUNITY_Backend Package Manifest|Backend Package Manifest]]
- [[_COMMUNITY_Web Package Manifest|Web Package Manifest]]
- [[_COMMUNITY_Wallet and Balance UI|Wallet and Balance UI]]
- [[_COMMUNITY_Marketing and Metrics Pages|Marketing and Metrics Pages]]
- [[_COMMUNITY_Marketplace and Lease Panel|Marketplace and Lease Panel]]
- [[_COMMUNITY_Dashboard and Top-Up Controls|Dashboard and Top-Up Controls]]
- [[_COMMUNITY_Contributor Package Manifest|Contributor Package Manifest]]
- [[_COMMUNITY_Example Buyer Manifest|Example Buyer Manifest]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Backend Bootstrap and CORS|Backend Bootstrap and CORS]]
- [[_COMMUNITY_Monorepo Root Scripts|Monorepo Root Scripts]]
- [[_COMMUNITY_Browser x402 Wallet Client|Browser x402 Wallet Client]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Shared TypeScript Base Config|Shared TypeScript Base Config]]
- [[_COMMUNITY_x402 Protocol Concepts|x402 Protocol Concepts]]
- [[_COMMUNITY_Network Config and App Shell|Network Config and App Shell]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_CLI and Agent Rent Path|CLI and Agent Rent Path]]
- [[_COMMUNITY_Sandbox Trust and Tunneling|Sandbox Trust and Tunneling]]
- [[_COMMUNITY_Metered Session and Watchdog|Metered Session and Watchdog]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Contributor TypeScript Config|Contributor TypeScript Config]]
- [[_COMMUNITY_Example Buyer TypeScript Config|Example Buyer TypeScript Config]]
- [[_COMMUNITY_Wallet Signing Queue Test|Wallet Signing Queue Test]]
- [[_COMMUNITY_Hash Hero Animation|Hash Hero Animation]]
- [[_COMMUNITY_Plain HTTP Schemas and Errors|Plain HTTP Schemas and Errors]]
- [[_COMMUNITY_Release, Billing and Payout|Release, Billing and Payout]]
- [[_COMMUNITY_Caveman Style Rule Files|Caveman Style Rule Files]]
- [[_COMMUNITY_In-App API Docs Page|In-App API Docs Page]]
- [[_COMMUNITY_Discovery and Retry Semantics|Discovery and Retry Semantics]]
- [[_COMMUNITY_Shared TypeScript Config|Shared TypeScript Config]]
- [[_COMMUNITY_Wallet Signature Verification|Wallet Signature Verification]]
- [[_COMMUNITY_Deployment and Infrastructure|Deployment and Infrastructure]]
- [[_COMMUNITY_Hero Illustration Artwork|Hero Illustration Artwork]]
- [[_COMMUNITY_Contributor Config|Contributor Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Brand Identity and Favicon|Brand Identity and Favicon]]
- [[_COMMUNITY_Payout Keygen Script|Payout Keygen Script]]
- [[_COMMUNITY_Web SPA Deployment|Web SPA Deployment]]
- [[_COMMUNITY_Sandbox Entrypoint Script|Sandbox Entrypoint Script]]
- [[_COMMUNITY_Bazaar Listing Metadata|Bazaar Listing Metadata]]
- [[_COMMUNITY_Vercel Rewrites|Vercel Rewrites]]
- [[_COMMUNITY_Payout Blocked Flag|Payout Blocked Flag]]
- [[_COMMUNITY_Single Registry Instance|Single Registry Instance]]
- [[_COMMUNITY_Facilitator Network Match|Facilitator Network Match]]
- [[_COMMUNITY_Owner Node Filter|Owner Node Filter]]

## God Nodes (most connected - your core abstractions)
1. `formatUsdc()` - 17 edges
2. `compilerOptions` - 15 edges
3. `topUp()` - 14 edges
4. `compilerOptions` - 13 edges
5. `apiError()` - 13 edges
6. `formatUsdcExact()` - 12 edges
7. `rent()` - 11 edges
8. `Fetch` - 11 edges
9. `SignTransactions` - 11 edges
10. `q()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Caveman Response Style Convention` --conceptually_related_to--> `Tendril`  [AMBIGUOUS]
  AGENTS.md → README.md
- `One Postgres schema per network` --semantically_similar_to--> `First-run failure: asset not opted in`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `fetchNonce()` --calls--> `Fetch`  [INFERRED]
  contributor/src/index.ts → example-buyer/src/index.ts
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `topUp()` --calls--> `usdToAtomic()`  [INFERRED]
  web/src/wallet.ts → shared/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Independently deployable Tendril components** — deploy_backend_deployment, deploy_web_static_spa, deploy_contributor_agent_deployment, deploy_autonomous_consumer_agent [EXTRACTED 1.00]
- **Docker Compose Service Mapping** — deploy_docker_backend_service, deploy_docker_contributor_service, deploy_docker_buyer_service [EXTRACTED 1.00]
- **Hero Art Composition: central figure gripping radiating threads against radial burst backdrop** — public_hero_art_multi_armed_figure, public_hero_art_radiating_threads, public_hero_art_radial_burst_backdrop [EXTRACTED 1.00]
- **The three paid endpoints and their shared 402 payment flow** — docs_x402_api_post_topup, docs_x402_api_post_rent_nodeid, docs_x402_api_post_lease_run, docs_x402_api_payment_flow, docs_x402_api_paymentrequired, docs_x402_api_settleresponse [EXTRACTED 1.00]
- **Metered session lifecycle: gate fee, watchdog, grace, bill at close, payout** — readme_gate_fee, readme_metered_session, readme_watchdog, readme_grace_window, docs_x402_api_billing_formula, docs_x402_api_delete_x402_leases_id, readme_contributor_payout [INFERRED 0.95]
- **Identity without accounts: payment is the identity, sessions only read balances** — readme_payer_identity, readme_session_token_shrunk, docs_api_three_credentials, docs_api_post_auth_wallet_login, docs_api_get_wallet, readme_cors_free_payable_routes [INFERRED 0.85]

## Communities (51 total, 11 thin omitted)

### Community 0 - "Auth and Money Persistence"
Cohesion: 0.06
Nodes (66): addressFromSession(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces, verifyAgentHello() (+58 more)

### Community 1 - "Contributor Agent and Docker Sandbox"
Cohesion: 0.05
Nodes (61): main(), containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SANDBOX_CTX (+53 more)

### Community 2 - "Leases and Money Math"
Cohesion: 0.09
Nodes (33): issueLeaseToken(), hourly, mainnet, quote, rate, testnet, atomicPerHour(), fundedSeconds() (+25 more)

### Community 3 - "Backend Package Manifest"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+21 more)

### Community 4 - "Web Package Manifest"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 5 - "Wallet and Balance UI"
Cohesion: 0.12
Nodes (24): BalanceChart(), Props, Pt, AlgoStat(), Props, short(), WalletBar(), WalletPanel() (+16 more)

### Community 6 - "Marketing and Metrics Pages"
Cohesion: 0.11
Nodes (10): About(), ArchDiagram(), Dashboard(), Docs(), BoardTab, Metrics(), ApiDocs, MetricPoint (+2 more)

### Community 7 - "Marketplace and Lease Panel"
Cohesion: 0.19
Nodes (14): Contribute(), Explore(), Props, fmtCountdown(), LeasePanel(), Props, Marketplace(), Props (+6 more)

### Community 8 - "Dashboard and Top-Up Controls"
Cohesion: 0.17
Nodes (13): ExplorerLink(), Props, short(), PRESETS, Props, TopUpControl(), Props, SignTransactions (+5 more)

### Community 9 - "Contributor Package Manifest"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 10 - "Example Buyer Manifest"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 11 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 12 - "Backend Bootstrap and CORS"
Cohesion: 0.19
Nodes (13): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+5 more)

### Community 13 - "Monorepo Root Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 14 - "Browser x402 Wallet Client"
Cohesion: 0.15
Nodes (10): PayStage, serializeSigner(), walletQueue, PaymentReceipt, WalletLoginResponse, WalletNonceResponse, X402TopUpResponse, loginWithWallet() (+2 more)

### Community 15 - "Frontend API Client"
Cohesion: 0.34
Nodes (13): payingFetch(), apiError(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes(), fetchPlatform(), fetchWallet() (+5 more)

### Community 16 - "Shared TypeScript Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 17 - "x402 Protocol Concepts"
Cohesion: 0.19
Nodes (13): Three independent credentials (session, lease, payment), Server configuration variables, First-run failure: asset not opted in, x402 request/response headers, Three-round-trip payment flow, SettleResponse schema, Bazaar discovery metadata, CORS-free payable routes (+5 more)

### Community 18 - "Network Config and App Shell"
Cohesion: 0.20
Nodes (7): config, repoRoot, network, App(), net, networkDefaults, walletManager

### Community 19 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 20 - "CLI and Agent Rent Path"
Cohesion: 0.22
Nodes (9): Autonomous consumer agent deployment, GET /auth/wallet-nonce, GET /wallet, POST /auth/wallet-login, Renting from the CLI, Signer interface (signTransactions with indexes), example-buyer autonomous training agent, npm-workspaces monorepo layout (+1 more)

### Community 21 - "Sandbox Trust and Tunneling"
Cohesion: 0.25
Nodes (9): Contributor agent deployment (per contributor machine), tendril-ssh-sandbox image (bore built from source), TUNNEL_MODE (bore | local), SandboxAccess schema, bore tunnel (outbound SSH exposure), Contributor agent daemon, Ephemeral Docker sandbox (trust model), SSH auth: pubkey or wallet-address password (+1 more)

### Community 22 - "Metered Session and Watchdog"
Cohesion: 0.28
Nodes (9): METER_INTERVAL_MS watchdog tick, GET /lease/:id (status), Losing leaseToken means you cannot release, POST /lease/:id/run, POST /rent/:nodeId, Flat gate fee (FLAT_RENT_ATOMIC), Grace window (GRACE_ATOMIC), Open-ended metered session (+1 more)

### Community 23 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 24 - "Contributor TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 25 - "Example Buyer TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 26 - "Wallet Signing Queue Test"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 27 - "Hash Hero Animation"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 28 - "Plain HTTP Schemas and Errors"
Cohesion: 0.29
Nodes (7): Atomic-unit amount convention, Plain HTTP error index, GET /metrics, Error envelope and the two shapes of 402, PaymentPayload schema, PaymentRequired schema, PaymentRequirements schema

### Community 29 - "Release, Billing and Payout"
Cohesion: 0.38
Nodes (7): DELETE /x402/leases/:id (release), GET /explorer, Billing formula (usedAtomic, charged, payout), DELETE /x402/leases/:id, On-chain contributor payout, Custodial off-chain credit ledger, In-memory nodes and leases

### Community 30 - "Caveman Style Rule Files"
Cohesion: 0.33
Nodes (6): AGENTS.md (caveman rule), Caveman Response Style Convention, .clinerules/caveman.md, .github/copilot-instructions.md, .opencode/AGENTS.md, .windsurf/rules/caveman.md

### Community 32 - "Discovery and Retry Semantics"
Cohesion: 0.33
Nodes (6): GET /health, GET /platform, POST /topup, What is safe to retry, Single-use payment signature, Tendril

### Community 33 - "Shared TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 34 - "Wallet Signature Verification"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 35 - "Deployment and Infrastructure"
Cohesion: 0.40
Nodes (5): Algod endpoint (ALGOD_TESTNET_URL), Backend / registry deployment (Docker, PaaS, VPS), Neon Postgres money store (DATABASE_URL), Platform custodial account (PLATFORM_PAYTO / PLATFORM_PRIVATE_KEY), WebSocket upgrade proxying requirement

### Community 36 - "Hero Illustration Artwork"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 38 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 39 - "Brand Identity and Favicon"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

## Ambiguous Edges - Review These
- `Caveman Response Style Convention` → `Tendril`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to
- `POST /rent/:nodeId` → `Server configuration variables`  [AMBIGUOUS]
  docs/x402-api.md · relation: references

## Knowledge Gaps
- **246 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Caveman Response Style Convention` and `Tendril`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `POST /rent/:nodeId` and `Server configuration variables`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `formatUsdc()` connect `Wallet and Balance UI` to `Auth and Money Persistence`, `Contributor Agent and Docker Sandbox`, `Leases and Money Math`, `Marketing and Metrics Pages`, `Marketplace and Lease Panel`, `Dashboard and Top-Up Controls`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Dashboard and Top-Up Controls` to `Auth and Money Persistence`, `Contributor Agent and Docker Sandbox`, `Marketing and Metrics Pages`, `Marketplace and Lease Panel`, `Frontend API Client`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Contributor Agent and Docker Sandbox` to `Auth and Money Persistence`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _255 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth and Money Persistence` be split into smaller, more focused modules?**
  _Cohesion score 0.060833902939166094 - nodes in this community are weakly interconnected._