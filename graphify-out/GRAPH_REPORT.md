# Graph Report - .  (2026-10-01)

## Corpus Check
- 23 files · ~345,563 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1430 nodes · 2615 edges · 110 communities (91 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
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
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 31 edges
2. `Session` - 28 edges
3. `formatUsdc()` - 27 edges
4. `Fetch` - 19 edges
5. `creditBalance()` - 18 edges
6. `runAnywhere()` - 17 edges
7. `api()` - 16 edges
8. `q()` - 16 edges
9. `SignTransactions` - 16 edges
10. `useAdminAuth()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Lease Watchdog` --semantically_similar_to--> `Spend Cap`  [INFERRED] [semantically similar]
  README.md → docs/mcp.md
- `loginWithWallet()` --calls--> `Fetch`  [INFERRED]
  web/src/wallet.ts → example-buyer/src/index.ts
- `Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY)` --conceptually_related_to--> `Backend / Registry`  [INFERRED]
  DEPLOY.md → README.md
- `exec()` --calls--> `runJob()`  [INFERRED]
  backend/src/providers/contributor.ts → web/src/api.ts
- `adminGoogleCallback()` --calls--> `Fetch`  [EXTRACTED]
  backend/src/adminAuth.ts → example-buyer/src/index.ts

## Import Cycles
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Communities (110 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (44): AdminLayout(), LINKS, acceptGasRequest(), adminLoginUrl(), AdminUserRow, apiError(), authHeaders(), exchangeAdminCode() (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (49): NotebookView, contributorProvider, exec(), id, destroyForLease(), providerFor(), providers, buildImage() (+41 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (44): main(), authedJson(), clearSession(), ensurePay(), fail(), loadWallet(), maxAtomic(), networkName() (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (27): Contribute(), Dashboard(), fmtDuration(), Props, resolveStats(), Props, GoogleCallback(), Props (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (34): admin/index.html — SPA entry mounting React via /src/main.tsx, Admin SPA (admin.tendrilhq.com) — Google sign-in, email allowlist, gas grant review, Platform custodial account (PLATFORM_PAYTO + PLATFORM_PRIVATE_KEY), Claude Desktop Client, Model Context Protocol, Registry HTTP API, Spend Cap, Tendril MCP (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (22): DOCS, Group, Heading, MdDocId, Section, ArchDiagram(), FlowMode, API_DOCS (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (29): adminRouter, Handler, requireAdmin(), adminFromAuthHeader(), activeUsersByChange(), ActiveWindow, countGasRequestsByStatus(), countGoogleUsers() (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (31): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, modal, nanoid (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (29): Props, algod, fetchOnchainBalances(), fetchWalletAccount(), fetchWalletGasRequest(), optInUsdcWithWallet(), submitWalletGasRequest(), payingFetch() (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (22): CustodialSignProvider(), network, PayStage, serializeSigner(), walletQueue, hourly, mainnet, quote (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (29): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @x402/avm, @x402/core (+21 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (26): AssetInfo, discoveryExtensions(), RouteDiscovery, serviceMetadata, discovered, payloadFor(), rent, run (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): dependencies, algosdk, @blockshake/defly-connect, lute-connect, marked, @perawallet/connect, react, react-dom (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (22): createApiKey(), syncGasGrantEligibility, getLease(), leaseByPayment(), waitForLeaseAccess(), Handler, isOpenSshPubKey(), jobError() (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (23): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, addressFromSession(), AdminInfo (+15 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (18): ExportKeyModal(), Props, Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, PendingConfirm, confirmCustodial() (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (18): config, net, repoRoot, Lease, proratedCost(), closeLease(), earnsPayout(), expiredLeaseAction() (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (21): initDb(), inTransaction(), ledger(), [{ n }], otherAfter, otherBefore, [{ s }], schemas (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (17): Explore(), fmtCountdown(), fmtDuration(), fmtCountdown(), LeasePanel(), Props, PRESETS, Props (+9 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (18): runInSandbox(), activeLeases, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, handleRun(), HeartbeatMsg (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (19): dependencies, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/react, @types/react-dom (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (19): description, engines, node, name, overrides, lute-connect, private, scripts (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (16): BalanceChart(), Props, Pt, GoogleWalletBar(), short(), formatAlgo(), OnchainAccountPanel(), OnchainPanelState (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (18): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, Authentication, Contributor, DELETE /keys/:id, `DELETE /x402/leases/:id`, `GET /keys` (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (17): issueEmailSession(), accountFromUser(), CustodialAccount, decryptMnemonic(), encryptionKey(), encryptMnemonic(), generateCustodialAccount(), signTransactions() (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (15): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), pending, PendingRequest, PrepareAction, prepareCustodialSign() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (17): `200 OK`, Billing, and how you can end up owing money, `DELETE /x402/leases/:id`, Endpoints, Example, Example — inside a lease you hold, Example — no lease, no setup, `GET /explorer` (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (14): isOnline(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes, onlinePeers(), pickBestValueNode() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (12): asText(), availabilityCopy(), cellsFrom(), clip(), NotebookSection(), outputsFrom(), PendingNotebook, ShownCell (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (16): CORS, DELETE /x402/leases/:id (api.md), Error index, Paid endpoints, Reference, `400 Bad Request`, `402 Payment Required`, `502 Bad Gateway` (+8 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (15): AlgorandNetwork, ExportKeyResponse, Job, LeaseBilling, NETWORKS, NodeStatus, Payout, PlatformTreasury (+7 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (16): Bazaar scrapes title as service name, Favicon /favicon.svg, Google Fonts: JetBrains Mono, Newsreader, Plus Jakarta Sans, Module entry /src/main.tsx, React mount point #root, Rent sandboxed SSH by hour; x402 Algorand USDC, OG image https://tendrilhq.com/og.png, Open Graph metadata (+8 more)

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (12): ConnectWalletModal(), Props, EmailAuthModal(), Props, short(), WalletBar(), fetchEmailEnabled(), fetchGoogleEnabled() (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.26
Nodes (14): containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SANDBOX_CTX, SandboxEndpoint, sandboxTag() (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (10): BoardTab, ChartRange, fmtUsdc(), LineCard(), Metrics(), monthStartMs(), windowSeries(), MetricPoint (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (13): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), touchUserLogin(), disabled() (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (12): clampMarkup(), HOSTED_SKUS, hostedById(), hostedCatalog(), hostedHourlyUsd(), HostedSku, MODAL_GPU_USD_PER_HOUR, modalConfigured() (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.25
Nodes (14): sandboxLifetimeMs(), fundedSeconds(), abandonLease(), activateLease(), createLease(), failLease(), fundedUntil(), nodeBusy() (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.28
Nodes (12): Dirt lane, Right fence post, Garden hedges, Main stone cottage, Side stone cottage, Cloudy sky, Brown tile roofs, Left tall tree (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.28
Nodes (13): Alpine Lake, Alpine Mountain Lake Landscape Painting, Scattered Grey Boulders, Central Snow-Capped Mountain Peak, Cloud-Filled Blue Sky, Foreground Coniferous Pines, Flanking Rocky Mountain Ridges, Forested Midground Slopes (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (12): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b2. Admin app (static SPA), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.15
Nodes (13): Free / read, `GET /explorer`, `GET /health`, `GET /metrics`, `GET /nodes`, `GET /platform`, Authentication, CORS (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.17
Nodes (11): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.27
Nodes (12): Field landscape painting, Horizontal landscape composition, Two seated figures, Rolling green hills, Wildflower meadow, Green-blue-cream palette, Dirt path, Artist signature (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.24
Nodes (12): lime-field-paint.jpg, Wide horizontal composition, Pastoral landscape genre, Serene rural mood, Impasto brushwork, Monochrome lime palette, Farmstead buildings, Open agricultural field (+4 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (11): Browser — same code, different signer, Client recipes, Configuration, Error index, Node — the whole flow, no sign-in, Reference, Table of contents, Tendril x402 API (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (11): Full Pipeline, God Nodes, graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Query, NetworkX (+3 more)

### Community 52 - "Community 52"
Cohesion: 0.38
Nodes (11): hills-smudge-art.jpg, Layered depth composition, Alpine landscape painting, Serene wilderness mood, Impasto / smudge brushwork, Sage-green monochrome palette, Rocky meadow foreground, Coniferous forest slopes (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (9): GoogleAccountInfo, findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGoogleGasGrantEligibility() (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): Claude starburst path, Claude (Anthropic), Perplexity, currentColor fill, logo path, svg root, web/public/assets

### Community 56 - "Community 56"
Cohesion: 0.31
Nodes (8): Clouded blue sky, White wildflower meadow, Distant village roofs, Impressionist pastoral landscape, Left tree cluster, Winding dirt path, Pastoral calm atmosphere, Seated pair on path

### Community 57 - "Community 57"
Cohesion: 0.32
Nodes (7): AgentMesh brand/UI mark, currentColor fill, Display size 20x16, Filled path silhouette, Web public static asset, AgentMesh SVG icon, viewBox 2 5 58 44

### Community 58 - "Community 58"
Cohesion: 0.43
Nodes (8): Clouds Painting, Soft Atmospheric Mood, Panoramic Cloudscape, Cumulus Cloud Forms, Horizontal Banner Format, Impasto Oil Technique, Light and Shadow Cloud Modeling, Sage Green Monochrome Palette

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (7): Grok mark lower path, Grok mark upper path, USDC logo, Grok (xAI), currentColor fill, USDC (USD Coin), USDC compound path

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (7): app, corsOrigin, startWatchdog(), router, initWs(), checkDiscoveryConfig(), checkFacilitator()

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 63 - "Community 63"
Cohesion: 0.25
Nodes (8): AssetInfo, Common schemas, Error envelope, PaymentPayload, PaymentReceipt, PaymentRequired, SandboxAccess, SettleResponse

### Community 64 - "Community 64"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 65 - "Community 65"
Cohesion: 0.29
Nodes (5): main(), serializeSigner(), SignTransactions, walletQueue, Wallet

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (8): AVM_PRIVATE_KEY, @tendril/mcp-server, TENDRIL_API_KEY, tendril_list_nodes, Tendril MCP, tendril_platform, Tendril registry, x402

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 68 - "Community 68"
Cohesion: 0.43
Nodes (7): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo()

### Community 70 - "Community 70"
Cohesion: 0.38
Nodes (5): allowedOrigin(), corsPolicy(), isPayablePath(), PAYABLE_PATHS, X402_HEADERS

### Community 71 - "Community 71"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (6): build, contributor, docker.sock, docker-compose.yml, TENDRIL_API_KEY, @tendril/shared

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (6): Option A — the bundled agent, Option B — rent a box and SSH into it, Renting from the CLI, Things that bite, What `curl` can and cannot do, Working, then stopping

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 75 - "Community 75"
Cohesion: 0.60
Nodes (4): algod, decodeSigned(), noteText(), verifyLoginSignature()

### Community 76 - "Community 76"
Cohesion: 0.60
Nodes (4): main(), detectGpu(), detectSpecs(), execFileP

### Community 77 - "Community 77"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (3): Brand green #0B5D3A, Cream #F4F1EA, Serif T mark

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 81 - "Community 81"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (3): Auto-Clarity, Boundaries, Caveman

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (3): Algorand, Algorand glyph path, Algorand logo

## Knowledge Gaps
- **479 isolated node(s):** `@opencode-ai/plugin`, `name`, `version`, `private`, `type` (+474 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatUsdc()` connect `Community 23` to `Community 32`, `Community 34`, `Community 36`, `Community 38`, `Community 9`, `Community 10`, `Community 41`, `Community 14`, `Community 16`, `Community 18`, `Community 19`, `Community 28`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Community 3` to `Community 34`, `Community 2`, `Community 7`, `Community 9`, `Community 19`, `Community 23`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `AdminDashboard` connect `Community 0` to `Community 34`, `Community 7`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Fetch` (e.g. with `main()` and `loginWithWallet()`) actually correct?**
  _`Fetch` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@opencode-ai/plugin`, `name`, `version` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08469449485783424 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06623376623376623 - nodes in this community are weakly interconnected._