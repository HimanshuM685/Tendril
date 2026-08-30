# Graph Report - Tendril  (2026-08-30)

## Corpus Check
- 114 files · ~82,978 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1033 nodes · 2019 edges · 77 communities (67 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `43f25298`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `Fetch` - 41 edges
2. `apiError()` - 31 edges
3. `formatUsdc()` - 28 edges
4. `Session` - 22 edges
5. `creditBalance()` - 18 edges
6. `useAdminAuth()` - 16 edges
7. `q()` - 16 edges
8. `formatUsdcExact()` - 16 edges
9. `SignTransactions` - 16 edges
10. `🌿 Tendril` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Watchdog (lease balance monitor)` --semantically_similar_to--> `Grace window (GRACE_ATOMIC)`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Open-ended metered session (bill once at close)` --semantically_similar_to--> `Verify → work → settle payment ordering`  [INFERRED] [semantically similar]
  README.md → docs/x402-api.md
- `Self-hosted BORE_SERVER/BORE_SECRET` --semantically_similar_to--> `Ephemeral Docker sandbox (trust model)`  [INFERRED] [semantically similar]
  DEPLOY.md → README.md
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

## Communities (77 total, 10 thin omitted)

### Community 0 - "Frontend Dashboard & UI Components"
Cohesion: 0.16
Nodes (24): Contribute(), Props, Props, Explore(), Props, Props, Props, fmtCountdown() (+16 more)

### Community 1 - "Lease Lifecycle & Node Registry"
Cohesion: 0.19
Nodes (22): AssetInfo, ProvisionArgs, topUp(), topUpBody(), PaidRequest, requirePayment(), asset, challenge() (+14 more)

### Community 2 - "Contributor Sandbox & WS Protocol"
Cohesion: 0.17
Nodes (15): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, handleRun(), HeartbeatMsg, HelloAckMsg (+7 more)

### Community 3 - "Project Docs & Design Rationale"
Cohesion: 0.15
Nodes (17): DELETE /x402/leases/:id (api.md), Paid endpoints, `200 OK`, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway`, Renting from the CLI walkthrough, DELETE /x402/leases/:id (x402-api.md) (+9 more)

### Community 4 - "Wallet & x402 Payment Client"
Cohesion: 0.09
Nodes (16): About(), ArchDiagram(), Docs(), GoogleCallback(), HashHero(), HashHeroProps, ROWS, Marketplace() (+8 more)

### Community 5 - "Database & Credit Ledger"
Cohesion: 0.08
Nodes (34): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+26 more)

### Community 6 - "x402 Paywall & Facilitator"
Cohesion: 0.09
Nodes (41): AdminLayout(), acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode(), explorerAddrUrl() (+33 more)

### Community 7 - "Backend Package Config"
Cohesion: 0.06
Nodes (30): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+22 more)

### Community 8 - "Web Package Config"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 9 - "Balance Display & USDC Formatting"
Cohesion: 0.14
Nodes (22): EmailAuthModal(), Props, formatAlgo(), OnchainAccountPanel(), OnchainPanelState, Props, Props, loginWithEmail() (+14 more)

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
Cohesion: 0.18
Nodes (14): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+6 more)

### Community 14 - "Monorepo Root Config"
Cohesion: 0.11
Nodes (18): description, engines, node, name, overrides, lute-connect, private, scripts (+10 more)

### Community 15 - "Shared TypeScript Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 16 - "Example Buyer Agent Script"
Cohesion: 0.22
Nodes (12): main(), LeaseCloseResponse, MIN_RAM_MB, PlatformInfo, postJson(), repoRoot, request(), RunResponse (+4 more)

### Community 17 - "Auth Endpoints & Contributor Deploy"
Cohesion: 0.15
Nodes (13): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Contributor, `DELETE /keys/:id`, `GET /auth/wallet-nonce`, `GET /keys`, GET /lease/:id (+5 more)

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

### Community 36 - "GET /health Endpoint"
Cohesion: 0.12
Nodes (13): Authentication, CORS, `DELETE /x402/leases/:id`, Error index, `GET /lease/:id`, Lease, Overview, Reference (+5 more)

### Community 37 - "GET /keys Endpoint"
Cohesion: 0.12
Nodes (16): AssetInfo, Authentication, Common schemas, CORS, Error envelope, Headers, How payment works, Overview (+8 more)

### Community 38 - "GET /metrics Endpoint"
Cohesion: 0.20
Nodes (15): config, repoRoot, adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis (+7 more)

### Community 39 - "GET /nodes Endpoint"
Cohesion: 0.12
Nodes (21): ExportKeyModal(), Props, GoogleWalletBar(), short(), Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue (+13 more)

### Community 40 - "GET /platform Endpoint"
Cohesion: 0.15
Nodes (24): payingFetch(), PayStage, apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMyNodes() (+16 more)

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (25): `200 OK`, `200 OK`, `200 OK`, `200 OK`, `200 OK`, `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id` (+17 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 45 - "Community 45"
Cohesion: 0.14
Nodes (18): fundedSeconds(), Lease, LeaseStatus, SandboxAccess, activateLease(), closeLease(), expiredLeaseAction(), fundedUntil() (+10 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (12): AlgorandNetwork, DestroyContainerMsg, ExportKeyResponse, Job, NETWORKS, NodeStatus, PlatformTreasury, RegisterNodeRequest (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (12): [{ n }], otherAfter, otherBefore, [{ s }], schemas, chargeUsage(), creditEarnings(), creditTopUp() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.16
Nodes (11): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), fetchMetrics() (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (16): AGENTS.md (caveman rule), Caveman Response Style Convention, Architecture, Being findable (Bazaar discovery), Configuration, Demo script (the money shot), Notes & limitations, Prerequisites (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.31
Nodes (12): issueGoogleExchangeCode(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), touchUserLogin(), disabled(), googleCallback() (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (12): issueGoogleSession(), checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), pending, PendingRequest, PrepareAction (+4 more)

### Community 53 - "Community 53"
Cohesion: 0.28
Nodes (11): accountFromUser(), CustodialAccount, decryptMnemonic(), encryptionKey(), encryptMnemonic(), generateCustodialAccount(), signTransactions(), custodialPayingFetch() (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.44
Nodes (10): issueEmailSession(), createEmailUser(), findUserByEmail(), isEmailAuthEnabled(), disabled(), emailEnabled(), emailLogin(), emailRegister() (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (9): hourly, mainnet, quote, rate, testnet, atomicPerHour(), proratedCost(), usdToAtomic() (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (9): googleAccountInfo, findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGoogleGasGrantEligibility() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.16
Nodes (15): BalanceChart(), Props, Pt, AlgoStat(), Dashboard(), ExplorerLink(), short(), short() (+7 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (14): Backend/registry production deployment, Autonomous consumer agent deployment, Known limitations (custodial, billing granularity, in-memory state), PLATFORM_PAYTO / PLATFORM_PRIVATE_KEY, Web app static SPA deployment, backend/ (registry service), Custodial balance model, example-buyer/ (autonomous consumer agent) (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.32
Nodes (8): Production deployment checklist, Facilitator-sponsored network fee, Algorand blockchain, Bazaar discovery (GoPlausible listing), x402 facilitator (GoPlausible), Testnet/mainnet network switch design, USDC (ASA payment asset), x402 payment protocol

### Community 61 - "Community 61"
Cohesion: 0.13
Nodes (25): addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), sessionFromAuthHeader() (+17 more)

### Community 62 - "Community 62"
Cohesion: 0.15
Nodes (14): ComputeNode, ExplorerNode, isOnline(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (15): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Option A — the bundled agent, Option B — rent a box and SSH into it, Reference (+7 more)

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 65 - "Community 65"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 66 - "Community 66"
Cohesion: 0.80
Nodes (5): Self-hosted BORE_SERVER/BORE_SECRET, Contributor agent deployment, bore tunnel, contributor/ (contributor agent), Ephemeral Docker sandbox (trust model)

### Community 73 - "Community 73"
Cohesion: 0.21
Nodes (10): discoveryExtensions(), RouteDiscovery, serviceMetadata, discovered, payloadFor(), rent, run, service (+2 more)

### Community 74 - "Community 74"
Cohesion: 0.29
Nodes (10): abandonLease(), createLease(), leasesForNode(), nodeBusy(), isOpenSshPubKey(), provision(), rent(), runAnywhere() (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.43
Nodes (7): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo()

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (6): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`

## Ambiguous Edges - Review These
- `🌿 Tendril` → `Caveman Response Style Convention`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **377 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+372 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `🌿 Tendril` and `Caveman Response Style Convention`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Fetch` connect `x402 Paywall & Facilitator` to `Frontend Dashboard & UI Components`, `GET /metrics Endpoint`, `GET /nodes Endpoint`, `GET /platform Endpoint`, `Balance Display & USDC Formatting`, `Backend App Bootstrap`, `Example Buyer Agent Script`, `Community 48`, `Community 51`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `formatUsdc()` connect `Community 58` to `Frontend Dashboard & UI Components`, `Lease Lifecycle & Node Registry`, `GET /nodes Endpoint`, `GET /platform Endpoint`, `Balance Display & USDC Formatting`, `Community 74`, `Community 46`, `Community 48`, `Community 52`, `Community 56`, `Community 61`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Frontend Dashboard & UI Components` to `Wallet & x402 Payment Client`, `Database & Credit Ledger`, `GET /platform Endpoint`, `Community 46`, `Community 58`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `apiError()` (e.g. with `loginWithWallet()` and `topUp()`) actually correct?**
  _`apiError()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _381 weakly-connected nodes found - possible documentation gaps or missing edges._