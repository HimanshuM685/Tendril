# Graph Report - .  (2026-09-30)

## Corpus Check
- 37 files · ~333,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1307 nodes · 2304 edges · 93 communities (77 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth + Wallet Core|Auth + Wallet Core]]
- [[_COMMUNITY_Admin Auth Backend|Admin Auth Backend]]
- [[_COMMUNITY_Admin SPA Frontend|Admin SPA Frontend]]
- [[_COMMUNITY_Custodial Sessions Config|Custodial Sessions Config]]
- [[_COMMUNITY_Buyer Agent Client|Buyer Agent Client]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Leedlime Landing Asset|Leedlime Landing Asset]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Wallet Onboarding Flow|Wallet Onboarding Flow]]
- [[_COMMUNITY_Contributor Daemon Types|Contributor Daemon Types]]
- [[_COMMUNITY_Top-Up UI|Top-Up UI]]
- [[_COMMUNITY_Contributor SPA Pages|Contributor SPA Pages]]
- [[_COMMUNITY_Export Key + Wallet Bar|Export Key + Wallet Bar]]
- [[_COMMUNITY_Lease Billing|Lease Billing]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_MCP Package|MCP Package]]
- [[_COMMUNITY_Dashboard Charts|Dashboard Charts]]
- [[_COMMUNITY_Site Dependencies|Site Dependencies]]
- [[_COMMUNITY_Workspace Config|Workspace Config]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Auth API Docs|Auth API Docs]]
- [[_COMMUNITY_Shared SDK Dependencies|Shared SDK Dependencies]]
- [[_COMMUNITY_DB Transaction Tests|DB Transaction Tests]]
- [[_COMMUNITY_Docker Sandbox Manager|Docker Sandbox Manager]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Marketing Landing Pages|Marketing Landing Pages]]
- [[_COMMUNITY_x402 Lease Docs|x402 Lease Docs]]
- [[_COMMUNITY_Node Registry|Node Registry]]
- [[_COMMUNITY_API Error Reference|API Error Reference]]
- [[_COMMUNITY_Web Index SPA Entry|Web Index SPA Entry]]
- [[_COMMUNITY_Connect + Email Modals|Connect + Email Modals]]
- [[_COMMUNITY_Metrics Dashboard|Metrics Dashboard]]
- [[_COMMUNITY_Base TSConfig|Base TSConfig]]
- [[_COMMUNITY_Cottage Painting Asset|Cottage Painting Asset]]
- [[_COMMUNITY_Alpine Painting Asset|Alpine Painting Asset]]
- [[_COMMUNITY_Deploy Guide|Deploy Guide]]
- [[_COMMUNITY_Free Read Endpoints|Free Read Endpoints]]
- [[_COMMUNITY_Contributor TSConfig|Contributor TSConfig]]
- [[_COMMUNITY_Field Painting Asset|Field Painting Asset]]
- [[_COMMUNITY_lime field paint jpg|lime field paint jpg]]
- [[_COMMUNITY_x402 api md|x402 api md]]
- [[_COMMUNITY_graph html|graph html]]
- [[_COMMUNITY_hills smudge art jpg|hills smudge art jpg]]
- [[_COMMUNITY_index ts|index ts]]
- [[_COMMUNITY_package json|package json]]
- [[_COMMUNITY_format test ts|format test ts]]
- [[_COMMUNITY_claude svg|claude svg]]
- [[_COMMUNITY_painting2 jpg|painting2 jpg]]
- [[_COMMUNITY_Auto Clarity|Auto Clarity]]
- [[_COMMUNITY_agentmesh svg|agentmesh svg]]
- [[_COMMUNITY_Clouds Painting|Clouds Painting]]
- [[_COMMUNITY_grok svg|grok svg]]
- [[_COMMUNITY_tsconfig json|tsconfig json]]
- [[_COMMUNITY_tsconfig json|tsconfig json]]
- [[_COMMUNITY_AssetInfo|AssetInfo]]
- [[_COMMUNITY_tsconfig json|tsconfig json]]
- [[_COMMUNITY_x402Client test ts|x402Client test ts]]
- [[_COMMUNITY_tsconfig json|tsconfig json]]
- [[_COMMUNITY_HashHero tsx|HashHero tsx]]
- [[_COMMUNITY_cors ts|cors ts]]
- [[_COMMUNITY_60 Rotational Instance Uses|60 Rotational Instance Uses]]
- [[_COMMUNITY_Option A the bundled|Option A the bundled]]
- [[_COMMUNITY_tsconfig json|tsconfig json]]
- [[_COMMUNITY_BalanceChart tsx|BalanceChart tsx]]
- [[_COMMUNITY_main|main]]
- [[_COMMUNITY_Three dot Ellipsis Motif|Three dot Ellipsis Motif]]
- [[_COMMUNITY_favicon svg|favicon svg]]
- [[_COMMUNITY_config ts|config ts]]
- [[_COMMUNITY_Docker Backend Service|Docker Backend Service]]
- [[_COMMUNITY_Tendril Brand Green 0B5D3A|Tendril Brand Green 0B5D3A]]
- [[_COMMUNITY_Admin SPA|Admin SPA]]
- [[_COMMUNITY_Algorand|Algorand]]
- [[_COMMUNITY_defly svg|defly svg]]
- [[_COMMUNITY_pera svg|pera svg]]
- [[_COMMUNITY_package json|package json]]
- [[_COMMUNITY_keygen ts|keygen ts]]
- [[_COMMUNITY_vite env d ts|vite env d ts]]
- [[_COMMUNITY_vercel json|vercel json]]
- [[_COMMUNITY_entrypoint sh|entrypoint sh]]
- [[_COMMUNITY_vercel json|vercel json]]
- [[_COMMUNITY_API Docs UI|API Docs UI]]
- [[_COMMUNITY_Contributor Pages|Contributor Pages]]
- [[_COMMUNITY_Fetch|Fetch]]
- [[_COMMUNITY_Session|Session]]
- [[_COMMUNITY_Wallet Onboarding|Wallet Onboarding]]
- [[_COMMUNITY_Facilitator sponsored network fee|Facilitator sponsored network fee]]

## God Nodes (most connected - your core abstractions)
1. `Fetch` - 31 edges
2. `apiError()` - 29 edges
3. `Session` - 26 edges
4. `formatUsdc()` - 18 edges
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
- `adminGoogleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/adminAuth.ts → example-buyer/src/index.ts
- `googleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/googleAuth.ts → example-buyer/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AgentMesh icon composition** — assets_agentmesh, assets_agentmesh_path_silhouette, assets_agentmesh_currentColor, assets_agentmesh_viewbox, assets_agentmesh_display_size [INFERRED 0.91]
- **Public UI branding asset** — assets_agentmesh, assets_agentmesh_public_asset, assets_agentmesh_brand_mark, assets_agentmesh_svg_icon [INFERRED 0.86]
- **ChatGPT Radial Logo Construction** — assets_chatgpt_logo_mark, assets_chatgpt_petal_path, assets_chatgpt_60deg_rotation_instances, assets_chatgpt_six_petal_hexagram [EXTRACTED 1.00]
- **Painterly Green Sky Composition** — assets_clouds_painting, assets_clouds_painting_cloudscape, assets_clouds_painting_sage_green_palette, assets_clouds_painting_impasto_technique, assets_clouds_painting_atmospheric_mood [INFERRED 0.85]
- **Full alpine valley scene** —  [INFERRED]
- **Smudge landscape style bundle** —  [INFERRED]
- **Complete Alpine Vista Scene** — assets_painting3_central_snow_capped_peak, assets_painting3_alpine_lake, assets_painting3_coniferous_pines, assets_painting3_rocky_meadow_foreground, assets_painting3_cloud_filled_sky [EXTRACTED 1.00]
- **Foreground Midground Background Depth Planes** — assets_painting3_rocky_meadow_foreground, assets_painting3_alpine_lake, assets_painting3_forest_midground_slopes, assets_painting3_central_snow_capped_peak [INFERRED 0.85]

## Communities (93 total, 16 thin omitted)

### Community 0 - "Auth + Wallet Core"
Cohesion: 0.05
Nodes (65): algod, addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader() (+57 more)

### Community 1 - "Admin Auth Backend"
Cohesion: 0.06
Nodes (59): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, adminRouter, Handler (+51 more)

### Community 2 - "Admin SPA Frontend"
Cohesion: 0.08
Nodes (44): AdminLayout(), LINKS, acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode() (+36 more)

### Community 3 - "Custodial Sessions Config"
Cohesion: 0.07
Nodes (50): config, repoRoot, issueEmailSession(), issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), net (+42 more)

### Community 4 - "Buyer Agent Client"
Cohesion: 0.08
Nodes (46): main(), authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName() (+38 more)

### Community 5 - "Architecture Concepts"
Cohesion: 0.06
Nodes (45): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Registry HTTP API, Tendril MCP Server, MCP Spend Cap (TENDRIL_MAX_ATOMIC), tendril_account, tendril_lease (+37 more)

### Community 6 - "Leedlime Landing Asset"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.06
Nodes (30): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+22 more)

### Community 8 - "Frontend Dependencies"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 9 - "Wallet Onboarding Flow"
Cohesion: 0.17
Nodes (26): algod, fetchOnchainBalances(), fetchWalletAccount(), fetchWalletGasRequest(), optInUsdcWithWallet(), submitWalletGasRequest(), payingFetch(), PayStage (+18 more)

### Community 10 - "Contributor Daemon Types"
Cohesion: 0.11
Nodes (25): activeLeases, AgentHelloMsg, AlgorandNetwork, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, ExportKeyResponse, HeartbeatMsg (+17 more)

### Community 11 - "Top-Up UI"
Cohesion: 0.10
Nodes (19): PRESETS, Props, TopUpControl(), Props, TopUpModal(), CustodialSignProvider(), network, serializeSigner() (+11 more)

### Community 12 - "Contributor SPA Pages"
Cohesion: 0.13
Nodes (20): Contribute(), Props, Explore(), fmtCountdown(), fmtDuration(), Props, GoogleCallback(), Props (+12 more)

### Community 13 - "Export Key + Wallet Bar"
Cohesion: 0.13
Nodes (21): ExportKeyModal(), Props, GoogleWalletBar(), short(), Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue (+13 more)

### Community 14 - "Lease Billing"
Cohesion: 0.14
Nodes (22): fundedSeconds(), Lease, LeaseStatus, proratedCost(), abandonLease(), activateLease(), closeLease(), createLease() (+14 more)

### Community 15 - "API Docs UI"
Cohesion: 0.10
Nodes (13): DOCS, Group, Heading, MdDocId, Section, ArchDiagram(), FlowMode, Docs() (+5 more)

### Community 16 - "MCP Package"
Cohesion: 0.09
Nodes (21): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @tendril/shared, tsx (+13 more)

### Community 17 - "Dashboard Charts"
Cohesion: 0.17
Nodes (17): BalanceChart(), Dashboard(), fmtDuration(), Props, resolveStats(), formatAlgo(), OnchainAccountPanel(), OnchainPanelState (+9 more)

### Community 18 - "Site Dependencies"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 19 - "Workspace Config"
Cohesion: 0.10
Nodes (19): description, engines, node, name, overrides, lute-connect, private, scripts (+11 more)

### Community 20 - "Buyer Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 21 - "Auth API Docs"
Cohesion: 0.13
Nodes (18): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Authentication, Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys` (+10 more)

### Community 22 - "Shared SDK Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 23 - "DB Transaction Tests"
Cohesion: 0.18
Nodes (14): inTransaction(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, transientDbError(), walletSummary() (+6 more)

### Community 24 - "Docker Sandbox Manager"
Cohesion: 0.20
Nodes (17): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SANDBOX_CTX, SandboxEndpoint (+9 more)

### Community 25 - "Shared TSConfig"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 26 - "Marketing Landing Pages"
Cohesion: 0.15
Nodes (8): About(), LandingPage(), Marketplace(), McpModal(), Props, shortAddr(), Sidebar(), SidebarProps

### Community 27 - "x402 Lease Docs"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 28 - "Node Registry"
Cohesion: 0.15
Nodes (14): ComputeNode, ExplorerNode, isOnline(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes (+6 more)

### Community 29 - "API Error Reference"
Cohesion: 0.17
Nodes (16): CORS, DELETE /x402/leases/:id (api.md), Error index, Paid endpoints, Reference, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway` (+8 more)

### Community 30 - "Web Index SPA Entry"
Cohesion: 0.17
Nodes (16): Bazaar scrapes title as service name, Favicon /favicon.svg, Google Fonts: JetBrains Mono, Newsreader, Plus Jakarta Sans, Module entry /src/main.tsx, React mount point #root, Rent sandboxed SSH by hour; x402 Algorand USDC, OG image https://tendrilhq.com/og.png, Open Graph metadata (+8 more)

### Community 31 - "Connect + Email Modals"
Cohesion: 0.25
Nodes (12): ConnectWalletModal(), Props, EmailAuthModal(), Props, short(), WalletBar(), fetchEmailEnabled(), fetchGoogleEnabled() (+4 more)

### Community 32 - "Metrics Dashboard"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 33 - "Base TSConfig"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 34 - "Cottage Painting Asset"
Cohesion: 0.28
Nodes (12): Dirt lane, Right fence post, Garden hedges, Main stone cottage, Side stone cottage, Cloudy sky, Brown tile roofs, Left tall tree (+4 more)

### Community 35 - "Alpine Painting Asset"
Cohesion: 0.28
Nodes (13): Alpine Lake, Alpine Mountain Lake Landscape Painting, Scattered Grey Boulders, Central Snow-Capped Mountain Peak, Cloud-Filled Blue Sky, Foreground Coniferous Pines, Flanking Rocky Mountain Ridges, Forested Midground Slopes (+5 more)

### Community 36 - "Deploy Guide"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 37 - "Free Read Endpoints"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 38 - "Contributor TSConfig"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 39 - "Field Painting Asset"
Cohesion: 0.27
Nodes (12): Field landscape painting, Horizontal landscape composition, Two seated figures, Rolling green hills, Wildflower meadow, Green-blue-cream palette, Dirt path, Artist signature (+4 more)

### Community 40 - "lime field paint jpg"
Cohesion: 0.24
Nodes (12): lime-field-paint.jpg, Wide horizontal composition, Pastoral landscape genre, Serene rural mood, Impasto brushwork, Monochrome lime palette, Farmstead buildings, Open agricultural field (+4 more)

### Community 41 - "x402 api md"
Cohesion: 0.17
Nodes (11): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Table of contents, Tendril x402 API (+3 more)

### Community 42 - "graph html"
Cohesion: 0.24
Nodes (11): graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Fast Path, Graphify Full Pipeline, Graphify Query, NetworkX Fallback Traversal (+3 more)

### Community 43 - "hills smudge art jpg"
Cohesion: 0.38
Nodes (11): hills-smudge-art.jpg, Layered depth composition, Alpine landscape painting, Serene wilderness mood, Impasto / smudge brushwork, Sage-green monochrome palette, Rocky meadow foreground, Coniferous forest slopes (+3 more)

### Community 44 - "index ts"
Cohesion: 0.31
Nodes (9): main(), initDb(), app, corsOrigin, startWatchdog(), router, initWs(), checkDiscoveryConfig() (+1 more)

### Community 45 - "package json"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 46 - "format test ts"
Cohesion: 0.20
Nodes (7): hourly, mainnet, quote, rate, testnet, atomicPerHour(), rate

### Community 47 - "claude svg"
Cohesion: 0.25
Nodes (7): Claude starburst path, Claude (Anthropic), Perplexity, currentColor fill, logo path, svg root, web/public/assets

### Community 48 - "painting2 jpg"
Cohesion: 0.31
Nodes (8): Clouded blue sky, White wildflower meadow, Distant village roofs, Impressionist pastoral landscape, Left tree cluster, Winding dirt path, Pastoral calm atmosphere, Seated pair on path

### Community 49 - "Auto Clarity"
Cohesion: 0.25
Nodes (4): Auto-Clarity, Caveman Response Style, Caveman Switch Levels, Code Commit PR Boundaries

### Community 50 - "agentmesh svg"
Cohesion: 0.32
Nodes (7): AgentMesh brand/UI mark, currentColor fill, Display size 20x16, Filled path silhouette, Web public static asset, AgentMesh SVG icon, viewBox 2 5 58 44

### Community 51 - "Clouds Painting"
Cohesion: 0.43
Nodes (8): Clouds Painting, Soft Atmospheric Mood, Panoramic Cloudscape, Cumulus Cloud Forms, Horizontal Banner Format, Impasto Oil Technique, Light and Shadow Cloud Modeling, Sage Green Monochrome Palette

### Community 52 - "grok svg"
Cohesion: 0.29
Nodes (7): Grok mark lower path, Grok mark upper path, USDC logo, Grok (xAI), currentColor fill, USDC (USD Coin), USDC compound path

### Community 53 - "tsconfig json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 54 - "tsconfig json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 55 - "AssetInfo"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 56 - "tsconfig json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 57 - "x402Client test ts"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 58 - "tsconfig json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 60 - "cors ts"
Cohesion: 0.38
Nodes (5): allowedOrigin(), corsPolicy(), isPayablePath(), PAYABLE_PATHS, X402_HEADERS

### Community 61 - "60 Rotational Instance Uses"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 62 - "Option A the bundled"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

### Community 63 - "tsconfig json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 64 - "BalanceChart tsx"
Cohesion: 0.60
Nodes (4): Props, Pt, Charge, TopUp

### Community 65 - "main"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 66 - "Three dot Ellipsis Motif"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 67 - "favicon svg"
Cohesion: 0.67
Nodes (3): Brand green #0B5D3A, Cream #F4F1EA, Serif T mark

### Community 69 - "Docker Backend Service"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 70 - "Tendril Brand Green 0B5D3A"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 71 - "Admin SPA"
Cohesion: 0.67
Nodes (3): Admin SPA, Custodial Auth, formatUsdc()

### Community 72 - "Algorand"
Cohesion: 0.67
Nodes (3): Algorand, Algorand glyph path, Algorand logo

## Knowledge Gaps
- **440 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Dashboard Charts` to `Admin Auth Backend`, `Buyer Agent Client`, `Wallet Onboarding Flow`, `Contributor Daemon Types`, `Contributor SPA Pages`, `Marketing Landing Pages`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `formatUsdc()` connect `Dashboard Charts` to `BalanceChart tsx`, `Metrics Dashboard`, `Auth + Wallet Core`, `Custodial Sessions Config`, `Wallet Onboarding Flow`, `Contributor Daemon Types`, `Contributor SPA Pages`, `Export Key + Wallet Bar`, `format test ts`, `Connect + Email Modals`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `Fetch` connect `Admin SPA Frontend` to `Admin Auth Backend`, `Custodial Sessions Config`, `Buyer Agent Client`, `Wallet Onboarding Flow`, `Top-Up UI`, `Contributor SPA Pages`, `Export Key + Wallet Bar`, `index ts`, `Connect + Email Modals`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _451 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth + Wallet Core` be split into smaller, more focused modules?**
  _Cohesion score 0.05045045045045045 - nodes in this community are weakly interconnected._
- **Should `Admin Auth Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.05575065847234416 - nodes in this community are weakly interconnected._