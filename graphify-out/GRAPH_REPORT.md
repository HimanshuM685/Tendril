# Graph Report - .  (2026-09-30)

## Corpus Check
- 28 files · ~336,964 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1360 nodes · 2494 edges · 100 communities (89 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin App Shell|Admin App Shell]]
- [[_COMMUNITY_Backend Boot|Backend Boot]]
- [[_COMMUNITY_Admin Portal Docs|Admin Portal Docs]]
- [[_COMMUNITY_Example Buyer Client|Example Buyer Client]]
- [[_COMMUNITY_Contribute Dashboard|Contribute Dashboard]]
- [[_COMMUNITY_Admin Auth Routes|Admin Auth Routes]]
- [[_COMMUNITY_Leedlime Landing|Leedlime Landing]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Explore Marketplace|Explore Marketplace]]
- [[_COMMUNITY_Lease Provider Routing|Lease Provider Routing]]
- [[_COMMUNITY_Web Wallet Dependencies|Web Wallet Dependencies]]
- [[_COMMUNITY_Admin Route Guards|Admin Route Guards]]
- [[_COMMUNITY_Hosted SKU Catalog|Hosted SKU Catalog]]
- [[_COMMUNITY_Wallet Connect Modals|Wallet Connect Modals]]
- [[_COMMUNITY_Architecture Diagram|Architecture Diagram]]
- [[_COMMUNITY_Shared Types|Shared Types]]
- [[_COMMUNITY_Contributor Provider|Contributor Provider]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_Contributor Runtime|Contributor Runtime]]
- [[_COMMUNITY_MCP Package|MCP Package]]
- [[_COMMUNITY_Export Key Modal|Export Key Modal]]
- [[_COMMUNITY_Admin Package|Admin Package]]
- [[_COMMUNITY_Root Package|Root Package]]
- [[_COMMUNITY_Contributor Package|Contributor Package]]
- [[_COMMUNITY_API Auth Docs|API Auth Docs]]
- [[_COMMUNITY_Modal Provider|Modal Provider]]
- [[_COMMUNITY_Database Layer|Database Layer]]
- [[_COMMUNITY_Buyer Package|Buyer Package]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_x402 Lease Docs|x402 Lease Docs]]
- [[_COMMUNITY_API Error Reference|API Error Reference]]
- [[_COMMUNITY_Web SPA Entry|Web SPA Entry]]
- [[_COMMUNITY_Docker Sandbox|Docker Sandbox]]
- [[_COMMUNITY_Metrics Board|Metrics Board]]
- [[_COMMUNITY_Google Auth|Google Auth]]
- [[_COMMUNITY_Custodial Wallet|Custodial Wallet]]
- [[_COMMUNITY_Base TypeScript Config|Base TypeScript Config]]
- [[_COMMUNITY_Cottage Painting|Cottage Painting]]
- [[_COMMUNITY_Alpine Lake Painting|Alpine Lake Painting]]
- [[_COMMUNITY_Deploy Guide|Deploy Guide]]
- [[_COMMUNITY_Free Read Endpoints|Free Read Endpoints]]
- [[_COMMUNITY_Admin Google Auth|Admin Google Auth]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Admin TypeScript Config|Admin TypeScript Config]]
- [[_COMMUNITY_Field Painting|Field Painting]]
- [[_COMMUNITY_Lime Field Painting|Lime Field Painting]]
- [[_COMMUNITY_Sign Confirm Modal|Sign Confirm Modal]]
- [[_COMMUNITY_x402 Client Recipes|x402 Client Recipes]]
- [[_COMMUNITY_Email Auth Users|Email Auth Users]]
- [[_COMMUNITY_Graphify Agent Rules|Graphify Agent Rules]]
- [[_COMMUNITY_Hills Smudge Painting|Hills Smudge Painting]]
- [[_COMMUNITY_Custodial Signing|Custodial Signing]]
- [[_COMMUNITY_Top Up Control|Top Up Control]]
- [[_COMMUNITY_Shared Package|Shared Package]]
- [[_COMMUNITY_Gas Grant Records|Gas Grant Records]]
- [[_COMMUNITY_Claude Perplexity Marks|Claude Perplexity Marks]]
- [[_COMMUNITY_Daisy Field Painting|Daisy Field Painting]]
- [[_COMMUNITY_AgentMesh Logo|AgentMesh Logo]]
- [[_COMMUNITY_Cloudscape Painting|Cloudscape Painting]]
- [[_COMMUNITY_Grok USDC Marks|Grok USDC Marks]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_API Key Clipboard|API Key Clipboard]]
- [[_COMMUNITY_Contributor TypeScript Config|Contributor TypeScript Config]]
- [[_COMMUNITY_x402 Schemas|x402 Schemas]]
- [[_COMMUNITY_Buyer TypeScript Config|Buyer TypeScript Config]]
- [[_COMMUNITY_x402 Client Tests|x402 Client Tests]]
- [[_COMMUNITY_MCP TypeScript Config|MCP TypeScript Config]]
- [[_COMMUNITY_Format Tests|Format Tests]]
- [[_COMMUNITY_Contributor Payouts|Contributor Payouts]]
- [[_COMMUNITY_Hash Hero|Hash Hero]]
- [[_COMMUNITY_ChatGPT Logo|ChatGPT Logo]]
- [[_COMMUNITY_Rent and SSH Docs|Rent and SSH Docs]]
- [[_COMMUNITY_Shared TypeScript Config|Shared TypeScript Config]]
- [[_COMMUNITY_Wallet Signing|Wallet Signing]]
- [[_COMMUNITY_Hardware Specs|Hardware Specs]]
- [[_COMMUNITY_Open Graph Card|Open Graph Card]]
- [[_COMMUNITY_Favicon Mark|Favicon Mark]]
- [[_COMMUNITY_Contributor Config|Contributor Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
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
1. `Fetch` - 32 edges
2. `apiError()` - 30 edges
3. `Session` - 26 edges
4. `formatUsdc()` - 25 edges
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
- `topUp()` --calls--> `usdToAtomic()`  [INFERRED]
  web/src/wallet.ts → shared/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `Backend / Registry`  [INFERRED]
  DEPLOY.md → README.md
- `NewLease` --references--> `ComputeProvider`  [EXTRACTED]
  backend/src/leases.ts → shared/src/index.ts

## Import Cycles
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Graphify three outputs** — agents_graph_html, agents_graph_report, agents_graph_json [EXTRACTED 1.00]
- **Graphify query fast path** — agents_graphify, agents_graph_json, agents_graphify_query [EXTRACTED 1.00]
- **Caveman mode controls** — agents_caveman, agents_auto_clarity, agents_boundaries [EXTRACTED 1.00]

## Communities (100 total, 11 thin omitted)

### Community 0 - "Admin App Shell"
Cohesion: 0.08
Nodes (44): AdminLayout(), LINKS, acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode() (+36 more)

### Community 1 - "Backend Boot"
Cohesion: 0.07
Nodes (42): main(), app, AssetInfo, corsOrigin, startWatchdog(), router, initWs(), allowedOrigin() (+34 more)

### Community 2 - "Admin Portal Docs"
Cohesion: 0.06
Nodes (45): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Registry HTTP API, Tendril MCP Server, MCP Spend Cap (TENDRIL_MAX_ATOMIC), tendril_account, tendril_lease (+37 more)

### Community 3 - "Example Buyer Client"
Cohesion: 0.11
Nodes (41): main(), authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName() (+33 more)

### Community 4 - "Contribute Dashboard"
Cohesion: 0.09
Nodes (26): Contribute(), Dashboard(), fmtDuration(), Props, resolveStats(), Props, GoogleCallback(), Props (+18 more)

### Community 5 - "Admin Auth Routes"
Cohesion: 0.08
Nodes (33): adminRouter, addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader() (+25 more)

### Community 6 - "Leedlime Landing"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, modal, nanoid (+23 more)

### Community 8 - "Explore Marketplace"
Cohesion: 0.15
Nodes (28): Explore(), fmtCountdown(), fmtDuration(), confirmCustodial(), exchangeGoogleCode(), exportGoogleMnemonic(), fetchGasRequest(), fetchGoogleAccount() (+20 more)

### Community 9 - "Lease Provider Routing"
Cohesion: 0.13
Nodes (29): destroyForLease(), providerFor(), sandboxLifetimeMs(), fundedSeconds(), Lease, LeaseStatus, proratedCost(), abandonLease() (+21 more)

### Community 10 - "Web Wallet Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 11 - "Admin Route Guards"
Cohesion: 0.12
Nodes (24): Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers(), createApiKey() (+16 more)

### Community 12 - "Hosted SKU Catalog"
Cohesion: 0.17
Nodes (21): clampMarkup(), HOSTED_SKUS, hostedById(), hostedCatalog(), hostedHourlyUsd(), HostedSku, modalConfigured(), modalUsdPerHour() (+13 more)

### Community 13 - "Wallet Connect Modals"
Cohesion: 0.15
Nodes (20): ConnectWalletModal(), Props, EmailAuthModal(), Props, short(), WalletBar(), fetchEmailEnabled(), fetchGoogleEnabled() (+12 more)

### Community 14 - "Architecture Diagram"
Cohesion: 0.11
Nodes (16): ArchDiagram(), FlowMode, network, payingFetch(), PayStage, serializeSigner(), walletQueue, NetworkDefaults (+8 more)

### Community 15 - "Shared Types"
Cohesion: 0.10
Nodes (21): Props, Pt, AlgorandNetwork, Charge, ExportKeyResponse, Job, JupyterAccess, LeaseBilling (+13 more)

### Community 16 - "Contributor Provider"
Cohesion: 0.15
Nodes (18): contributorProvider, exec(), id, providers, modalProvider, ComputeProvider, ExecArgs, ExecResult (+10 more)

### Community 17 - "API Docs UI"
Cohesion: 0.10
Nodes (12): DOCS, Group, Heading, MdDocId, Section, Docs(), DocTab, MANUAL_TOC (+4 more)

### Community 18 - "Contributor Runtime"
Cohesion: 0.13
Nodes (19): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, handleRun(), HeartbeatMsg (+11 more)

### Community 19 - "MCP Package"
Cohesion: 0.09
Nodes (21): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @tendril/shared, tsx (+13 more)

### Community 20 - "Export Key Modal"
Cohesion: 0.18
Nodes (17): BalanceChart(), ExportKeyModal(), Props, GoogleWalletBar(), Props, short(), formatAlgo(), OnchainAccountPanel() (+9 more)

### Community 21 - "Admin Package"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 22 - "Root Package"
Cohesion: 0.10
Nodes (19): description, engines, node, name, overrides, lute-connect, private, scripts (+11 more)

### Community 23 - "Contributor Package"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 24 - "API Auth Docs"
Cohesion: 0.13
Nodes (18): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Authentication, Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys` (+10 more)

### Community 25 - "Modal Provider"
Cohesion: 0.19
Nodes (18): destroy(), drop(), exec(), execText(), id, jupyterAccess(), jupyterCommand(), LIST_ARTIFACTS (+10 more)

### Community 26 - "Database Layer"
Cohesion: 0.18
Nodes (15): initDb(), inTransaction(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, transientDbError() (+7 more)

### Community 27 - "Buyer Package"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 28 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 29 - "x402 Lease Docs"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 30 - "API Error Reference"
Cohesion: 0.17
Nodes (16): CORS, DELETE /x402/leases/:id (api.md), Error index, Paid endpoints, Reference, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway` (+8 more)

### Community 31 - "Web SPA Entry"
Cohesion: 0.17
Nodes (16): Bazaar scrapes title as service name, Favicon /favicon.svg, Google Fonts: JetBrains Mono, Newsreader, Plus Jakarta Sans, Module entry /src/main.tsx, React mount point #root, Rent sandboxed SSH by hour; x402 Algorand USDC, OG image https://tendrilhq.com/og.png, Open Graph metadata (+8 more)

### Community 32 - "Docker Sandbox"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 33 - "Metrics Board"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 34 - "Google Auth"
Cohesion: 0.29
Nodes (13): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), touchUserLogin(), disabled() (+5 more)

### Community 35 - "Custodial Wallet"
Cohesion: 0.25
Nodes (12): accountFromUser(), CustodialAccount, decryptMnemonic(), encryptionKey(), encryptMnemonic(), generateCustodialAccount(), signTransactions(), custodialPayingFetch() (+4 more)

### Community 36 - "Base TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 37 - "Cottage Painting"
Cohesion: 0.28
Nodes (12): Dirt lane, Right fence post, Garden hedges, Main stone cottage, Side stone cottage, Cloudy sky, Brown tile roofs, Left tall tree (+4 more)

### Community 38 - "Alpine Lake Painting"
Cohesion: 0.28
Nodes (13): Alpine Lake, Alpine Mountain Lake Landscape Painting, Scattered Grey Boulders, Central Snow-Capped Mountain Peak, Cloud-Filled Blue Sky, Foreground Coniferous Pines, Flanking Rocky Mountain Ridges, Forested Midground Slopes (+5 more)

### Community 39 - "Deploy Guide"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 40 - "Free Read Endpoints"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 41 - "Admin Google Auth"
Cohesion: 0.31
Nodes (12): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, issueAdminExchangeCode(), issueAdminSession() (+4 more)

### Community 42 - "Backend Config"
Cohesion: 0.18
Nodes (6): config, net, repoRoot, server, transport, rate

### Community 43 - "Admin TypeScript Config"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 44 - "Field Painting"
Cohesion: 0.27
Nodes (12): Field landscape painting, Horizontal landscape composition, Two seated figures, Rolling green hills, Wildflower meadow, Green-blue-cream palette, Dirt path, Artist signature (+4 more)

### Community 45 - "Lime Field Painting"
Cohesion: 0.24
Nodes (12): lime-field-paint.jpg, Wide horizontal composition, Pastoral landscape genre, Serene rural mood, Impasto brushwork, Monochrome lime palette, Farmstead buildings, Open agricultural field (+4 more)

### Community 46 - "Sign Confirm Modal"
Cohesion: 0.23
Nodes (9): Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), PendingConfirm, CustodialAction, SignPrepareResponse (+1 more)

### Community 47 - "x402 Client Recipes"
Cohesion: 0.17
Nodes (11): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Table of contents, Tendril x402 API (+3 more)

### Community 48 - "Email Auth Users"
Cohesion: 0.39
Nodes (11): issueEmailSession(), createEmailUser(), findUserByEmail(), findUserById(), isEmailAuthEnabled(), disabled(), emailEnabled(), emailLogin() (+3 more)

### Community 49 - "Graphify Agent Rules"
Cohesion: 0.20
Nodes (11): Full Pipeline, God Nodes, graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Query, NetworkX (+3 more)

### Community 50 - "Hills Smudge Painting"
Cohesion: 0.38
Nodes (11): hills-smudge-art.jpg, Layered depth composition, Alpine landscape painting, Serene wilderness mood, Impasto / smudge brushwork, Sage-green monochrome palette, Rocky meadow foreground, Coniferous forest slopes (+3 more)

### Community 51 - "Custodial Signing"
Cohesion: 0.22
Nodes (10): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), GoogleAccountInfo, pending, PendingRequest, PrepareAction (+2 more)

### Community 52 - "Top Up Control"
Cohesion: 0.29
Nodes (7): PRESETS, Props, TopUpControl(), Props, TopUpModal(), isCustodialSession(), SignTransactions

### Community 53 - "Shared Package"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 54 - "Gas Grant Records"
Cohesion: 0.38
Nodes (8): findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGoogleGasGrantEligibility(), syncWalletGasGrantEligibility()

### Community 55 - "Claude Perplexity Marks"
Cohesion: 0.25
Nodes (7): Claude starburst path, Claude (Anthropic), Perplexity, currentColor fill, logo path, svg root, web/public/assets

### Community 56 - "Daisy Field Painting"
Cohesion: 0.31
Nodes (8): Clouded blue sky, White wildflower meadow, Distant village roofs, Impressionist pastoral landscape, Left tree cluster, Winding dirt path, Pastoral calm atmosphere, Seated pair on path

### Community 57 - "AgentMesh Logo"
Cohesion: 0.32
Nodes (7): AgentMesh brand/UI mark, currentColor fill, Display size 20x16, Filled path silhouette, Web public static asset, AgentMesh SVG icon, viewBox 2 5 58 44

### Community 58 - "Cloudscape Painting"
Cohesion: 0.43
Nodes (8): Clouds Painting, Soft Atmospheric Mood, Panoramic Cloudscape, Cumulus Cloud Forms, Horizontal Banner Format, Impasto Oil Technique, Light and Shadow Cloud Modeling, Sage Green Monochrome Palette

### Community 59 - "Grok USDC Marks"
Cohesion: 0.29
Nodes (7): Grok mark lower path, Grok mark upper path, USDC logo, Grok (xAI), currentColor fill, USDC (USD Coin), USDC compound path

### Community 60 - "Backend TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 61 - "API Key Clipboard"
Cohesion: 0.25
Nodes (6): Props, createApiKey(), writeClipboard(), ApiKeyInfo, CreateApiKeyResponse, mintKey()

### Community 62 - "Contributor TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 63 - "x402 Schemas"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 64 - "Buyer TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 65 - "x402 Client Tests"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 66 - "MCP TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 67 - "Format Tests"
Cohesion: 0.29
Nodes (7): hourly, mainnet, quote, rate, testnet, atomicPerHour(), usdToAtomic()

### Community 68 - "Contributor Payouts"
Cohesion: 0.43
Nodes (7): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo()

### Community 70 - "ChatGPT Logo"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 71 - "Rent and SSH Docs"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

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

### Community 79 - "Public Favicon"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 80 - "Caveman Mode Rules"
Cohesion: 0.67
Nodes (3): Auto-Clarity, Boundaries, Caveman

### Community 81 - "Algorand Logo"
Cohesion: 0.67
Nodes (3): Algorand, Algorand glyph path, Algorand logo

## Knowledge Gaps
- **446 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+441 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Contribute Dashboard` to `Example Buyer Client`, `Explore Marketplace`, `Admin Route Guards`, `Shared Types`, `Export Key Modal`, `API Key Clipboard`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `formatUsdc()` connect `Export Key Modal` to `Metrics Board`, `Format Tests`, `Contribute Dashboard`, `Admin Auth Routes`, `Explore Marketplace`, `Lease Provider Routing`, `Wallet Connect Modals`, `Shared Types`, `Custodial Signing`, `API Key Clipboard`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Fetch` connect `Admin App Shell` to `Backend Boot`, `Google Auth`, `Example Buyer Client`, `Explore Marketplace`, `Admin Google Auth`, `Wallet Connect Modals`, `Architecture Diagram`, `Modal Provider`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _454 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.08469449485783424 - nodes in this community are weakly interconnected._
- **Should `Backend Boot` be split into smaller, more focused modules?**
  _Cohesion score 0.07227891156462585 - nodes in this community are weakly interconnected._