# Graph Report - .  (2026-08-31)

## Corpus Check
- 119 files · ~83,010 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 912 nodes · 1871 edges · 69 communities (52 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin API Routes|Admin API Routes]]
- [[_COMMUNITY_Admin SPA Frontend|Admin SPA Frontend]]
- [[_COMMUNITY_Custodial Auth Sessions|Custodial Auth Sessions]]
- [[_COMMUNITY_Dashboard UI Modals|Dashboard UI Modals]]
- [[_COMMUNITY_x402 Service Discovery|x402 Service Discovery]]
- [[_COMMUNITY_Wallet Onboarding Flow|Wallet Onboarding Flow]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Contributor SPA Pages|Contributor SPA Pages]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Marketing Pages|Marketing Pages]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_Auth Core|Auth Core]]
- [[_COMMUNITY_Site Dependencies|Site Dependencies]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Workspace Config|Workspace Config]]
- [[_COMMUNITY_Lease Billing|Lease Billing]]
- [[_COMMUNITY_Admin Auth Config|Admin Auth Config]]
- [[_COMMUNITY_Shared SDK Dependencies|Shared SDK Dependencies]]
- [[_COMMUNITY_Node Registry|Node Registry]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Backend Server Entry|Backend Server Entry]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Contributor Daemon Core|Contributor Daemon Core]]
- [[_COMMUNITY_Shared Types|Shared Types]]
- [[_COMMUNITY_Metrics Dashboard|Metrics Dashboard]]
- [[_COMMUNITY_Custodial Signing UI|Custodial Signing UI]]
- [[_COMMUNITY_Sandbox Job Runner|Sandbox Job Runner]]
- [[_COMMUNITY_Sandbox WS Protocol|Sandbox WS Protocol]]
- [[_COMMUNITY_Base TSConfig|Base TSConfig]]
- [[_COMMUNITY_Docker Sandbox Manager|Docker Sandbox Manager]]
- [[_COMMUNITY_Contributor TSConfig|Contributor TSConfig]]
- [[_COMMUNITY_Lease Provisioning|Lease Provisioning]]
- [[_COMMUNITY_x402 API Docs|x402 API Docs]]
- [[_COMMUNITY_Package Entrypoints|Package Entrypoints]]
- [[_COMMUNITY_Package TSConfigs|Package TSConfigs]]
- [[_COMMUNITY_Explorer Dashboard|Explorer Dashboard]]
- [[_COMMUNITY_Package TSConfig A|Package TSConfig A]]
- [[_COMMUNITY_Package TSConfig B|Package TSConfig B]]
- [[_COMMUNITY_x402 Buyer Client Tests|x402 Buyer Client Tests]]
- [[_COMMUNITY_Caveman Style Docs|Caveman Style Docs]]
- [[_COMMUNITY_Auth API Endpoints|Auth API Endpoints]]
- [[_COMMUNITY_App TSConfig|App TSConfig]]
- [[_COMMUNITY_Wallet Verification|Wallet Verification]]
- [[_COMMUNITY_Balance History Chart|Balance History Chart]]
- [[_COMMUNITY_Hardware Spec Detection|Hardware Spec Detection]]
- [[_COMMUNITY_Hero Artwork|Hero Artwork]]
- [[_COMMUNITY_Site Config|Site Config]]
- [[_COMMUNITY_Service Topology|Service Topology]]
- [[_COMMUNITY_Brand Identity|Brand Identity]]
- [[_COMMUNITY_Opencode Plugin|Opencode Plugin]]
- [[_COMMUNITY_Key Generation|Key Generation]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_SPA Rewrites Admin|SPA Rewrites Admin]]
- [[_COMMUNITY_Docker Entrypoint|Docker Entrypoint]]
- [[_COMMUNITY_SPA Rewrites Buyer|SPA Rewrites Buyer]]
- [[_COMMUNITY_Keys Delete Endpoint|Keys Delete Endpoint]]
- [[_COMMUNITY_Health Endpoint|Health Endpoint]]
- [[_COMMUNITY_Keys List Endpoint|Keys List Endpoint]]
- [[_COMMUNITY_Metrics Endpoint|Metrics Endpoint]]
- [[_COMMUNITY_Nodes Endpoint|Nodes Endpoint]]
- [[_COMMUNITY_Platform Endpoint|Platform Endpoint]]
- [[_COMMUNITY_Withdraw Endpoint|Withdraw Endpoint]]
- [[_COMMUNITY_Facilitator Fee Concept|Facilitator Fee Concept]]
- [[_COMMUNITY_Tendril Product Concept|Tendril Product Concept]]
- [[_COMMUNITY_SPA Entry Concept|SPA Entry Concept]]

## God Nodes (most connected - your core abstractions)
1. `Fetch` - 31 edges
2. `apiError()` - 29 edges
3. `formatUsdc()` - 28 edges
4. `Session` - 22 edges
5. `creditBalance()` - 18 edges
6. `q()` - 17 edges
7. `useAdminAuth()` - 16 edges
8. `formatUsdcExact()` - 16 edges
9. `SignTransactions` - 16 edges
10. `compilerOptions` - 15 edges

## Surprising Connections (you probably didn't know these)
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `backend/ — central registry (Express + Neon + socket.io)`  [INFERRED]
  DEPLOY.md → README.md
- `adminGoogleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/adminAuth.ts → example-buyer/src/index.ts
- `prepareCustodialSign()` --calls--> `formatUsdc()`  [EXTRACTED]
  backend/src/custodialSign.ts → shared/src/index.ts
- `googleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/googleAuth.ts → example-buyer/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Docker Compose Service Mapping** — deploy_docker_backend_service, deploy_docker_contributor_service, deploy_docker_buyer_service [EXTRACTED 1.00]
- **Tendril authentication credential model** — docs_api_auth_model, docs_api_get_wallet, docs_api_post_keys, docs_api_get_lease [EXTRACTED 1.00]
- **x402 verify→work→settle payment flow** — docs_x402_api_post_topup, docs_x402_api_post_rent, docs_x402_api_post_run, docs_x402_api_payment_flow [INFERRED 0.85]
- **Hero Art Composition: central figure gripping radiating threads against radial burst backdrop** — public_hero_art_multi_armed_figure, public_hero_art_radiating_threads, public_hero_art_radial_burst_backdrop [EXTRACTED 1.00]

## Communities (69 total, 17 thin omitted)

### Community 0 - "Admin API Routes"
Cohesion: 0.05
Nodes (59): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+51 more)

### Community 1 - "Admin SPA Frontend"
Cohesion: 0.09
Nodes (43): AdminLayout(), acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode(), explorerAddrUrl() (+35 more)

### Community 2 - "Custodial Auth Sessions"
Cohesion: 0.09
Nodes (46): issueEmailSession(), issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), checkExportRateLimit(), confirmCustodialSign(), exportLog (+38 more)

### Community 3 - "Dashboard UI Modals"
Cohesion: 0.11
Nodes (33): BalanceChart(), AlgoStat(), EmailAuthModal(), Props, ExportKeyModal(), Props, GoogleWalletBar(), short() (+25 more)

### Community 4 - "x402 Service Discovery"
Cohesion: 0.14
Nodes (29): topUp(), discoveryExtensions(), RouteDiscovery, serviceMetadata, discovered, payloadFor(), rent, run (+21 more)

### Community 5 - "Wallet Onboarding Flow"
Cohesion: 0.15
Nodes (28): algod, fetchOnchainBalances(), fetchWalletAccount(), fetchWalletGasRequest(), optInUsdcWithWallet(), submitWalletGasRequest(), payingFetch(), PayStage (+20 more)

### Community 6 - "Backend Dependencies"
Cohesion: 0.06
Nodes (30): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+22 more)

### Community 7 - "Contributor SPA Pages"
Cohesion: 0.17
Nodes (24): Contribute(), Props, Props, Explore(), Props, GoogleCallback(), Props, Props (+16 more)

### Community 8 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 9 - "Marketing Pages"
Cohesion: 0.10
Nodes (13): About(), ArchDiagram(), Docs(), HashHero(), HashHeroProps, ROWS, Marketplace(), network (+5 more)

### Community 10 - "API Docs UI"
Cohesion: 0.08
Nodes (19): DocId, DOCS, Group, Heading, Section, REGISTRY_URL, hourly, mainnet (+11 more)

### Community 11 - "Auth Core"
Cohesion: 0.15
Nodes (20): addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), sessionFromAuthHeader() (+12 more)

### Community 12 - "Site Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 13 - "Buyer Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 14 - "Workspace Config"
Cohesion: 0.11
Nodes (18): description, engines, node, name, overrides, lute-connect, private, scripts (+10 more)

### Community 15 - "Lease Billing"
Cohesion: 0.17
Nodes (18): fundedSeconds(), Lease, LeaseStatus, proratedCost(), activateLease(), closeLease(), expiredLeaseAction(), fundedUntil() (+10 more)

### Community 16 - "Admin Auth Config"
Cohesion: 0.20
Nodes (15): config, repoRoot, adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis (+7 more)

### Community 17 - "Shared SDK Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 18 - "Node Registry"
Cohesion: 0.15
Nodes (15): googleAccountInfo, isOnline(), hasOptedIn(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes (+7 more)

### Community 19 - "Shared TSConfig"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 20 - "Backend Server Entry"
Cohesion: 0.18
Nodes (14): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+6 more)

### Community 21 - "Architecture Concepts"
Cohesion: 0.16
Nodes (15): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), backend/ — central registry (Express + Neon + socket.io), Bazaar discovery via backend/src/x402/discovery.ts + PUBLIC_BASE_URL, contributor/ — contributor daemon running Docker SSH sandboxes, Custodial off-chain ledger in Neon per-network schemas (testnet.*/mainnet.*), example-buyer/ — headless autonomous x402 consumer agent (+7 more)

### Community 22 - "Contributor Daemon Core"
Cohesion: 0.18
Nodes (14): main(), ExplorerNode, LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), REGISTRY, repoRoot (+6 more)

### Community 23 - "Shared Types"
Cohesion: 0.13
Nodes (14): AlgorandNetwork, AssetInfo, DestroyContainerMsg, ExportKeyResponse, Job, LeaseBilling, NETWORKS, NodeStatus (+6 more)

### Community 24 - "Metrics Dashboard"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 25 - "Custodial Signing UI"
Cohesion: 0.19
Nodes (11): Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), PendingConfirm, confirmCustodial(), CustodialAction (+3 more)

### Community 26 - "Sandbox Job Runner"
Cohesion: 0.18
Nodes (12): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, handleDestroy(), handleRun(), handleStart() (+4 more)

### Community 27 - "Sandbox WS Protocol"
Cohesion: 0.15
Nodes (13): JobResultMsg, SandboxAccess, SandboxLimits, WS, getLease(), setLeaseStatus(), releaseLease(), requireLease() (+5 more)

### Community 28 - "Base TSConfig"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 29 - "Docker Sandbox Manager"
Cohesion: 0.31
Nodes (12): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+4 more)

### Community 30 - "Contributor TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 31 - "Lease Provisioning"
Cohesion: 0.23
Nodes (10): atomicPerHour(), abandonLease(), createLease(), rate, isOpenSshPubKey(), provision(), rent(), runAnywhere() (+2 more)

### Community 32 - "x402 API Docs"
Cohesion: 0.27
Nodes (11): DELETE /x402/leases/:id (api.md), GET /explorer, Paid endpoints summary table, Renting from the CLI walkthrough, DELETE /x402/leases/:id (x402-api.md), Grace window (GRACE_ATOMIC), x402 API document overview, Verify → work → settle payment ordering (+3 more)

### Community 33 - "Package Entrypoints"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 34 - "Package TSConfigs"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 35 - "Explorer Dashboard"
Cohesion: 0.29
Nodes (4): Dashboard(), ExplorerLink(), short(), explorerAddrUrl()

### Community 36 - "Package TSConfig A"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 37 - "Package TSConfig B"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 38 - "x402 Buyer Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 39 - "Caveman Style Docs"
Cohesion: 0.33
Nodes (6): AGENTS.md (caveman rule), Caveman Response Style Convention, .clinerules/caveman.md, .github/copilot-instructions.md, .opencode/AGENTS.md, .windsurf/rules/caveman.md

### Community 40 - "Auth API Endpoints"
Cohesion: 0.33
Nodes (6): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, GET /lease/:id, GET /wallet, POST /keys

### Community 41 - "App TSConfig"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 42 - "Wallet Verification"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 43 - "Balance History Chart"
Cohesion: 0.60
Nodes (4): Props, Pt, Charge, TopUp

### Community 44 - "Hardware Spec Detection"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 45 - "Hero Artwork"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 47 - "Service Topology"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 48 - "Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

## Knowledge Gaps
- **309 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+304 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatUsdc()` connect `Dashboard UI Modals` to `Custodial Auth Sessions`, `Explorer Dashboard`, `x402 Service Discovery`, `Wallet Onboarding Flow`, `Contributor SPA Pages`, `API Docs UI`, `Balance History Chart`, `Auth Core`, `Shared Types`, `Metrics Dashboard`, `Lease Provisioning`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `Fetch` connect `Admin SPA Frontend` to `Custodial Auth Sessions`, `Dashboard UI Modals`, `Wallet Onboarding Flow`, `Contributor SPA Pages`, `API Docs UI`, `Admin Auth Config`, `Backend Server Entry`, `Contributor Daemon Core`, `Custodial Signing UI`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Contributor SPA Pages` to `Admin API Routes`, `Explorer Dashboard`, `Wallet Onboarding Flow`, `Marketing Pages`, `Shared Types`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.052313883299798795 - nodes in this community are weakly interconnected._
- **Should `Admin SPA Frontend` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._