# Graph Report - .  (2026-09-24)

## Corpus Check
- 12 files · ~87,535 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1130 nodes · 2094 edges · 86 communities (73 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin SPA Shell|Admin SPA Shell]]
- [[_COMMUNITY_Buyer MCP Client|Buyer MCP Client]]
- [[_COMMUNITY_MCP Server Architecture|MCP Server Architecture]]
- [[_COMMUNITY_Contributor Dashboard UI|Contributor Dashboard UI]]
- [[_COMMUNITY_Admin Gas Routes|Admin Gas Routes]]
- [[_COMMUNITY_Backend Package Deps|Backend Package Deps]]
- [[_COMMUNITY_Web Wallet Deps|Web Wallet Deps]]
- [[_COMMUNITY_Marketing Pages Network|Marketing Pages Network]]
- [[_COMMUNITY_Onchain Account Panels|Onchain Account Panels]]
- [[_COMMUNITY_Wallet Auth Modals|Wallet Auth Modals]]
- [[_COMMUNITY_Sandbox WebSocket Protocol|Sandbox WebSocket Protocol]]
- [[_COMMUNITY_x402 Paywall Discovery|x402 Paywall Discovery]]
- [[_COMMUNITY_MCP Package Deps|MCP Package Deps]]
- [[_COMMUNITY_Lease Lifecycle|Lease Lifecycle]]
- [[_COMMUNITY_SSH Key Provisioning|SSH Key Provisioning]]
- [[_COMMUNITY_Admin Frontend Deps|Admin Frontend Deps]]
- [[_COMMUNITY_Contributor API Client|Contributor API Client]]
- [[_COMMUNITY_Root Workspace Scripts|Root Workspace Scripts]]
- [[_COMMUNITY_API Docs Renderer|API Docs Renderer]]
- [[_COMMUNITY_Contributor Package Deps|Contributor Package Deps]]
- [[_COMMUNITY_API Auth Docs|API Auth Docs]]
- [[_COMMUNITY_Admin Auth Config|Admin Auth Config]]
- [[_COMMUNITY_Buyer Agent Deps|Buyer Agent Deps]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Backend Server Bootstrap|Backend Server Bootstrap]]
- [[_COMMUNITY_x402 Billing Docs|x402 Billing Docs]]
- [[_COMMUNITY_Shared Type Contracts|Shared Type Contracts]]
- [[_COMMUNITY_DB Schema Tests|DB Schema Tests]]
- [[_COMMUNITY_API Error Reference|API Error Reference]]
- [[_COMMUNITY_Docker Sandbox Runtime|Docker Sandbox Runtime]]
- [[_COMMUNITY_Node Registry Store|Node Registry Store]]
- [[_COMMUNITY_Metrics Dashboard UI|Metrics Dashboard UI]]
- [[_COMMUNITY_Custodial Sign Confirm|Custodial Sign Confirm]]
- [[_COMMUNITY_Google Auth Backend|Google Auth Backend]]
- [[_COMMUNITY_Custodial Wallet Crypto|Custodial Wallet Crypto]]
- [[_COMMUNITY_TSConfig Base Options|TSConfig Base Options]]
- [[_COMMUNITY_Setup Deployment Guide|Setup Deployment Guide]]
- [[_COMMUNITY_Free Endpoint Docs|Free Endpoint Docs]]
- [[_COMMUNITY_Session Auth Backend|Session Auth Backend]]
- [[_COMMUNITY_Admin TypeScript Config|Admin TypeScript Config]]
- [[_COMMUNITY_Brand Cross-Cutting Bridges|Brand Cross-Cutting Bridges]]
- [[_COMMUNITY_x402 API Reference|x402 API Reference]]
- [[_COMMUNITY_Email Auth Backend|Email Auth Backend]]
- [[_COMMUNITY_Graphify Knowledge Graph|Graphify Knowledge Graph]]
- [[_COMMUNITY_Gas Grant Eligibility|Gas Grant Eligibility]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Custodial Signing Routes|Custodial Signing Routes]]
- [[_COMMUNITY_Caveman Agent Style|Caveman Agent Style]]
- [[_COMMUNITY_Backend TSConfig|Backend TSConfig]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Payment Schema Types|Payment Schema Types]]
- [[_COMMUNITY_Contributor TSConfig|Contributor TSConfig]]
- [[_COMMUNITY_x402 Client Tests|x402 Client Tests]]
- [[_COMMUNITY_Buyer TSConfig|Buyer TSConfig]]
- [[_COMMUNITY_Contributor Payouts|Contributor Payouts]]
- [[_COMMUNITY_Discovery Tests|Discovery Tests]]
- [[_COMMUNITY_HashHero Animation|HashHero Animation]]
- [[_COMMUNITY_CLI Rent Walkthrough|CLI Rent Walkthrough]]
- [[_COMMUNITY_Buyer TSConfig Small|Buyer TSConfig Small]]
- [[_COMMUNITY_Pricing Format Tests|Pricing Format Tests]]
- [[_COMMUNITY_Wallet Verify Helpers|Wallet Verify Helpers]]
- [[_COMMUNITY_Balance Chart Types|Balance Chart Types]]
- [[_COMMUNITY_GPU Spec Detection|GPU Spec Detection]]
- [[_COMMUNITY_OG Hero Illustration|OG Hero Illustration]]
- [[_COMMUNITY_Open Graph Social Card|Open Graph Social Card]]
- [[_COMMUNITY_Buyer Config|Buyer Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
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
10. `api()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `formatUsdc()` --semantically_similar_to--> `USDC`  [INFERRED] [semantically similar]
  AGENTS.md → web/index.html
- `Admin SPA` --semantically_similar_to--> `SPA Entry main.tsx`  [INFERRED] [semantically similar]
  AGENTS.md → web/index.html
- `Lease Watchdog` --semantically_similar_to--> `MCP Spend Cap (TENDRIL_MAX_ATOMIC)`  [INFERRED] [semantically similar]
  README.md → docs/mcp.md
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `Backend / Registry`  [INFERRED]
  DEPLOY.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **x402 Verify-Provision-Settle Flow** — readme_x402, readme_x402_facilitator, readme_backend_registry, readme_credit_balance [EXTRACTED 1.00]
- **Metered Lease Lifecycle** — readme_metered_ssh_session, readme_watchdog, readme_ephemeral_sandbox, readme_earnings_withdrawal [EXTRACTED 1.00]
- **MCP One-Shot Job Recipe** — docs_mcp_server, docs_mcp_tendril_platform, docs_mcp_tendril_topup, docs_mcp_tendril_run [EXTRACTED 1.00]

## Communities (86 total, 13 thin omitted)

### Community 0 - "Admin SPA Shell"
Cohesion: 0.09
Nodes (43): AdminLayout(), acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode(), explorerAddrUrl() (+35 more)

### Community 1 - "Buyer MCP Client"
Cohesion: 0.09
Nodes (44): main(), authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName() (+36 more)

### Community 2 - "MCP Server Architecture"
Cohesion: 0.06
Nodes (45): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Registry HTTP API, Tendril MCP Server, MCP Spend Cap (TENDRIL_MAX_ATOMIC), tendril_account, tendril_lease (+37 more)

### Community 3 - "Contributor Dashboard UI"
Cohesion: 0.14
Nodes (27): Contribute(), Props, ExplorerLink(), Props, short(), Explore(), Props, fmtCountdown() (+19 more)

### Community 4 - "Admin Gas Routes"
Cohesion: 0.08
Nodes (33): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+25 more)

### Community 5 - "Backend Package Deps"
Cohesion: 0.06
Nodes (30): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+22 more)

### Community 6 - "Web Wallet Deps"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 7 - "Marketing Pages Network"
Cohesion: 0.09
Nodes (16): About(), Dashboard(), Marketplace(), network, PayStage, serializeSigner(), walletQueue, REGISTRY_URL (+8 more)

### Community 8 - "Onchain Account Panels"
Cohesion: 0.16
Nodes (23): BalanceChart(), AlgoStat(), GoogleWalletBar(), short(), formatAlgo(), OnchainAccountPanel(), OnchainPanelState, Props (+15 more)

### Community 9 - "Wallet Auth Modals"
Cohesion: 0.11
Nodes (21): EmailAuthModal(), Props, ExportKeyModal(), Props, GoogleCallback(), Props, Props, exchangeGoogleCode() (+13 more)

### Community 10 - "Sandbox WebSocket Protocol"
Cohesion: 0.10
Nodes (23): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, handleRun(), HeartbeatMsg (+15 more)

### Community 11 - "x402 Paywall Discovery"
Cohesion: 0.19
Nodes (20): RouteDiscovery, serviceMetadata, PaidRequest, requirePayment(), challenge(), facilitator, fail(), feePayer() (+12 more)

### Community 12 - "MCP Package Deps"
Cohesion: 0.09
Nodes (21): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @tendril/shared, tsx (+13 more)

### Community 13 - "Lease Lifecycle"
Cohesion: 0.15
Nodes (19): fundedSeconds(), proratedCost(), abandonLease(), activateLease(), closeLease(), createLease(), expiredLeaseAction(), fundedUntil() (+11 more)

### Community 14 - "SSH Key Provisioning"
Cohesion: 0.14
Nodes (17): syncGasGrantEligibility, Handler, isOpenSshPubKey(), mintKey(), provision(), ProvisionArgs, releaseLease(), rent() (+9 more)

### Community 15 - "Admin Frontend Deps"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 16 - "Contributor API Client"
Cohesion: 0.25
Nodes (18): payingFetch(), apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes() (+10 more)

### Community 17 - "Root Workspace Scripts"
Cohesion: 0.10
Nodes (19): description, engines, node, name, overrides, lute-connect, private, scripts (+11 more)

### Community 18 - "API Docs Renderer"
Cohesion: 0.12
Nodes (11): DOCS, Group, Heading, MdDocId, Section, ArchDiagram(), Docs(), DocTab (+3 more)

### Community 19 - "Contributor Package Deps"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 20 - "API Auth Docs"
Cohesion: 0.13
Nodes (18): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Authentication, Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys` (+10 more)

### Community 21 - "Admin Auth Config"
Cohesion: 0.20
Nodes (15): config, repoRoot, adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis (+7 more)

### Community 22 - "Buyer Agent Deps"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 23 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 24 - "Backend Server Bootstrap"
Cohesion: 0.18
Nodes (14): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+6 more)

### Community 25 - "x402 Billing Docs"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 26 - "Shared Type Contracts"
Cohesion: 0.12
Nodes (16): AlgorandNetwork, AssetInfo, ExportKeyResponse, Job, Lease, LeaseBilling, LeaseStatus, NETWORKS (+8 more)

### Community 27 - "DB Schema Tests"
Cohesion: 0.20
Nodes (13): inTransaction(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, walletSummary(), chargeUsage() (+5 more)

### Community 28 - "API Error Reference"
Cohesion: 0.17
Nodes (16): CORS, DELETE /x402/leases/:id (api.md), Error index, Paid endpoints, Reference, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway` (+8 more)

### Community 29 - "Docker Sandbox Runtime"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 30 - "Node Registry Store"
Cohesion: 0.18
Nodes (12): isOnline(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes, pickBestValueNode(), add() (+4 more)

### Community 31 - "Metrics Dashboard UI"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 32 - "Custodial Sign Confirm"
Cohesion: 0.19
Nodes (11): Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), PendingConfirm, confirmCustodial(), CustodialAction (+3 more)

### Community 33 - "Google Auth Backend"
Cohesion: 0.29
Nodes (13): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), findUserById(), disabled() (+5 more)

### Community 34 - "Custodial Wallet Crypto"
Cohesion: 0.25
Nodes (12): accountFromUser(), CustodialAccount, decryptMnemonic(), encryptionKey(), encryptMnemonic(), generateCustodialAccount(), signTransactions(), custodialPayingFetch() (+4 more)

### Community 35 - "TSConfig Base Options"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 36 - "Setup Deployment Guide"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 37 - "Free Endpoint Docs"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 38 - "Session Auth Backend"
Cohesion: 0.18
Nodes (12): addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), sessionFromAuthHeader() (+4 more)

### Community 39 - "Admin TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 40 - "Brand Cross-Cutting Bridges"
Cohesion: 0.23
Nodes (12): Admin SPA, Custodial Auth, formatUsdc(), Algorand, SPA Entry main.tsx, Open Graph Metadata, Sandboxed SSH Machine Rental, TENDRIL (+4 more)

### Community 41 - "x402 API Reference"
Cohesion: 0.17
Nodes (11): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Table of contents, Tendril x402 API (+3 more)

### Community 42 - "Email Auth Backend"
Cohesion: 0.39
Nodes (11): issueEmailSession(), createEmailUser(), findUserByEmail(), isEmailAuthEnabled(), touchUserLogin(), disabled(), emailEnabled(), emailLogin() (+3 more)

### Community 43 - "Graphify Knowledge Graph"
Cohesion: 0.24
Nodes (11): graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Fast Path, Graphify Full Pipeline, Graphify Query, NetworkX Fallback Traversal (+3 more)

### Community 44 - "Gas Grant Eligibility"
Cohesion: 0.33
Nodes (9): GoogleAccountInfo, findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGoogleGasGrantEligibility() (+1 more)

### Community 45 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 46 - "Custodial Signing Routes"
Cohesion: 0.24
Nodes (9): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), pending, PendingRequest, PrepareAction, prepareCustodialSign() (+1 more)

### Community 47 - "Caveman Agent Style"
Cohesion: 0.25
Nodes (4): Auto-Clarity, Caveman Response Style, Caveman Switch Levels, Code Commit PR Boundaries

### Community 48 - "Backend TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 49 - "Shared TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 50 - "Payment Schema Types"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 51 - "Contributor TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 52 - "x402 Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 53 - "Buyer TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 54 - "Contributor Payouts"
Cohesion: 0.43
Nodes (7): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo()

### Community 55 - "Discovery Tests"
Cohesion: 0.29
Nodes (7): discoveryExtensions(), discovered, payloadFor(), rent, run, service, topup

### Community 56 - "HashHero Animation"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 57 - "CLI Rent Walkthrough"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

### Community 58 - "Buyer TSConfig Small"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 59 - "Pricing Format Tests"
Cohesion: 0.33
Nodes (5): hourly, mainnet, quote, rate, testnet

### Community 60 - "Wallet Verify Helpers"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 61 - "Balance Chart Types"
Cohesion: 0.60
Nodes (4): Props, Pt, Charge, TopUp

### Community 62 - "GPU Spec Detection"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 63 - "OG Hero Illustration"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 64 - "Open Graph Social Card"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 66 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 67 - "Tendril Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

## Knowledge Gaps
- **397 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Contributor Dashboard UI` to `Buyer MCP Client`, `Admin Gas Routes`, `Marketing Pages Network`, `Contributor API Client`, `Shared Type Contracts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `formatUsdc()` connect `Onchain Account Panels` to `Contributor Dashboard UI`, `Wallet Auth Modals`, `Custodial Signing Routes`, `SSH Key Provisioning`, `Contributor API Client`, `Shared Type Contracts`, `Pricing Format Tests`, `Balance Chart Types`, `Metrics Dashboard UI`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Fetch` connect `Admin SPA Shell` to `Custodial Sign Confirm`, `Buyer MCP Client`, `Google Auth Backend`, `Marketing Pages Network`, `Onchain Account Panels`, `Wallet Auth Modals`, `Contributor API Client`, `Admin Auth Config`, `Backend Server Bootstrap`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _408 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin SPA Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `Buyer MCP Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08979591836734693 - nodes in this community are weakly interconnected._