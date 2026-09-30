# Graph Report - .  (2026-09-30)

## Corpus Check
- 7 files · ~338,828 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1382 nodes · 2506 edges · 101 communities (90 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin App Shell|Admin App Shell]]
- [[_COMMUNITY_Admin Portal Docs|Admin Portal Docs]]
- [[_COMMUNITY_Contributor Provider|Contributor Provider]]
- [[_COMMUNITY_Explore And Contribute|Explore And Contribute]]
- [[_COMMUNITY_Admin Route Guards|Admin Route Guards]]
- [[_COMMUNITY_Leedlime Landing|Leedlime Landing]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Example Buyer Client|Example Buyer Client]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_Web Wallet Dependencies|Web Wallet Dependencies]]
- [[_COMMUNITY_Route Discovery|Route Discovery]]
- [[_COMMUNITY_Wallet Account Client|Wallet Account Client]]
- [[_COMMUNITY_Lease Types|Lease Types]]
- [[_COMMUNITY_Lease Lookup|Lease Lookup]]
- [[_COMMUNITY_Contribute Dashboard|Contribute Dashboard]]
- [[_COMMUNITY_Admin Google Auth|Admin Google Auth]]
- [[_COMMUNITY_Export Key Modal|Export Key Modal]]
- [[_COMMUNITY_Contributor Runtime|Contributor Runtime]]
- [[_COMMUNITY_MCP Package|MCP Package]]
- [[_COMMUNITY_Admin Package|Admin Package]]
- [[_COMMUNITY_Root Package|Root Package]]
- [[_COMMUNITY_Contributor Package|Contributor Package]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Balance Chart|Balance Chart]]
- [[_COMMUNITY_Buyer Package|Buyer Package]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_x402 Lease Docs|x402 Lease Docs]]
- [[_COMMUNITY_x402 Paying Fetch|x402 Paying Fetch]]
- [[_COMMUNITY_Backend Boot|Backend Boot]]
- [[_COMMUNITY_Notebook Section|Notebook Section]]
- [[_COMMUNITY_Web SPA Entry|Web SPA Entry]]
- [[_COMMUNITY_Wallet Connect Modal|Wallet Connect Modal]]
- [[_COMMUNITY_x402 Client Recipes|x402 Client Recipes]]
- [[_COMMUNITY_Shared Network Types|Shared Network Types]]
- [[_COMMUNITY_Docker Sandbox|Docker Sandbox]]
- [[_COMMUNITY_Metrics Board|Metrics Board]]
- [[_COMMUNITY_Explorer Index|Explorer Index]]
- [[_COMMUNITY_Google Auth|Google Auth]]
- [[_COMMUNITY_Custodial Wallet|Custodial Wallet]]
- [[_COMMUNITY_Base TypeScript Config|Base TypeScript Config]]
- [[_COMMUNITY_Cottage Painting|Cottage Painting]]
- [[_COMMUNITY_Alpine Lake Painting|Alpine Lake Painting]]
- [[_COMMUNITY_Deploy Guide|Deploy Guide]]
- [[_COMMUNITY_API Error Reference|API Error Reference]]
- [[_COMMUNITY_Free Read Endpoints|Free Read Endpoints]]
- [[_COMMUNITY_Admin TypeScript Config|Admin TypeScript Config]]
- [[_COMMUNITY_Field Painting|Field Painting]]
- [[_COMMUNITY_Lime Field Painting|Lime Field Painting]]
- [[_COMMUNITY_API Auth Docs|API Auth Docs]]
- [[_COMMUNITY_Email Auth Users|Email Auth Users]]
- [[_COMMUNITY_Custodial Signing|Custodial Signing]]
- [[_COMMUNITY_Graphify Agent Rules|Graphify Agent Rules]]
- [[_COMMUNITY_Hills Smudge Painting|Hills Smudge Painting]]
- [[_COMMUNITY_Shared Package|Shared Package]]
- [[_COMMUNITY_Gas Grant Records|Gas Grant Records]]
- [[_COMMUNITY_Claude Perplexity Marks|Claude Perplexity Marks]]
- [[_COMMUNITY_Daisy Field Painting|Daisy Field Painting]]
- [[_COMMUNITY_Key Management Docs|Key Management Docs]]
- [[_COMMUNITY_Format Tests|Format Tests]]
- [[_COMMUNITY_AgentMesh Logo|AgentMesh Logo]]
- [[_COMMUNITY_Cloudscape Painting|Cloudscape Painting]]
- [[_COMMUNITY_Grok USDC Marks|Grok USDC Marks]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Contributor TypeScript Config|Contributor TypeScript Config]]
- [[_COMMUNITY_x402 Schemas|x402 Schemas]]
- [[_COMMUNITY_Buyer TypeScript Config|Buyer TypeScript Config]]
- [[_COMMUNITY_x402 Client Tests|x402 Client Tests]]
- [[_COMMUNITY_MCP TypeScript Config|MCP TypeScript Config]]
- [[_COMMUNITY_Contributor Payouts|Contributor Payouts]]
- [[_COMMUNITY_Hash Hero|Hash Hero]]
- [[_COMMUNITY_ChatGPT Logo|ChatGPT Logo]]
- [[_COMMUNITY_Shared TypeScript Config|Shared TypeScript Config]]
- [[_COMMUNITY_Wallet Signing|Wallet Signing]]
- [[_COMMUNITY_Hardware Specs|Hardware Specs]]
- [[_COMMUNITY_Open Graph Card|Open Graph Card]]
- [[_COMMUNITY_Favicon Mark|Favicon Mark]]
- [[_COMMUNITY_Contributor Config|Contributor Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Wallet Auth Endpoints|Wallet Auth Endpoints]]
- [[_COMMUNITY_Public Favicon|Public Favicon]]
- [[_COMMUNITY_Caveman Mode Rules|Caveman Mode Rules]]
- [[_COMMUNITY_Algorand Logo|Algorand Logo]]
- [[_COMMUNITY_Defly Logo|Defly Logo]]
- [[_COMMUNITY_Pera Logo|Pera Logo]]
- [[_COMMUNITY_OpenCode Plugin|OpenCode Plugin]]
- [[_COMMUNITY_Key Generation|Key Generation]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_Admin Vercel Rewrites|Admin Vercel Rewrites]]
- [[_COMMUNITY_Sandbox SSH Entrypoint|Sandbox SSH Entrypoint]]
- [[_COMMUNITY_Web Vercel Rewrites|Web Vercel Rewrites]]
- [[_COMMUNITY_Fee Sponsorship Docs|Fee Sponsorship Docs]]

## God Nodes (most connected - your core abstractions)
1. `Fetch` - 31 edges
2. `apiError()` - 30 edges
3. `Session` - 26 edges
4. `formatUsdc()` - 20 edges
5. `q()` - 16 edges
6. `useAdminAuth()` - 15 edges
7. `compilerOptions` - 15 edges
8. `api()` - 15 edges
9. `Leedlime landing page` - 15 edges
10. `Leedlime` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Lease Watchdog` --semantically_similar_to--> `MCP Spend Cap (TENDRIL_MAX_ATOMIC)`  [INFERRED] [semantically similar]
  README.md → docs/mcp.md
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `Backend / Registry`  [INFERRED]
  DEPLOY.md → README.md
- `exec()` --calls--> `runJob()`  [INFERRED]
  backend/src/providers/contributor.ts → web/src/api.ts
- `mintKey()` --calls--> `createApiKey()`  [INFERRED]
  backend/src/routes.ts → web/src/api.ts

## Import Cycles
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Communities (101 total, 11 thin omitted)

### Community 0 - "Admin App Shell"
Cohesion: 0.08
Nodes (44): AdminLayout(), LINKS, acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode() (+36 more)

### Community 1 - "Admin Portal Docs"
Cohesion: 0.06
Nodes (45): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Registry HTTP API, Tendril MCP Server, MCP Spend Cap (TENDRIL_MAX_ATOMIC), tendril_account, tendril_lease (+37 more)

### Community 2 - "Contributor Provider"
Cohesion: 0.09
Nodes (38): contributorProvider, exec(), id, destroyForLease(), providerFor(), providers, destroy(), drop() (+30 more)

### Community 3 - "Explore And Contribute"
Cohesion: 0.10
Nodes (29): Contribute(), Props, Explore(), fmtCountdown(), fmtDuration(), Props, GoogleCallback(), Props (+21 more)

### Community 4 - "Admin Route Guards"
Cohesion: 0.09
Nodes (32): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+24 more)

### Community 5 - "Leedlime Landing"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 6 - "Backend Config"
Cohesion: 0.11
Nodes (25): net, repoRoot, clampMarkup(), HOSTED_SKUS, hostedById(), hostedCatalog(), hostedHourlyUsd(), HostedSku (+17 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, modal, nanoid (+23 more)

### Community 8 - "Example Buyer Client"
Cohesion: 0.17
Nodes (30): authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName(), paidAuthedJson() (+22 more)

### Community 9 - "API Docs UI"
Cohesion: 0.07
Nodes (18): DOCS, Group, Heading, MdDocId, Section, ArchDiagram(), FlowMode, Docs() (+10 more)

### Community 10 - "Web Wallet Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 11 - "Route Discovery"
Cohesion: 0.12
Nodes (26): discoveryExtensions(), RouteDiscovery, serviceMetadata, discovered, payloadFor(), rent, run, service (+18 more)

### Community 12 - "Wallet Account Client"
Cohesion: 0.17
Nodes (26): algod, fetchOnchainBalances(), fetchWalletAccount(), fetchWalletGasRequest(), optInUsdcWithWallet(), submitWalletGasRequest(), PayStage, apiError() (+18 more)

### Community 13 - "Lease Types"
Cohesion: 0.12
Nodes (26): config, atomicPerHour(), Lease, SandboxAccess, abandonLease(), activateLease(), closeLease(), createLease() (+18 more)

### Community 14 - "Lease Lookup"
Cohesion: 0.13
Nodes (23): syncGasGrantEligibility, getLease(), leaseByPayment(), waitForLeaseAccess(), Handler, isOpenSshPubKey(), jobError(), JobInput (+15 more)

### Community 15 - "Contribute Dashboard"
Cohesion: 0.11
Nodes (15): Dashboard(), fmtDuration(), Props, resolveStats(), FAQ_ITEMS, LandingPage(), McpModal(), Props (+7 more)

### Community 16 - "Admin Google Auth"
Cohesion: 0.14
Nodes (23): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, addressFromSession(), AdminInfo (+15 more)

### Community 17 - "Export Key Modal"
Cohesion: 0.13
Nodes (19): ExportKeyModal(), Props, short(), Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, PendingConfirm (+11 more)

### Community 18 - "Contributor Runtime"
Cohesion: 0.12
Nodes (20): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, handleRun(), HeartbeatMsg (+12 more)

### Community 19 - "MCP Package"
Cohesion: 0.09
Nodes (21): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @tendril/shared, tsx (+13 more)

### Community 20 - "Admin Package"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 21 - "Root Package"
Cohesion: 0.10
Nodes (19): description, engines, node, name, overrides, lute-connect, private, scripts (+11 more)

### Community 22 - "Contributor Package"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 23 - "Database Layer"
Cohesion: 0.18
Nodes (15): initDb(), inTransaction(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, transientDbError() (+7 more)

### Community 24 - "Balance Chart"
Cohesion: 0.20
Nodes (15): BalanceChart(), Props, Pt, GoogleWalletBar(), formatAlgo(), OnchainAccountPanel(), OnchainPanelState, Props (+7 more)

### Community 25 - "Buyer Package"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 26 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 27 - "x402 Lease Docs"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 28 - "x402 Paying Fetch"
Cohesion: 0.15
Nodes (12): payingFetch(), serializeSigner(), walletQueue, PaymentReceipt, usdToAtomic(), WalletNonceResponse, X402TopUpResponse, loginWithWallet() (+4 more)

### Community 29 - "Backend Boot"
Cohesion: 0.16
Nodes (13): main(), app, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin(), corsPolicy() (+5 more)

### Community 30 - "Notebook Section"
Cohesion: 0.18
Nodes (12): asText(), availabilityCopy(), cellsFrom(), clip(), NotebookSection(), NotebookView, outputsFrom(), PendingNotebook (+4 more)

### Community 31 - "Web SPA Entry"
Cohesion: 0.17
Nodes (16): Bazaar scrapes title as service name, Favicon /favicon.svg, Google Fonts: JetBrains Mono, Newsreader, Plus Jakarta Sans, Module entry /src/main.tsx, React mount point #root, Rent sandboxed SSH by hour; x402 Algorand USDC, OG image https://tendrilhq.com/og.png, Open Graph metadata (+8 more)

### Community 32 - "Wallet Connect Modal"
Cohesion: 0.25
Nodes (12): ConnectWalletModal(), Props, EmailAuthModal(), Props, short(), WalletBar(), fetchEmailEnabled(), fetchGoogleEnabled() (+4 more)

### Community 33 - "x402 Client Recipes"
Cohesion: 0.13
Nodes (15): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Option A — the bundled agent, Option B — rent a box and SSH into it, Reference (+7 more)

### Community 34 - "Shared Network Types"
Cohesion: 0.13
Nodes (14): AlgorandNetwork, AssetInfo, ExportKeyResponse, Job, LeaseBilling, NETWORKS, NodeStatus, PlatformTreasury (+6 more)

### Community 35 - "Docker Sandbox"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 36 - "Metrics Board"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 37 - "Explorer Index"
Cohesion: 0.20
Nodes (13): main(), ExplorerNode, LeaseCloseResponse, MIN_RAM_MB, postJson(), REGISTRY, repoRoot, request() (+5 more)

### Community 38 - "Google Auth"
Cohesion: 0.29
Nodes (13): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), findUserById(), disabled() (+5 more)

### Community 39 - "Custodial Wallet"
Cohesion: 0.25
Nodes (12): accountFromUser(), CustodialAccount, decryptMnemonic(), encryptionKey(), encryptMnemonic(), generateCustodialAccount(), signTransactions(), custodialPayingFetch() (+4 more)

### Community 40 - "Base TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 41 - "Cottage Painting"
Cohesion: 0.28
Nodes (12): Dirt lane, Right fence post, Garden hedges, Main stone cottage, Side stone cottage, Cloudy sky, Brown tile roofs, Left tall tree (+4 more)

### Community 42 - "Alpine Lake Painting"
Cohesion: 0.28
Nodes (13): Alpine Lake, Alpine Mountain Lake Landscape Painting, Scattered Grey Boulders, Central Snow-Capped Mountain Peak, Cloud-Filled Blue Sky, Foreground Coniferous Pines, Flanking Rocky Mountain Ridges, Forested Midground Slopes (+5 more)

### Community 43 - "Deploy Guide"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 44 - "API Error Reference"
Cohesion: 0.22
Nodes (13): DELETE /x402/leases/:id (api.md), Paid endpoints, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway`, Renting from the CLI walkthrough, DELETE /x402/leases/:id (x402-api.md), Errors, with `curl` (+5 more)

### Community 45 - "Free Read Endpoints"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 46 - "Admin TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 47 - "Field Painting"
Cohesion: 0.27
Nodes (12): Field landscape painting, Horizontal landscape composition, Two seated figures, Rolling green hills, Wildflower meadow, Green-blue-cream palette, Dirt path, Artist signature (+4 more)

### Community 48 - "Lime Field Painting"
Cohesion: 0.24
Nodes (12): lime-field-paint.jpg, Wide horizontal composition, Pastoral landscape genre, Serene rural mood, Impasto brushwork, Monochrome lime palette, Farmstead buildings, Open agricultural field (+4 more)

### Community 49 - "API Auth Docs"
Cohesion: 0.17
Nodes (10): Authentication, CORS, Error index, Overview, Reference, Table of contents, Tendril API, Which endpoints need what (+2 more)

### Community 50 - "Email Auth Users"
Cohesion: 0.39
Nodes (11): issueEmailSession(), createEmailUser(), findUserByEmail(), isEmailAuthEnabled(), touchUserLogin(), disabled(), emailEnabled(), emailLogin() (+3 more)

### Community 51 - "Custodial Signing"
Cohesion: 0.20
Nodes (10): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), GoogleAccountInfo, pending, PendingRequest, PrepareAction (+2 more)

### Community 52 - "Graphify Agent Rules"
Cohesion: 0.20
Nodes (11): Full Pipeline, God Nodes, graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Query, NetworkX (+3 more)

### Community 53 - "Hills Smudge Painting"
Cohesion: 0.38
Nodes (11): hills-smudge-art.jpg, Layered depth composition, Alpine landscape painting, Serene wilderness mood, Impasto / smudge brushwork, Sage-green monochrome palette, Rocky meadow foreground, Coniferous forest slopes (+3 more)

### Community 54 - "Shared Package"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 55 - "Gas Grant Records"
Cohesion: 0.38
Nodes (8): findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGoogleGasGrantEligibility(), syncWalletGasGrantEligibility()

### Community 56 - "Claude Perplexity Marks"
Cohesion: 0.25
Nodes (7): Claude starburst path, Claude (Anthropic), Perplexity, currentColor fill, logo path, svg root, web/public/assets

### Community 57 - "Daisy Field Painting"
Cohesion: 0.31
Nodes (8): Clouded blue sky, White wildflower meadow, Distant village roofs, Impressionist pastoral landscape, Left tree cluster, Winding dirt path, Pastoral calm atmosphere, Seated pair on path

### Community 58 - "Key Management Docs"
Cohesion: 0.22
Nodes (9): Authentication credential model (session/API key/lease/payment), Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys`, GET /lease/:id, Lease, `POST /keys` (+1 more)

### Community 59 - "Format Tests"
Cohesion: 0.22
Nodes (8): hourly, mainnet, quote, rate, testnet, sandboxLifetimeMs(), fundedSeconds(), proratedCost()

### Community 60 - "AgentMesh Logo"
Cohesion: 0.32
Nodes (7): AgentMesh brand/UI mark, currentColor fill, Display size 20x16, Filled path silhouette, Web public static asset, AgentMesh SVG icon, viewBox 2 5 58 44

### Community 61 - "Cloudscape Painting"
Cohesion: 0.43
Nodes (8): Clouds Painting, Soft Atmospheric Mood, Panoramic Cloudscape, Cumulus Cloud Forms, Horizontal Banner Format, Impasto Oil Technique, Light and Shadow Cloud Modeling, Sage Green Monochrome Palette

### Community 62 - "Grok USDC Marks"
Cohesion: 0.29
Nodes (7): Grok mark lower path, Grok mark upper path, USDC logo, Grok (xAI), currentColor fill, USDC (USD Coin), USDC compound path

### Community 63 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 64 - "Contributor TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 65 - "x402 Schemas"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 66 - "Buyer TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 67 - "x402 Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 68 - "MCP TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 69 - "Contributor Payouts"
Cohesion: 0.43
Nodes (7): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo()

### Community 71 - "ChatGPT Logo"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 72 - "Shared TypeScript Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 73 - "Wallet Signing"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 74 - "Hardware Specs"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 75 - "Open Graph Card"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 76 - "Favicon Mark"
Cohesion: 0.67
Nodes (3): Brand green #0B5D3A, Cream #F4F1EA, Serif T mark

### Community 78 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 79 - "Wallet Auth Endpoints"
Cohesion: 0.83
Nodes (4): POST /auth/wallet-login, GET /auth/wallet-nonce, `GET /wallet`, Session

### Community 80 - "Public Favicon"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 81 - "Caveman Mode Rules"
Cohesion: 0.67
Nodes (3): Auto-Clarity, Boundaries, Caveman

### Community 82 - "Algorand Logo"
Cohesion: 0.67
Nodes (3): Algorand, Algorand glyph path, Algorand logo

## Knowledge Gaps
- **451 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+446 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatUsdc()` connect `Balance Chart` to `Wallet Connect Modal`, `Shared Network Types`, `Explore And Contribute`, `Metrics Board`, `Wallet Account Client`, `Lease Lookup`, `Export Key Modal`, `Custodial Signing`, `Format Tests`, `Notebook Section`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Fetch` connect `Admin App Shell` to `Wallet Connect Modal`, `Contributor Provider`, `Explore And Contribute`, `Explorer Index`, `Google Auth`, `Wallet Account Client`, `Admin Google Auth`, `Export Key Modal`, `x402 Paying Fetch`, `Backend Boot`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Contribute Dashboard` to `Shared Network Types`, `Explore And Contribute`, `Admin Route Guards`, `Example Buyer Client`, `Wallet Account Client`, `Balance Chart`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.08469449485783424 - nodes in this community are weakly interconnected._
- **Should `Admin Portal Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05858585858585859 - nodes in this community are weakly interconnected._