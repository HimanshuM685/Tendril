# Graph Report - Tendril  (2026-10-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1832 nodes · 3720 edges · 131 communities (104 shown, 27 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 238 edges (avg confidence: 0.96)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1dea539`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/api.ts
- server.ts
- WalletBar.tsx
- backend/package.json
- Leedlime landing page
- Backend / Registry
- web/src/App.tsx
- mcp/package.json
- shared/src/index.ts
- docs-web/package.json
- db.ts
- tools.ts
- routes.ts
- docker.ts
- leases.ts
- admin/package.json
- contributor.ts
- src/api.ts
- registry.ts
- custodialSign.ts
- contributor/package.json
- example-buyer/package.json
- McpModal.tsx
- Session
- scripts
- api.md
- example-buyer/src/index.ts
- web/package.json
- NotebookSection.tsx
- compilerOptions
- `POST /x402/run`
- modal.ts
- notebookRunner.ts
- `POST /topup`
- Explore.tsx
- compilerOptions
- config
- compilerOptions
- credit.ts
- backend/src/config.ts
- runAnywhere
- emailAuth.ts
- hosted.ts
- painting1.jpg
- Alpine Mountain Lake Landscape Painting
- 3. Production deployment
- Overview
- dependencies
- Field landscape painting
- x402-api.md
- Full Pipeline
- Docs.tsx
- Metrics.tsx
- perplexity.svg
- painting2.jpg
- agentmesh.svg
- Clouds Painting
- grok.svg
- CustodialSignContext.tsx
- compilerOptions
- ref_next
- Common schemas
- googleAuth.ts
- ref_node_assert
- Tendril MCP
- docs.ts
- gasGrant.ts
- ArchDiagram.tsx
- Build on Tendril
- Six-Petal Radial Hexagram
- Renting from the CLI
- shared/package.json
- backend/tsconfig.json
- contributor/tsconfig.json
- Tendril Open Graph Social Preview
- favicon.svg
- example-buyer/tsconfig.json
- Docker Backend Service
- Tendril Favicon Mark
- Caveman
- Algorand logo
- Defly
- pera.svg
- mcp/tsconfig.json
- components/Dashboard.tsx
- One-shot Jobs
- Architecture & Flow
- Consumer Tools
- Contributor Tools
- docs-runtime.tsx
- shared/tsconfig.json
- devDependencies
- x402Client.test.ts
- Algorand Settlement
- Per-Second Metering
- USDC with x402
- tendril_account
- tendril_list_nodes
- tendril_rent
- tendril_run
- tendril_topup
- tendril_withdraw
- Security & Sandboxes
- SSH Access & Keys
- Getting started
- Sandboxes & Bore Tunnels
- Algorand settlement basics
- BalanceChart.tsx
- scripts
- web/src/app/client-shell.tsx
- admin/vercel.json
- docs-web/src/app/layout.tsx
- docs-web/vercel.json
- Welcome to Tendril
- web/vercel.json
- web/next.config.ts
- entrypoint.sh
- types.d.ts

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 33 edges
2. `formatUsdc()` - 31 edges
3. `Session` - 28 edges
4. `config` - 25 edges
5. `runAnywhere()` - 24 edges
6. `WalletBar()` - 24 edges
7. `App()` - 21 edges
8. `SignTransactions` - 21 edges
9. `creditBalance()` - 18 edges
10. `api()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Lease Watchdog` --semantically_similar_to--> `Spend Cap`  [INFERRED] [semantically similar]
  README.md → docs/mcp.md
- `rent()` --indirect_call--> `signTransactions()`  [INFERRED]
  web/src/components/Explore.tsx → backend/src/custodialWallet.ts
- `run()` --indirect_call--> `signTransactions()`  [INFERRED]
  web/src/components/NotebookSection.tsx → backend/src/custodialWallet.ts
- `deposit()` --indirect_call--> `signTransactions()`  [INFERRED]
  web/src/components/TopUpControl.tsx → backend/src/custodialWallet.ts
- `prepareCustodialSign()` --calls--> `formatUsdc()`  [EXTRACTED]
  backend/src/custodialSign.ts → shared/src/index.ts

## Import Cycles
- 4-file cycle: `backend/src/leases.ts -> backend/src/providers/index.ts -> backend/src/providers/contributor.ts -> backend/src/ws.ts -> backend/src/leases.ts`

## Communities (131 total, 27 thin omitted)

### Community 0 - "lib/api.ts"
Cohesion: 0.08
Nodes (55): Dashboard(), fmtAlgo(), fmtUsdc(), Filter, FILTERS, fmtAlgo(), fmtDate(), GasRequests() (+47 more)

### Community 1 - "server.ts"
Cohesion: 0.08
Nodes (47): initDb(), app, corsOrigin, main(), startWatchdog(), warmNotebookImage(), router, topUp() (+39 more)

### Community 2 - "WalletBar.tsx"
Cohesion: 0.10
Nodes (39): EmailSessionResponse, formatUsdc(), formatUsdcExact(), GasRequestInfo, GoogleAccountResponse, GoogleSessionResponse, WalletLoginResponse, ConnectWalletModal() (+31 more)

### Community 3 - "backend/package.json"
Cohesion: 0.04
Nodes (48): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, modal, nanoid (+40 more)

### Community 4 - "Leedlime landing page"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 5 - "Backend / Registry"
Cohesion: 0.07
Nodes (27): Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Claude Desktop Client, Model Context Protocol, Registry HTTP API, Spend Cap, Tendril MCP, x402 Payment (+19 more)

### Community 6 - "web/src/App.tsx"
Cohesion: 0.08
Nodes (37): @txnlab/use-wallet-react, REGISTRY_URL, App(), signIn(), ConnectWalletModal, Dashboard, DocsRedirect, GoogleCallback (+29 more)

### Community 7 - "mcp/package.json"
Cohesion: 0.04
Nodes (43): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @x402/avm, @x402/core (+35 more)

### Community 8 - "shared/src/index.ts"
Cohesion: 0.07
Nodes (35): agentSockets, pendingContainers, pendingJobs, activeLeases, AgentHelloMsg, ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2, AlgorandNetwork (+27 more)

### Community 9 - "docs-web/package.json"
Cohesion: 0.05
Nodes (35): dependencies, marked, next, react, react-dom, react-router-dom, devDependencies, @playwright/test (+27 more)

### Community 10 - "db.ts"
Cohesion: 0.08
Nodes (34): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+26 more)

### Community 11 - "tools.ts"
Cohesion: 0.15
Nodes (33): authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName(), paidAuthedJson() (+25 more)

### Community 12 - "routes.ts"
Cohesion: 0.11
Nodes (28): addressFromSession(), AdminInfo, isCustodialSessionKind(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), sessionFromAuthHeader(), SessionInfo (+20 more)

### Community 13 - "docker.ts"
Cohesion: 0.12
Nodes (22): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SANDBOX_CTX, SandboxEndpoint (+14 more)

### Community 14 - "leases.ts"
Cohesion: 0.13
Nodes (27): abandonLease(), activateLease(), closeLease(), createLease(), earnsPayout(), expiredLeaseAction(), failLease(), fundedUntil() (+19 more)

### Community 15 - "admin/package.json"
Cohesion: 0.07
Nodes (29): dependencies, next, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/node (+21 more)

### Community 16 - "contributor.ts"
Cohesion: 0.12
Nodes (24): NewLease, RunJobResult, contributorProvider, destroy(), exec(), id, start(), providers (+16 more)

### Community 17 - "src/api.ts"
Cohesion: 0.16
Nodes (26): signTransactions(), apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes() (+18 more)

### Community 18 - "registry.ts"
Cohesion: 0.11
Nodes (25): toExplorer(), getLease(), heldLease(), leaseByPayment(), leasesForNode(), waitForLeaseAccess(), getNode(), listNodesByOwner() (+17 more)

### Community 19 - "custodialSign.ts"
Cohesion: 0.13
Nodes (22): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), failPaid(), pending, PendingRequest, PrepareAction (+14 more)

### Community 20 - "contributor/package.json"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+18 more)

### Community 21 - "example-buyer/package.json"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+18 more)

### Community 22 - "McpModal.tsx"
Cohesion: 0.12
Nodes (20): DocsRedirect(), HashHero(), HashHeroProps, prefersReducedMotion(), randomGlyph(), randomHex(), ROWS, FAQ_ITEMS (+12 more)

### Community 23 - "Session"
Cohesion: 0.19
Nodes (21): ApiKeyInfo, CreateApiKeyResponse, usdToAtomic(), WalletSummary, Session, Props, Props, Props (+13 more)

### Community 24 - "scripts"
Cohesion: 0.08
Nodes (24): description, engines, node, name, overrides, lute-connect, private, scripts (+16 more)

### Community 25 - "api.md"
Cohesion: 0.13
Nodes (18): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Authentication, Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys` (+10 more)

### Community 26 - "example-buyer/src/index.ts"
Cohesion: 0.11
Nodes (18): config, repoRoot, Fetch, main(), MIN_RAM_MB, postJson(), REGISTRY, repoRoot (+10 more)

### Community 27 - "web/package.json"
Cohesion: 0.09
Nodes (22): @blockshake/defly-connect, buffer, lute-connect, @perawallet/connect, process, algosdk, next, react (+14 more)

### Community 28 - "NotebookSection.tsx"
Cohesion: 0.18
Nodes (19): RunJobResponse, runNotebook(), asText(), availabilityCopy(), cellsFrom(), clip(), downloadBlob(), fmtBytes() (+11 more)

### Community 29 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 30 - "`POST /x402/run`"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 31 - "modal.ts"
Cohesion: 0.19
Nodes (18): buildImage(), destroy(), drop(), ensureImage(), exec(), execText(), id, jupyterAccess() (+10 more)

### Community 32 - "notebookRunner.ts"
Cohesion: 0.16
Nodes (12): notebookToPayload(), parseNotebookRun(), execute(), executeNotebook(), notebook(), JOB_LOG_MAX_BYTES, JOB_RESULT_MAX_BYTES, NOTEBOOK_ARTIFACT_BYTES (+4 more)

### Community 33 - "`POST /topup`"
Cohesion: 0.17
Nodes (14): CORS, DELETE /x402/leases/:id (api.md), Error index, Paid endpoints, Reference, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway` (+6 more)

### Community 34 - "Explore.tsx"
Cohesion: 0.21
Nodes (17): LeaseStatus, ActiveLease, releaseLease(), rentNode(), toActiveLease(), writeClipboard(), Explore(), copy() (+9 more)

### Community 35 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 36 - "config"
Cohesion: 0.16
Nodes (15): config, hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo() (+7 more)

### Community 37 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 38 - "credit.ts"
Cohesion: 0.29
Nodes (15): inTransaction(), ledger(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, addCredit() (+7 more)

### Community 39 - "backend/src/config.ts"
Cohesion: 0.24
Nodes (13): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, issueAdminExchangeCode(), issueAdminSession() (+5 more)

### Community 40 - "runAnywhere"
Cohesion: 0.19
Nodes (13): issueLeaseToken(), sandboxLifetimeMs(), hasLivePayerLease(), nodeBusy(), pickNotebookHost(), provision(), runAnywhere(), toRentResponse() (+5 more)

### Community 41 - "emailAuth.ts"
Cohesion: 0.31
Nodes (13): issueEmailSession(), createEmailUser(), findUserByEmail(), isEmailAuthEnabled(), touchUserLogin(), disabled(), emailEnabled(), emailLogin() (+5 more)

### Community 42 - "hosted.ts"
Cohesion: 0.23
Nodes (13): clampMarkup(), HOSTED_SKUS, hostedById(), hostedCatalog(), hostedHourlyUsd(), HostedSku, MODAL_CPU_USD_PER_CORE_HOUR, MODAL_GPU_USD_PER_HOUR (+5 more)

### Community 43 - "painting1.jpg"
Cohesion: 0.28
Nodes (12): French farmhouse motif, Impressionist rural landscape, Dirt lane, Right fence post, Garden hedges, Main stone cottage, Side stone cottage, Cloudy sky (+4 more)

### Community 44 - "Alpine Mountain Lake Landscape Painting"
Cohesion: 0.28
Nodes (13): Alpine Lake, Alpine Mountain Lake Landscape Painting, Scattered Grey Boulders, Central Snow-Capped Mountain Peak, Cloud-Filled Blue Sky, Foreground Coniferous Pines, Flanking Rocky Mountain Ridges, Forested Midground Slopes (+5 more)

### Community 45 - "3. Production deployment"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 46 - "Overview"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 47 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, algosdk, @blockshake/defly-connect, buffer, lute-connect, next, @perawallet/connect, process (+7 more)

### Community 48 - "Field landscape painting"
Cohesion: 0.27
Nodes (12): Field landscape painting, Horizontal landscape composition, Two seated figures, Rolling green hills, Wildflower meadow, Green-blue-cream palette, Dirt path, Artist signature (+4 more)

### Community 50 - "x402-api.md"
Cohesion: 0.17
Nodes (11): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Table of contents, Tendril x402 API (+3 more)

### Community 51 - "Full Pipeline"
Cohesion: 0.20
Nodes (11): Full Pipeline, God Nodes, graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Query, NetworkX (+3 more)

### Community 53 - "Docs.tsx"
Cohesion: 0.23
Nodes (12): ArchDiagram(), Docs(), copy(), onContentClick(), FeatureCards(), groups, searchIndex, Toc() (+4 more)

### Community 54 - "Metrics.tsx"
Cohesion: 0.23
Nodes (13): MetricPoint, Metrics, RankRow, Board(), BoardTab, ChartRange, fmtDur(), fmtUsdc() (+5 more)

### Community 55 - "perplexity.svg"
Cohesion: 0.25
Nodes (7): Claude (Anthropic), web/public/assets, Claude starburst path, Perplexity, currentColor fill, logo path, svg root

### Community 56 - "painting2.jpg"
Cohesion: 0.31
Nodes (8): Clouded blue sky, White wildflower meadow, Distant village roofs, Impressionist pastoral landscape, Left tree cluster, Winding dirt path, Pastoral calm atmosphere, Seated pair on path

### Community 57 - "agentmesh.svg"
Cohesion: 0.32
Nodes (7): AgentMesh brand/UI mark, currentColor fill, Display size 20x16, Filled path silhouette, Web public static asset, AgentMesh SVG icon, viewBox 2 5 58 44

### Community 58 - "Clouds Painting"
Cohesion: 0.43
Nodes (8): Clouds Painting, Soft Atmospheric Mood, Panoramic Cloudscape, Cumulus Cloud Forms, Horizontal Banner Format, Impasto Oil Technique, Light and Shadow Cloud Modeling, Sage Green Monochrome Palette

### Community 59 - "grok.svg"
Cohesion: 0.29
Nodes (7): Grok (xAI), currentColor fill, Grok mark lower path, Grok mark upper path, USDC logo, USDC (USD Coin), USDC compound path

### Community 60 - "CustodialSignContext.tsx"
Cohesion: 0.22
Nodes (11): SignPrepareResponse, Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), approve(), PendingConfirm (+3 more)

### Community 61 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 62 - "ref_next"
Cohesion: 0.15
Nodes (4): nextConfig, metadata, nextConfig, metadata

### Community 63 - "Common schemas"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 64 - "googleAuth.ts"
Cohesion: 0.31
Nodes (12): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), disabled(), googleCallback() (+4 more)

### Community 65 - "ref_node_assert"
Cohesion: 0.17
Nodes (8): rate, simultaneous, hourly, mainnet, quote, rate, testnet, atomicPerHour()

### Community 66 - "Tendril MCP"
Cohesion: 0.25
Nodes (8): AVM_PRIVATE_KEY, @tendril/mcp-server, TENDRIL_API_KEY, tendril_list_nodes, Tendril MCP, tendril_platform, Tendril registry, x402

### Community 67 - "docs.ts"
Cohesion: 0.18
Nodes (11): pages, buildAnchors, DOC_PAGES, DocHeading, DocPage, DocsTab, legacyAnchors, markdownRoutes (+3 more)

### Community 68 - "gasGrant.ts"
Cohesion: 0.32
Nodes (10): googleAccountInfo, findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGasGrantEligibility (+2 more)

### Community 69 - "ArchDiagram.tsx"
Cohesion: 0.17
Nodes (11): compactEdges, compactNodes, Connection, EdgeId, edges, FlowMode, NodeId, nodes (+3 more)

### Community 70 - "Build on Tendril"
Cohesion: 0.20
Nodes (9): Autonomous Agent Tool Loop, Become a Provider, Best-Value Scoring Algorithm, Build on Tendril, Claude Desktop, Cursor, Claude Code, VS Code, Earnings & On-Chain Payouts, Installing & Running the Daemon, Model Context Protocol (MCP) (+1 more)

### Community 71 - "Six-Petal Radial Hexagram"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 73 - "Renting from the CLI"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

### Community 74 - "shared/package.json"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 75 - "backend/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 76 - "contributor/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 77 - "Tendril Open Graph Social Preview"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 78 - "favicon.svg"
Cohesion: 0.67
Nodes (3): Brand green #0B5D3A, Cream #F4F1EA, Serif T mark

### Community 79 - "example-buyer/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 80 - "Docker Backend Service"
Cohesion: 0.50
Nodes (3): Docker Backend Service, Docker Buyer Service, Docker Contributor Service

### Community 81 - "Tendril Favicon Mark"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 82 - "Caveman"
Cohesion: 0.67
Nodes (3): Auto-Clarity, Boundaries, Caveman

### Community 83 - "Algorand logo"
Cohesion: 0.67
Nodes (3): Algorand logo, Algorand, Algorand glyph path

### Community 86 - "mcp/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 87 - "components/Dashboard.tsx"
Cohesion: 0.46
Nodes (7): explorerAddrUrl(), explorerTxUrl(), BalanceChart(), Dashboard(), fmtDuration(), resolveStats(), short()

### Community 88 - "One-shot Jobs"
Cohesion: 0.29
Nodes (6): Execute & collect output, Machine selection, Notebook jobs, One-shot Jobs, Request a quote, Sandbox lifetime

### Community 89 - "Architecture & Flow"
Cohesion: 0.29
Nodes (6): Architecture & Flow, Core Architectural Pillars, Machine Lifecycle, Overview, Request Flow, Settlement Flow

### Community 92 - "docs-runtime.tsx"
Cohesion: 0.48
Nodes (4): ClientShell(), DocsRuntime, DocsRuntime(), Page()

### Community 93 - "shared/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../tsconfig.base.json

### Community 94 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @tendril/shared, @types/node, @types/react, @types/react-dom, typescript, webpack

### Community 95 - "x402Client.test.ts"
Cohesion: 0.43
Nodes (6): main(), serializeSigner(), SignTransactions, sleep(), waitForSlot(), walletQueue

### Community 96 - "Algorand Settlement"
Cohesion: 0.33
Nodes (5): Algorand Settlement, Contributor withdrawals, Deposits & prepaid credit, Network & asset, Sponsored transaction fees

### Community 97 - "Per-Second Metering"
Cohesion: 0.33
Nodes (5): Charged once, Grace window, One-shot jobs & payouts, Per-Second Metering, Usage calculation

### Community 98 - "USDC with x402"
Cohesion: 0.33
Nodes (5): Integrate a client, Payment challenge, Sign & retry, USDC with x402, Verify → work → settle

### Community 106 - "Security & Sandboxes"
Cohesion: 0.33
Nodes (5): Credentials, Isolation controls, Network access, Security & Sandboxes, Teardown & persistence

### Community 107 - "SSH Access & Keys"
Cohesion: 0.33
Nodes (5): Connect to your sandbox, Host keys, Save work & release, SSH Access & Keys, Use a public key

### Community 108 - "Getting started"
Cohesion: 0.33
Nodes (5): Connect & sign in, Getting started, Release your machine, Rent & SSH or run, Top up USDC

### Community 109 - "Sandboxes & Bore Tunnels"
Cohesion: 0.40
Nodes (4): Connection details, Disposable execution, Outbound tunnel, Sandboxes & Bore Tunnels

### Community 110 - "Algorand settlement basics"
Cohesion: 0.40
Nodes (4): Algorand settlement basics, Discover the network, Pay with sponsored fees, Prepare USDC

### Community 111 - "BalanceChart.tsx"
Cohesion: 0.60
Nodes (4): Charge, TopUp, Props, Pt

### Community 112 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, start, typecheck

### Community 113 - "web/src/app/client-shell.tsx"
Cohesion: 0.70
Nodes (3): ClientShell(), WebRuntime, Page()

### Community 114 - "admin/vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 116 - "docs-web/vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 117 - "Welcome to Tendril"
Cohesion: 0.50
Nodes (3): Choose your path, How Tendril fits together, Welcome to Tendril

### Community 118 - "web/vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

## Knowledge Gaps
- **674 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `type` (+669 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 746 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api()` connect `tools.ts` to `docs.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _674 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0781387181738367 - nodes in this community are weakly interconnected._
- **Why does `express` connect `server.ts` to `googleAuth.ts`, `backend/package.json`, `backend/src/config.ts`, `emailAuth.ts`, `db.ts`, `routes.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07792207792207792 - nodes in this community are weakly interconnected._
- **Why does `Endpoints` connect ``POST /x402/run`` to ``POST /topup``, `x402-api.md`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `WalletBar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1027450980392157 - nodes in this community are weakly interconnected._