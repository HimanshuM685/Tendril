# Graph Report - .  (2026-09-18)

## Corpus Check
- 6 files · ~84,868 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1041 nodes · 1945 edges · 78 communities (63 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin Gas Routes|Admin Gas Routes]]
- [[_COMMUNITY_Custodial Wallet Signing|Custodial Wallet Signing]]
- [[_COMMUNITY_Auth Session Config|Auth Session Config]]
- [[_COMMUNITY_Admin SPA API|Admin SPA API]]
- [[_COMMUNITY_Wallet Auth Modals|Wallet Auth Modals]]
- [[_COMMUNITY_Marketplace Lease UI|Marketplace Lease UI]]
- [[_COMMUNITY_Backend Package Deps|Backend Package Deps]]
- [[_COMMUNITY_Web Wallet Deps|Web Wallet Deps]]
- [[_COMMUNITY_Contributor Payout Registry|Contributor Payout Registry]]
- [[_COMMUNITY_Lease Lifecycle|Lease Lifecycle]]
- [[_COMMUNITY_Sandbox WebSocket Protocol|Sandbox WebSocket Protocol]]
- [[_COMMUNITY_Contributor API Client|Contributor API Client]]
- [[_COMMUNITY_API Docs Renderer|API Docs Renderer]]
- [[_COMMUNITY_Admin Frontend Deps|Admin Frontend Deps]]
- [[_COMMUNITY_Dashboard Balance Charts|Dashboard Balance Charts]]
- [[_COMMUNITY_Contributor Package Deps|Contributor Package Deps]]
- [[_COMMUNITY_Root Workspace Scripts|Root Workspace Scripts]]
- [[_COMMUNITY_Marketing Docs Pages|Marketing Docs Pages]]
- [[_COMMUNITY_Buyer Agent Deps|Buyer Agent Deps]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Backend Server Bootstrap|Backend Server Bootstrap]]
- [[_COMMUNITY_Shared Type Contracts|Shared Type Contracts]]
- [[_COMMUNITY_HTTP Status Endpoints|HTTP Status Endpoints]]
- [[_COMMUNITY_Docker Sandbox Runtime|Docker Sandbox Runtime]]
- [[_COMMUNITY_Metrics Dashboard UI|Metrics Dashboard UI]]
- [[_COMMUNITY_Custodial Sign Confirm|Custodial Sign Confirm]]
- [[_COMMUNITY_Buyer Agent Runtime|Buyer Agent Runtime]]
- [[_COMMUNITY_README Trust Model|README Trust Model]]
- [[_COMMUNITY_TSConfig Base Options|TSConfig Base Options]]
- [[_COMMUNITY_Architecture Overview|Architecture Overview]]
- [[_COMMUNITY_x402 API Walkthrough|x402 API Walkthrough]]
- [[_COMMUNITY_Admin TypeScript Config|Admin TypeScript Config]]
- [[_COMMUNITY_Brand Cross-Cutting Bridges|Brand Cross-Cutting Bridges]]
- [[_COMMUNITY_Setup Deployment Guide|Setup Deployment Guide]]
- [[_COMMUNITY_Graphify Knowledge Graph|Graphify Knowledge Graph]]
- [[_COMMUNITY_REST API Auth Docs|REST API Auth Docs]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Pricing Format Tests|Pricing Format Tests]]
- [[_COMMUNITY_Auth Credential Model|Auth Credential Model]]
- [[_COMMUNITY_Client Recipe Docs|Client Recipe Docs]]
- [[_COMMUNITY_Caveman Agent Style|Caveman Agent Style]]
- [[_COMMUNITY_Backend TSConfig|Backend TSConfig]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Payment Schema Types|Payment Schema Types]]
- [[_COMMUNITY_Contributor TSConfig|Contributor TSConfig]]
- [[_COMMUNITY_x402 Client Tests|x402 Client Tests]]
- [[_COMMUNITY_HashHero Animation|HashHero Animation]]
- [[_COMMUNITY_Payment Request Docs|Payment Request Docs]]
- [[_COMMUNITY_x402 Run Billing|x402 Run Billing]]
- [[_COMMUNITY_CLI Rent Walkthrough|CLI Rent Walkthrough]]
- [[_COMMUNITY_Buyer TSConfig|Buyer TSConfig]]
- [[_COMMUNITY_GPU Spec Detection|GPU Spec Detection]]
- [[_COMMUNITY_x402 API Docs Hub|x402 API Docs Hub]]
- [[_COMMUNITY_OG Hero Illustration|OG Hero Illustration]]
- [[_COMMUNITY_Open Graph Social Card|Open Graph Social Card]]
- [[_COMMUNITY_Contributor Config|Contributor Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_CORS Error Reference|CORS Error Reference]]
- [[_COMMUNITY_Tendril Brand Identity|Tendril Brand Identity]]
- [[_COMMUNITY_OpenCode Plugin Deps|OpenCode Plugin Deps]]
- [[_COMMUNITY_Keygen Account|Keygen Account]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_Web Vercel Rewrites|Web Vercel Rewrites]]
- [[_COMMUNITY_Sandbox Entrypoint|Sandbox Entrypoint]]
- [[_COMMUNITY_Admin Vercel Rewrites|Admin Vercel Rewrites]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_Contributor Pages|Contributor Pages]]
- [[_COMMUNITY_Fetch God Node|Fetch God Node]]
- [[_COMMUNITY_Session God Node|Session God Node]]
- [[_COMMUNITY_Wallet Onboarding|Wallet Onboarding]]
- [[_COMMUNITY_Facilitator Network Fee|Facilitator Network Fee]]
- [[_COMMUNITY_Tendril Marketplace Pitch|Tendril Marketplace Pitch]]

## God Nodes (most connected - your core abstractions)
1. `Fetch` - 31 edges
2. `apiError()` - 29 edges
3. `formatUsdc()` - 23 edges
4. `Session` - 22 edges
5. `q()` - 17 edges
6. `useAdminAuth()` - 16 edges
7. `formatUsdcExact()` - 16 edges
8. `SignTransactions` - 16 edges
9. `compilerOptions` - 15 edges
10. `creditBalance()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `formatUsdc()` --semantically_similar_to--> `USDC`  [INFERRED] [semantically similar]
  AGENTS.md → web/index.html
- `Admin SPA` --semantically_similar_to--> `SPA Entry main.tsx`  [INFERRED] [semantically similar]
  AGENTS.md → web/index.html
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `backend/ — central registry (Express + Neon + socket.io)`  [INFERRED]
  DEPLOY.md → README.md
- `adminGoogleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/adminAuth.ts → example-buyer/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **God Nodes Last Full Rebuild** — agents_fetch, agents_apierror, agents_formatusdc, agents_session, agents_creditbalance [EXTRACTED 1.00]
- **Graphify Always-Produced Outputs** — agents_graph_html, agents_graph_report_md, agents_graph_json [EXTRACTED 1.00]
- **Fetch High-Betweenness Community Bridges** — agents_fetch, agents_admin_spa, agents_custodial_auth, agents_wallet_onboarding, agents_contributor_pages, agents_api_docs_ui [EXTRACTED 1.00]
- **Tendril OG Brand Lockup** — public_og_social_preview, public_og_tendril_wordmark, public_og_ellipsis_motif, public_og_last_mile_of_funding [EXTRACTED 1.00]

## Communities (78 total, 15 thin omitted)

### Community 0 - "Admin Gas Routes"
Cohesion: 0.06
Nodes (61): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), issueEmailSession(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus() (+53 more)

### Community 1 - "Custodial Wallet Signing"
Cohesion: 0.06
Nodes (58): algod, checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), GoogleAccountInfo, pending, PendingRequest (+50 more)

### Community 2 - "Auth Session Config"
Cohesion: 0.06
Nodes (53): config, repoRoot, adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis (+45 more)

### Community 3 - "Admin SPA API"
Cohesion: 0.09
Nodes (43): AdminLayout(), acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode(), explorerAddrUrl() (+35 more)

### Community 4 - "Wallet Auth Modals"
Cohesion: 0.09
Nodes (36): EmailAuthModal(), Props, ExportKeyModal(), Props, GoogleWalletBar(), Props, short(), formatAlgo() (+28 more)

### Community 5 - "Marketplace Lease UI"
Cohesion: 0.16
Nodes (22): Contribute(), Props, Props, Explore(), Props, fmtCountdown(), LeasePanel(), Props (+14 more)

### Community 6 - "Backend Package Deps"
Cohesion: 0.06
Nodes (30): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+22 more)

### Community 7 - "Web Wallet Deps"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 8 - "Contributor Payout Registry"
Cohesion: 0.13
Nodes (20): ExplorerNode, isOnline(), hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances (+12 more)

### Community 9 - "Lease Lifecycle"
Cohesion: 0.13
Nodes (23): fundedSeconds(), Lease, LeaseStatus, proratedCost(), SandboxAccess, abandonLease(), activateLease(), closeLease() (+15 more)

### Community 10 - "Sandbox WebSocket Protocol"
Cohesion: 0.12
Nodes (20): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, handleRun(), HeartbeatMsg (+12 more)

### Community 11 - "Contributor API Client"
Cohesion: 0.23
Nodes (19): payingFetch(), apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes() (+11 more)

### Community 12 - "API Docs Renderer"
Cohesion: 0.10
Nodes (15): DocId, DOCS, Group, Heading, Section, PayStage, REGISTRY_URL, usdToAtomic() (+7 more)

### Community 13 - "Admin Frontend Deps"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 14 - "Dashboard Balance Charts"
Cohesion: 0.16
Nodes (15): BalanceChart(), Props, Pt, AlgoStat(), Dashboard(), ExplorerLink(), short(), short() (+7 more)

### Community 15 - "Contributor Package Deps"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 16 - "Root Workspace Scripts"
Cohesion: 0.11
Nodes (18): description, engines, node, name, overrides, lute-connect, private, scripts (+10 more)

### Community 17 - "Marketing Docs Pages"
Cohesion: 0.17
Nodes (10): About(), ArchDiagram(), Docs(), GoogleCallback(), Props, Marketplace(), network, serializeSigner() (+2 more)

### Community 18 - "Buyer Agent Deps"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 19 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 20 - "Backend Server Bootstrap"
Cohesion: 0.18
Nodes (14): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+6 more)

### Community 21 - "Shared Type Contracts"
Cohesion: 0.12
Nodes (16): AlgorandNetwork, AssetInfo, ExportKeyResponse, Job, LeaseBilling, NETWORKS, NodeStatus, Payout (+8 more)

### Community 22 - "HTTP Status Endpoints"
Cohesion: 0.20
Nodes (16): `200 OK`, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway`, `DELETE /x402/leases/:id`, Endpoints, Errors, with `curl`, Example (+8 more)

### Community 23 - "Docker Sandbox Runtime"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 24 - "Metrics Dashboard UI"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 25 - "Custodial Sign Confirm"
Cohesion: 0.19
Nodes (11): Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), PendingConfirm, confirmCustodial(), CustodialAction (+3 more)

### Community 26 - "Buyer Agent Runtime"
Cohesion: 0.19
Nodes (13): main(), LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), REGISTRY, repoRoot, request() (+5 more)

### Community 27 - "README Trust Model"
Cohesion: 0.14
Nodes (14): Architecture, Being findable (Bazaar discovery), Configuration, Demo script (the money shot), Notes & limitations, Prerequisites, Quick start, Run with Docker (+6 more)

### Community 28 - "TSConfig Base Options"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 29 - "Architecture Overview"
Cohesion: 0.19
Nodes (13): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), backend/ — central registry (Express + Neon + socket.io), Bazaar discovery via backend/src/x402/discovery.ts + PUBLIC_BASE_URL, contributor/ — contributor daemon running Docker SSH sandboxes, Custodial off-chain ledger in Neon per-network schemas (testnet.*/mainnet.*), example-buyer/ — headless autonomous x402 consumer agent (+5 more)

### Community 30 - "x402 API Walkthrough"
Cohesion: 0.17
Nodes (13): DELETE /x402/leases/:id (api.md), Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Renting from the CLI walkthrough (+5 more)

### Community 31 - "Admin TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 32 - "Brand Cross-Cutting Bridges"
Cohesion: 0.23
Nodes (12): Admin SPA, Custodial Auth, formatUsdc(), Algorand, SPA Entry main.tsx, Open Graph Metadata, Sandboxed SSH Machine Rental, TENDRIL (+4 more)

### Community 33 - "Setup Deployment Guide"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 34 - "Graphify Knowledge Graph"
Cohesion: 0.24
Nodes (11): graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Fast Path, Graphify Full Pipeline, Graphify Query, NetworkX Fallback Traversal (+3 more)

### Community 35 - "REST API Auth Docs"
Cohesion: 0.20
Nodes (9): Authentication, Contributor, DELETE /keys/:id, `GET /keys`, Overview, `POST /withdraw`, Table of contents, Tendril API (+1 more)

### Community 36 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 37 - "Pricing Format Tests"
Cohesion: 0.20
Nodes (7): hourly, mainnet, quote, rate, testnet, atomicPerHour(), rate

### Community 38 - "Auth Credential Model"
Cohesion: 0.28
Nodes (9): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, `DELETE /x402/leases/:id`, GET /lease/:id, `GET /wallet`, Lease, `POST /keys` (+1 more)

### Community 39 - "Client Recipe Docs"
Cohesion: 0.22
Nodes (9): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Testnet setup, The first-run failure (+1 more)

### Community 40 - "Caveman Agent Style"
Cohesion: 0.25
Nodes (4): Auto-Clarity, Caveman Response Style, Caveman Switch Levels, Code Commit PR Boundaries

### Community 41 - "Backend TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 42 - "Shared TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 43 - "Payment Schema Types"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 44 - "Contributor TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 45 - "x402 Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 46 - "HashHero Animation"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 47 - "Payment Request Docs"
Cohesion: 0.29
Nodes (7): Authentication, CORS, Headers, How payment works, Overview, Request, Response

### Community 48 - "x402 Run Billing"
Cohesion: 0.33
Nodes (6): Billing, and how you can end up owing money, Example — inside a lease you hold, Example — no lease, no setup, `POST /x402/run`, Request headers, Which machine you get

### Community 49 - "CLI Rent Walkthrough"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

### Community 50 - "Buyer TSConfig"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 51 - "GPU Spec Detection"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 53 - "OG Hero Illustration"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 54 - "Open Graph Social Card"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 56 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 57 - "CORS Error Reference"
Cohesion: 0.50
Nodes (4): CORS, Error index, Paid endpoints, Reference

### Community 58 - "Tendril Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

## Knowledge Gaps
- **372 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+367 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fetch` connect `Admin SPA API` to `Auth Session Config`, `Wallet Auth Modals`, `Contributor API Client`, `API Docs Renderer`, `Backend Server Bootstrap`, `Custodial Sign Confirm`, `Buyer Agent Runtime`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `formatUsdc()` connect `Dashboard Balance Charts` to `Custodial Wallet Signing`, `Wallet Auth Modals`, `Marketplace Lease UI`, `Pricing Format Tests`, `Contributor API Client`, `Shared Type Contracts`, `Metrics Dashboard UI`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Marketplace Lease UI` to `Admin Gas Routes`, `Contributor API Client`, `Dashboard Balance Charts`, `Marketing Docs Pages`, `Shared Type Contracts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _382 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Gas Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.0578386605783866 - nodes in this community are weakly interconnected._
- **Should `Custodial Wallet Signing` be split into smaller, more focused modules?**
  _Cohesion score 0.05750658472344162 - nodes in this community are weakly interconnected._