# Graph Report - Tendril  (2026-10-19)

## Corpus Check
- 200 files · ~472,442 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: (none) 11, .example 5, .css 4)

## Summary
- 1718 nodes · 3477 edges · 144 communities (96 shown, 42 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

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
- Rural lime-green landscape
- x402-api.md
- Full Pipeline
- hills-smudge-art.jpg
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
- contributor
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
- Facilitator-sponsored network fee
- Security & Sandboxes
- SSH Access & Keys
- Getting started
- Sandboxes & Bore Tunnels
- Algorand settlement basics
- BalanceChart.tsx
- scripts
- web/src/app/client-shell.tsx
- admin/vercel.json
- docs-web/vercel.json
- Welcome to Tendril
- web/vercel.json
- web/next.config.ts
- admin/next-env.d.ts
- entrypoint.sh
- docs-web/next-env.d.ts
- types.d.ts
- script.js
- web/next-env.d.ts
- .clinerules/caveman.md
- copilot-instructions.md
- AGENTS.md
- About.tsx
- rules/caveman.md
- Tendril x402 API
- AgentMesh brand UI mark
- currentColor fill
- Display size 20x16
- Filled path silhouette
- Web public static asset
- AgentMesh SVG icon
- viewBox 2 5 58

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 33 edges
2. `formatUsdc()` - 31 edges
3. `runAnywhere()` - 28 edges
4. `Session` - 28 edges
5. `config` - 26 edges
6. `SignTransactions` - 21 edges
7. `startSandbox()` - 19 edges
8. `WalletBar()` - 19 edges
9. `creditBalance()` - 18 edges
10. `api()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Backend Registry Service` --semantically_similar_to--> `Backend Registry`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `Website` --semantically_similar_to--> `Web App`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `Contributor Script` --semantically_similar_to--> `Contributor Agent`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `Autonomous Training Agent` --semantically_similar_to--> `Autonomous Consumer Agent`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `Compute Marketplace` --semantically_similar_to--> `Pay-per-call Compute Marketplace`  [INFERRED] [semantically similar]
  docs/welcome.md → README.md

## Import Cycles
- 4-file cycle: `backend/src/leases.ts -> backend/src/providers/index.ts -> backend/src/providers/contributor.ts -> backend/src/ws.ts -> backend/src/leases.ts`

## Hyperedges (group relationships)
- **Graphify three outputs** — agents_graph_html, agents_graph_report, agents_graph_json [EXTRACTED 1.00]
- **Graphify query fast path** — agents_graphify, agents_graph_json, agents_graphify_query [EXTRACTED 1.00]
- **Caveman mode controls** — agents_caveman, agents_auto_clarity, agents_boundaries [EXTRACTED 1.00]
- **Tendril authentication credential model** — docs_api_auth_model, docs_api_get_wallet, docs_api_post_keys, docs_api_get_lease [EXTRACTED 1.00]
- **ChatGPT Radial Logo Construction** — web_public_assets_chatgpt_logo_mark, web_public_assets_chatgpt_petal_path, web_public_assets_chatgpt_60deg_rotation_instances, web_public_assets_chatgpt_six_petal_hexagram [EXTRACTED 1.00]
- **Tendril OG Brand Lockup** — web_public_og_social_preview, web_public_og_tendril_wordmark, web_public_og_ellipsis_motif, web_public_og_last_mile_of_funding [EXTRACTED 1.00]
- **Tendril Three-plane Architecture** — docs_start_architecture_flow_control_plane, docs_start_architecture_flow_execution_plane, docs_start_architecture_flow_settlement_plane [EXTRACTED 1.00]
- **x402 Verify Work Settle Flow** — docs_x402_api_payment_required, docs_x402_api_payment_signature, docs_x402_api_payment_flow, docs_x402_api_release_endpoint [EXTRACTED 1.00]
- **Sandbox Access and Security** — docs_concepts_sandboxes_bore_tunnels_disposable_execution, docs_concepts_sandboxes_bore_tunnels_outbound_tunnel, docs_guides_access_security_sandboxes_isolation_controls, docs_guides_access_ssh_access_keys_public_key_authentication [INFERRED 0.85]
- **Cloudscape Visual Composition** — web_public_assets_cloudscape_cloudscape_image, web_public_assets_cloudscape_cumulus_clouds, web_public_assets_cloudscape_atmospheric_perspective, web_public_assets_cloudscape_pastel_green_palette [EXTRACTED 1.00]
- **Rural Cottage Scene** — web_public_assets_countryside_cottages_countryside_cottages, web_public_assets_countryside_cottages_rustic_cottages, web_public_assets_countryside_cottages_rural_landscape, web_public_assets_countryside_cottages_garden_path [INFERRED 0.95]
- **Pastoral Landscape Composition** — web_public_assets_countryside_meadow_panorama_meadow, web_public_assets_countryside_meadow_panorama_farmhouse, web_public_assets_countryside_meadow_panorama_mountains, web_public_assets_countryside_meadow_panorama_trees, web_public_assets_countryside_meadow_panorama_path, web_public_assets_countryside_meadow_panorama_cloudy_sky [EXTRACTED 1.00]
- **Alpine Landscape Scene** — web_public_assets_lake_valley_lake_valley_landscape, web_public_assets_lake_valley_alpine_lake, web_public_assets_lake_valley_snow_capped_mountain_range, web_public_assets_lake_valley_conifer_forest [EXTRACTED 1.00]
- **Mountain, Lake, and Forest Scene** — web_public_assets_lake_and_mountain_vista_alpine_mountain_landscape, web_public_assets_lake_and_mountain_vista_alpine_lake, web_public_assets_lake_and_mountain_vista_evergreen_forest [EXTRACTED 1.00]
- **Meadow Landscape Scene** — web_public_assets_meadow_path_and_hills_meadow_path_and_hills, web_public_assets_meadow_path_and_hills_meadow_path, web_public_assets_meadow_path_and_hills_flowering_meadow, web_public_assets_meadow_path_and_hills_rolling_hills, web_public_assets_meadow_path_and_hills_tree_line, web_public_assets_meadow_path_and_hills_rural_village, web_public_assets_meadow_path_and_hills_cloudy_sky [EXTRACTED 1.00]
- **Pastoral Scene Composition** — web_public_assets_meadow_under_cloudy_skies_meadow, web_public_assets_meadow_under_cloudy_skies_cloudy_sky, web_public_assets_meadow_under_cloudy_skies_tree_line, web_public_assets_meadow_under_cloudy_skies_rural_village, web_public_assets_meadow_under_cloudy_skies_rolling_hills, web_public_assets_meadow_under_cloudy_skies_wildflowers [EXTRACTED 1.00]
- **Tendril Favicon Brand Mark** — web_public_favicon_favicon, web_public_favicon_green_background, web_public_favicon_cream_t_monogram [EXTRACTED 1.00]

## Communities (144 total, 42 thin omitted)

### Community 0 - "lib/api.ts"
Cohesion: 0.07
Nodes (53): Dashboard(), fmtAlgo(), fmtUsdc(), Filter, FILTERS, fmtAlgo(), fmtDate(), GasRequests() (+45 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (49): Fetch, main(), MIN_RAM_MB, postJson(), REGISTRY, repoRoot, request(), signer() (+41 more)

### Community 2 - "WalletBar.tsx"
Cohesion: 0.08
Nodes (42): clampE2bMarkup(), clampMarkup(), E2B_DEFAULT_SIZE, E2B_GIB_OPTIONS, E2B_NOTEBOOK_GIB, E2B_NOTEBOOK_VCPU, E2B_PRESETS, E2B_USD_PER_GIB_SECOND (+34 more)

### Community 3 - "backend/package.json"
Cohesion: 0.04
Nodes (43): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @x402/avm, @x402/core (+35 more)

### Community 4 - "Leedlime landing page"
Cohesion: 0.06
Nodes (35): ClientShell(), DocsRuntime, ArchDiagram(), compactEdges, compactNodes, Connection, EdgeId, edges (+27 more)

### Community 5 - "Backend / Registry"
Cohesion: 0.09
Nodes (35): addressFromSession(), AdminInfo, isCustodialSessionKind(), issueLeaseToken(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), sessionFromAuthHeader() (+27 more)

### Community 6 - "web/src/App.tsx"
Cohesion: 0.05
Nodes (34): dependencies, marked, next, react, react-dom, react-router-dom, devDependencies, @playwright/test (+26 more)

### Community 7 - "mcp/package.json"
Cohesion: 0.09
Nodes (33): sandboxLifetimeMs(), closeLease(), createLease(), earnsPayout(), expiredLeaseAction(), fundedUntil(), getRunResult(), leases (+25 more)

### Community 8 - "shared/src/index.ts"
Cohesion: 0.09
Nodes (26): lute-connect, PaymentReceipt, WalletNonceResponse, App(), signIn(), ClientShell(), WebRuntime, ConnectWalletModal (+18 more)

### Community 9 - "docs-web/package.json"
Cohesion: 0.14
Nodes (31): topUp(), discoveryExtensions(), RouteDiscovery, ROUTES, serviceMetadata, discovered, payloadFor(), rent (+23 more)

### Community 10 - "db.ts"
Cohesion: 0.08
Nodes (36): Leedlime landing page, Built on accuracy, not volume, Agent chat UI (Good evening / Find my ICP matches), Built for humans and agents, B2B outreach / lead generation, Get started for free, Dashboard/leads UI mock (Good afternoon, Michael / lead list), Current, not archived data (+28 more)

### Community 11 - "tools.ts"
Cohesion: 0.13
Nodes (28): @txnlab/use-wallet-react, EmailSessionResponse, GoogleSessionResponse, WalletAccountResponse, WalletLoginResponse, ConnectWalletModal(), handleGoogleLogin(), Props (+20 more)

### Community 12 - "routes.ts"
Cohesion: 0.14
Nodes (27): usdToAtomic(), WalletSummary, ActiveLease, explorerAddrUrl(), explorerTxUrl(), Dashboard, Marketplace, Session (+19 more)

### Community 13 - "docker.ts"
Cohesion: 0.09
Nodes (30): agentSockets, pendingContainers, pendingJobs, activeLeases, AgentHelloMsg, ALGORAND_MAINNET_CAIP2, AlgorandNetwork, AssetInfo (+22 more)

### Community 14 - "leases.ts"
Cohesion: 0.12
Nodes (26): config, net, repoRoot, checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), failPaid() (+18 more)

### Community 15 - "admin/package.json"
Cohesion: 0.11
Nodes (24): formatUsdc(), formatUsdcExact(), GasRequestInfo, GoogleAccountResponse, GoogleCallback, BalanceChart(), ExportKeyModal(), Props (+16 more)

### Community 16 - "contributor.ts"
Cohesion: 0.07
Nodes (29): dependencies, next, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/node (+21 more)

### Community 17 - "src/api.ts"
Cohesion: 0.10
Nodes (24): REGISTRY_URL, DocsRedirect, LandingPage, McpModal, DocsRedirect(), HashHero(), HashHeroProps, prefersReducedMotion() (+16 more)

### Community 18 - "registry.ts"
Cohesion: 0.17
Nodes (27): containerName(), dockerFailure(), dockerLog(), dockerNcpu(), ensureImage(), execFileP, ExecProfile, execRunArgs() (+19 more)

### Community 19 - "custodialSign.ts"
Cohesion: 0.10
Nodes (26): NotebookRun, isAllowedNotebookImage(), jobError(), readJob(), RunArtifact, JOB_LOG_MAX_BYTES, JOB_RESULT_MAX_BYTES, NormalizedNotebookRuntimeOptions (+18 more)

### Community 20 - "contributor/package.json"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+18 more)

### Community 21 - "example-buyer/package.json"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+18 more)

### Community 22 - "McpModal.tsx"
Cohesion: 0.07
Nodes (26): description, engines, node, name, overrides, lute-connect, private, scripts (+18 more)

### Community 23 - "Session"
Cohesion: 0.13
Nodes (22): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, adminRouter, Handler (+14 more)

### Community 24 - "scripts"
Cohesion: 0.10
Nodes (24): activeUsersByChange(), ActiveWindow, createGasRequest(), cumulativeByChange(), hashKey(), isWalletGasGrantEligible(), listApiKeys(), listGasRequests() (+16 more)

### Community 25 - "api.md"
Cohesion: 0.15
Nodes (24): e2bConfigured(), isHosted(), modalConfigured(), abandonLease(), activateLease(), failLease(), hasLivePayerLease(), nodeBusy() (+16 more)

### Community 26 - "example-buyer/src/index.ts"
Cohesion: 0.13
Nodes (25): LeaseStatus, RunJobResponse, E2bPreset, E2bSize, e2bSizeKey(), asText(), availabilityCopy(), cellsFrom() (+17 more)

### Community 27 - "web/package.json"
Cohesion: 0.16
Nodes (23): buildImage(), DEPENDENCY_PROBE, destroy(), drop(), ensureImage(), exec(), execText(), id (+15 more)

### Community 28 - "NotebookSection.tsx"
Cohesion: 0.16
Nodes (18): NewLease, contributorProvider, destroy(), id, start(), providers, ComputeProvider, ExecArgs (+10 more)

### Community 29 - "compilerOptions"
Cohesion: 0.09
Nodes (22): algosdk, dotenv, nanoid, @tendril/shared, tsx, @types/node, typescript, @x402/avm (+14 more)

### Community 30 - "`POST /x402/run`"
Cohesion: 0.25
Nodes (21): apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMetrics(), fetchMyNodes(), fetchPlatform() (+13 more)

### Community 31 - "modal.ts"
Cohesion: 0.09
Nodes (21): @blockshake/defly-connect, buffer, @perawallet/connect, process, algosdk, next, react, react-dom (+13 more)

### Community 32 - "notebookRunner.ts"
Cohesion: 0.22
Nodes (17): releaseLease(), rentNode(), toActiveLease(), writeClipboard(), copy(), Explore(), copy(), handleRelease() (+9 more)

### Community 33 - "`POST /topup`"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 34 - "Explore.tsx"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.11
Nodes (19): Contributor Daemon, Contributor Withdrawals, Grace Window, Per-Second Metering, Usage Calculation, Disposable Execution, Ephemeral One-shot Sandbox, Isolation Controls (+11 more)

### Community 36 - "config"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, cors, dotenv, e2b, express, jsonwebtoken, modal (+10 more)

### Community 37 - "compilerOptions"
Cohesion: 0.27
Nodes (16): initDb(), inTransaction(), ledger(), [{ n }], otherAfter, otherBefore, [{ s }], schemas (+8 more)

### Community 38 - "credit.ts"
Cohesion: 0.21
Nodes (17): apiKey(), bounded(), destroy(), drop(), e2bProvider, ensureTemplate(), exec(), id (+9 more)

### Community 39 - "backend/src/config.ts"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 40 - "runAnywhere"
Cohesion: 0.18
Nodes (14): app, corsOrigin, main(), startWatchdog(), router, initWs(), allowedOrigin(), corsPolicy() (+6 more)

### Community 41 - "emailAuth.ts"
Cohesion: 0.31
Nodes (13): issueEmailSession(), generateCustodialAccount(), createEmailUser(), findUserByEmail(), isEmailAuthEnabled(), disabled(), emailEnabled(), emailLogin() (+5 more)

### Community 42 - "hosted.ts"
Cohesion: 0.13
Nodes (15): Backend Registry, Neon Postgres, Platform Algorand Account, Backend Compose Service, Algorand Settlement, Algorand USDC Asset, Sandboxes and Bore Tunnels, Network Discovery (+7 more)

### Community 43 - "painting1.jpg"
Cohesion: 0.19
Nodes (14): MetricPoint, Metrics, RankRow, Metrics, Board(), BoardTab, ChartRange, fmtDur() (+6 more)

### Community 44 - "Alpine Mountain Lake Landscape Painting"
Cohesion: 0.13
Nodes (15): dependencies, algosdk, @blockshake/defly-connect, buffer, lute-connect, next, @perawallet/connect, process (+7 more)

### Community 45 - "3. Production deployment"
Cohesion: 0.29
Nodes (13): issueGoogleExchangeCode(), issueGoogleSession(), verifyGoogleExchangeCode(), googleAuthEnabled(), createUser(), findUserByGoogleSub(), touchUserLogin(), disabled() (+5 more)

### Community 46 - "Overview"
Cohesion: 0.23
Nodes (12): hasOptedIn(), loadPlatformKey(), payContributor(), payoutsEnabled(), platformAddress(), platformBalances, sendAlgo(), algod (+4 more)

### Community 47 - "dependencies"
Cohesion: 0.21
Nodes (11): SignPrepareResponse, Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), approve(), PendingConfirm (+3 more)

### Community 48 - "Field landscape painting"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 49 - "Rural lime-green landscape"
Cohesion: 0.32
Nodes (10): googleAccountInfo, findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), shouldMarkGasGrantIneligible(), syncGasGrantEligibility (+2 more)

### Community 50 - "x402-api.md"
Cohesion: 0.20
Nodes (11): Full Pipeline, God Nodes, graph.html, graph.json, GRAPH_REPORT.md, Graphify, Graphify Query, NetworkX (+3 more)

### Community 51 - "Full Pipeline"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 52 - "hills-smudge-art.jpg"
Cohesion: 0.39
Nodes (7): exec(), runNotebook(), notebookToPayload(), parseNotebookRun(), execute(), executeNotebook(), notebook()

### Community 53 - "Docs.tsx"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 54 - "Metrics.tsx"
Cohesion: 0.25
Nodes (7): Claude (Anthropic), web/public/assets, Claude starburst path, Perplexity, currentColor fill, logo path, svg root

### Community 55 - "perplexity.svg"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 56 - "painting2.jpg"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 57 - "agentmesh.svg"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 58 - "Clouds Painting"
Cohesion: 0.29
Nodes (7): Grok (xAI), currentColor fill, Grok mark lower path, Grok mark upper path, USDC logo, USDC (USD Coin), USDC compound path

### Community 59 - "grok.svg"
Cohesion: 0.25
Nodes (8): Autonomous Consumer Agent, Buyer Compose Service, Autonomous Agent Tool Loop, Serverless Python Execution, One-shot Jobs, MCP Consumer Tools, One-shot Run Endpoint, Autonomous Training Agent

### Community 60 - "CustodialSignContext.tsx"
Cohesion: 0.25
Nodes (8): AVM_PRIVATE_KEY, @tendril/mcp-server, TENDRIL_API_KEY, tendril_list_nodes, Tendril MCP, tendril_platform, Tendril registry, x402

### Community 61 - "compilerOptions"
Cohesion: 0.25
Nodes (8): Cloudy Sky, Farmhouse and Barns, Flowering Meadow, Distant Mountain Range, Pastoral Landscape, Winding Field Path, Countryside Meadow Panorama, Scattered Trees

### Community 62 - "ref_next"
Cohesion: 0.25
Nodes (8): Cloudy Sky, Flowering Meadow, Landscape Painting, Meadow Path, Meadow Path and Hills, Rolling Hills, Rural Village, Tree Line

### Community 63 - "Common schemas"
Cohesion: 0.29
Nodes (7): devDependencies, @types/cors, @types/express, @types/jsonwebtoken, @types/node, @types/pg, typescript

### Community 64 - "googleAuth.ts"
Cohesion: 0.29
Nodes (7): Contributor Agent, Outbound Bore Tunnel, Sandbox Access Details, Lease Connection Details, SSH Access and Keys, Rent and SSH, Contributor Script

### Community 65 - "ref_node_assert"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../tsconfig.base.json

### Community 66 - "Tendril MCP"
Cohesion: 0.29
Nodes (7): devDependencies, @tendril/shared, @types/node, @types/react, @types/react-dom, typescript, webpack

### Community 67 - "docs.ts"
Cohesion: 0.29
Nodes (7): Cloudy Sky, Flower-Filled Meadow, Pastoral Landscape Painting, Rolling Hills, Rural Village, Tree Line, White Wildflowers

### Community 68 - "gasGrant.ts"
Cohesion: 0.43
Nodes (6): main(), serializeSigner(), SignTransactions, sleep(), waitForSlot(), walletQueue

### Community 69 - "ArchDiagram.tsx"
Cohesion: 0.53
Nodes (6): stopSandbox(), handleDestroy(), handleRun(), handleStart(), main(), shutdown()

### Community 70 - "Build on Tendril"
Cohesion: 0.33
Nodes (6): Authentication credential model (session/API key/lease/payment), POST /auth/wallet-login, GET /auth/wallet-nonce, GET /lease/:id, GET /wallet, POST /keys

### Community 71 - "Six-Petal Radial Hexagram"
Cohesion: 0.47
Nodes (6): 60° Rotational Instance Uses, currentColor Monochrome Fill, ChatGPT Logo Mark, OpenAI / ChatGPT Brand Identity, Shared Petal Path (#chatgpt-petal), Six-Petal Radial Hexagram

### Community 72 - "contributor"
Cohesion: 0.33
Nodes (6): Alpine Lake, Alpine Mountain Landscape, Evergreen Forest, Lake and Mountain Vista, Textured Oil Painting Style, Snow-Capped Mountain Peak

### Community 73 - "Renting from the CLI"
Cohesion: 0.40
Nodes (5): Prepaid Credit, Payment Challenge, MCP Spend Cap, Top Up USDC, PaymentRequired

### Community 74 - "shared/package.json"
Cohesion: 0.40
Nodes (5): Sign and Retry, AVM Private Key, Stdio Model Context Protocol Server, Wallet Sign-in, PAYMENT-SIGNATURE Header

### Community 75 - "backend/tsconfig.json"
Cohesion: 0.40
Nodes (5): USDC with x402, Compute Marketplace, Pay-per-call Compute Marketplace, Tendril, x402 over USDC on Algorand

### Community 76 - "contributor/tsconfig.json"
Cohesion: 0.60
Nodes (4): Charge, TopUp, Props, Pt

### Community 77 - "Tendril Open Graph Social Preview"
Cohesion: 0.40
Nodes (5): scripts, build, dev, start, typecheck

### Community 78 - "favicon.svg"
Cohesion: 0.40
Nodes (5): Countryside Cottages, Garden Path, Impressionist Painting, Rural Landscape, Rustic Cottages

### Community 79 - "example-buyer/tsconfig.json"
Cohesion: 0.40
Nodes (5): Alpine Lake, Conifer Forest, Lake Valley Landscape, Painterly Landscape Aesthetic, Snow-Capped Mountain Range

### Community 80 - "Docker Backend Service"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 81 - "Tendril Favicon Mark"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 82 - "Caveman"
Cohesion: 0.50
Nodes (4): E2bSize, JobInput, RunRequest, NotebookRuntimeOptions

### Community 84 - "Defly"
Cohesion: 0.83
Nodes (3): detectGpu(), detectSpecs(), execFileP

### Community 85 - "pera.svg"
Cohesion: 0.50
Nodes (4): Verify, Work, Settle Flow, Request Flow, x402 Payment Flow, Verify, Work, Settle

### Community 86 - "mcp/tsconfig.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 87 - "components/Dashboard.tsx"
Cohesion: 0.50
Nodes (4): Atmospheric Perspective, Cloudscape Image, Cumulus Clouds, Pastel Green Palette

### Community 88 - "One-shot Jobs"
Cohesion: 0.67
Nodes (3): Brand green #0B5D3A, Cream #F4F1EA, Serif T mark

### Community 89 - "Architecture & Flow"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 91 - "Contributor Tools"
Cohesion: 0.67
Nodes (3): Auto-Clarity, Boundaries, Caveman

### Community 92 - "docs-runtime.tsx"
Cohesion: 0.67
Nodes (3): scripts, dev, start

### Community 94 - "devDependencies"
Cohesion: 0.67
Nodes (3): Contributor Compose Service, Docker Socket Mount, Contributor Compose Service

### Community 96 - "Algorand Settlement"
Cohesion: 0.67
Nodes (3): Documentation App, Web App, Website

### Community 97 - "Per-Second Metering"
Cohesion: 0.67
Nodes (3): Best-Value Scoring Algorithm, Best-Value Idle Machine, Explorer Discovery Endpoint

### Community 100 - "tendril_list_nodes"
Cohesion: 0.67
Nodes (3): Algorand logo, Algorand, Algorand glyph path

### Community 102 - "tendril_run"
Cohesion: 0.67
Nodes (3): Cream T Monogram, Tendril Favicon, Deep Green Background

## Knowledge Gaps
- **665 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `type` (+660 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 724 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `api()` connect `server.ts` to `Leedlime landing page`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `@txnlab/use-wallet-react` connect `tools.ts` to `shared/src/index.ts`, `modal.ts`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _665 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07287093942054433 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0889894419306184 - nodes in this community are weakly interconnected._
- **Should `WalletBar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08233117483811286 - nodes in this community are weakly interconnected._
- **Should `backend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._