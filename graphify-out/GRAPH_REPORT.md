# Graph Report - Tendril  (2026-10-20)

## Corpus Check
- 25 files · ~277,603 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1701 nodes · 3455 edges · 141 communities (94 shown, 47 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 93 edges (avg confidence: 0.92)
- Token cost: 120 input · 95 output

## Community Hubs (Navigation)
- Algorand Payments & Wallets
- server.ts
- Documentation & Reference
- Algorand Payments & Wallets
- Leedlime landing page
- Documentation & Reference
- web/src/App.tsx
- Authentication & Custodial Accounts
- shared/src/index.ts
- Web Frontend & Landing
- Authentication & Custodial Accounts
- Admin & Gas Requests
- Algorand Payments & Wallets
- Compute Leases & Watchdogs
- leases.ts
- Compute Leases & Watchdogs
- Authentication & Custodial Accounts
- Authentication & Custodial Accounts
- Docker Sandboxes & Runtimes
- Authentication & Custodial Accounts
- Algorand Payments & Wallets
- Algorand Payments & Wallets
- McpModal.tsx
- Admin & Gas Requests
- Compute Leases & Watchdogs
- Authentication & Custodial Accounts
- example-buyer/src/index.ts
- Authentication & Custodial Accounts
- NotebookSection.tsx
- compilerOptions
- `POST /x402/run`
- Algorand Payments & Wallets
- Algorand Payments & Wallets
- Compute Leases & Watchdogs
- Admin & Gas Requests
- compilerOptions
- config
- compilerOptions
- Algorand Payments & Wallets
- backend/src/config.ts
- runAnywhere
- Documentation & Reference
- Documentation & Reference
- Authentication & Custodial Accounts
- Alpine Mountain Lake Landscape Painting
- Algorand Payments & Wallets
- Overview
- Algorand Payments & Wallets
- Authentication & Custodial Accounts
- Rural lime-green landscape
- Compute Leases & Watchdogs
- Compute Leases & Watchdogs
- hills-smudge-art.jpg
- Docs.tsx
- Metrics.tsx
- perplexity.svg
- painting2.jpg
- MCP Protocol & Tools
- Clouds Painting
- grok.svg
- MCP Protocol & Tools
- compilerOptions
- ref_next
- Common schemas
- Compute Leases & Watchdogs
- ref_node_assert
- Tendril MCP
- docs.ts
- gasGrant.ts
- Docker Sandboxes & Runtimes
- Authentication & Custodial Accounts
- Six-Petal Radial Hexagram
- contributor
- Renting from the CLI
- Algorand Payments & Wallets
- Algorand Payments & Wallets
- Algorand Payments & Wallets
- Tendril Open Graph Social Preview
- favicon.svg
- example-buyer/tsconfig.json
- Docker Backend Service
- Tendril Favicon Mark
- Admin & Gas Requests
- Algorand logo
- Defly
- pera.svg
- Documentation & Reference
- components/Dashboard.tsx
- One-shot Jobs
- Architecture & Flow
- Consumer Tools
- Contributor Tools
- Docker Sandboxes & Runtimes
- shared/tsconfig.json
- devDependencies
- Algorand Payments & Wallets
- Algorand Settlement
- Algorand Payments & Wallets
- Algorand Payments & Wallets
- tendril_account
- Admin & Gas Requests
- tendril_run
- MCP Protocol & Tools
- tendril_withdraw
- Facilitator-sponsored network fee
- Algorand Payments & Wallets
- Documentation & Reference
- Sandboxes & Bore Tunnels
- Algorand settlement basics
- web/src/app/client-shell.tsx
- admin/vercel.json
- Compute Leases & Watchdogs
- docs-web/vercel.json
- Welcome to Tendril
- web/vercel.json
- web/next.config.ts
- admin/next-env.d.ts
- entrypoint.sh
- docs-web/next-env.d.ts
- types.d.ts
- Docker Sandboxes & Runtimes
- Algorand Payments & Wallets
- .clinerules/caveman.md
- copilot-instructions.md
- AGENTS.md
- github copilot instructions md
- opencode AGENTS md
- agentmesh svg
- AgentMesh brand UI mark
- currentColor fill
- Display size 20x16
- Filled path silhouette

## God Nodes (most connected - your core abstractions)
1. `apiError()` - 33 edges
2. `formatUsdc()` - 29 edges
3. `runAnywhere()` - 28 edges
4. `Session` - 27 edges
5. `config` - 27 edges
6. `SignTransactions` - 20 edges
7. `WalletBar()` - 19 edges
8. `startSandbox()` - 19 edges
9. `api()` - 18 edges
10. `NotebookSection()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Notebook Job` --semantically_similar_to--> `Notebook Jobs`  [INFERRED] [semantically similar]
  docs/guides-access/one-shot-jobs.md → README.md
- `Ephemeral Docker Container` --semantically_similar_to--> `Disposable Execution`  [INFERRED] [semantically similar]
  README.md → docs/concepts/sandboxes-bore-tunnels.md
- `Metered Rent Endpoint` --semantically_similar_to--> `Metered SSH Session`  [INFERRED] [semantically similar]
  docs/x402-api.md → README.md
- `Compute Marketplace` --semantically_similar_to--> `Pay-per-call Compute Marketplace`  [INFERRED] [semantically similar]
  docs/welcome.md → README.md
- `Verify, Work, Settle` --semantically_similar_to--> `Verify, Work, Settle Flow`  [INFERRED] [semantically similar]
  README.md → docs/concepts/usdc-with-x402.md

## Import Cycles
- 4-file cycle: `backend/src/leases.ts -> backend/src/providers/index.ts -> backend/src/providers/contributor.ts -> backend/src/ws.ts -> backend/src/leases.ts`

## Hyperedges (group relationships)
- **Tendril Three-plane Architecture** — docs_start_architecture_flow_control_plane, docs_start_architecture_flow_execution_plane, docs_start_architecture_flow_settlement_plane [EXTRACTED 1.00]
- **ChatGPT Radial Logo Construction** — web_public_assets_chatgpt_logo_mark, web_public_assets_chatgpt_petal_path, web_public_assets_chatgpt_60deg_rotation_instances, web_public_assets_chatgpt_six_petal_hexagram [EXTRACTED 1.00]
- **Tendril authentication credential model** — docs_api_auth_model, docs_api_get_wallet, docs_api_post_keys, docs_api_get_lease [EXTRACTED 1.00]
- **Tendril OG Brand Lockup** — web_public_og_social_preview, web_public_og_tendril_wordmark, web_public_og_ellipsis_motif, web_public_og_last_mile_of_funding [EXTRACTED 1.00]
- **Cloudscape Visual Composition** — web_public_assets_cloudscape_cloudscape_image, web_public_assets_cloudscape_cumulus_clouds, web_public_assets_cloudscape_atmospheric_perspective, web_public_assets_cloudscape_pastel_green_palette [EXTRACTED 1.00]
- **Pastoral Landscape Composition** — web_public_assets_countryside_meadow_panorama_meadow, web_public_assets_countryside_meadow_panorama_farmhouse, web_public_assets_countryside_meadow_panorama_mountains, web_public_assets_countryside_meadow_panorama_trees, web_public_assets_countryside_meadow_panorama_path, web_public_assets_countryside_meadow_panorama_cloudy_sky [EXTRACTED 1.00]
- **Mountain, Lake, and Forest Scene** — web_public_assets_lake_and_mountain_vista_alpine_mountain_landscape, web_public_assets_lake_and_mountain_vista_alpine_lake, web_public_assets_lake_and_mountain_vista_evergreen_forest [EXTRACTED 1.00]
- **Alpine Landscape Scene** — web_public_assets_lake_valley_lake_valley_landscape, web_public_assets_lake_valley_alpine_lake, web_public_assets_lake_valley_snow_capped_mountain_range, web_public_assets_lake_valley_conifer_forest [EXTRACTED 1.00]
- **Meadow Landscape Scene** — web_public_assets_meadow_path_and_hills_meadow_path_and_hills, web_public_assets_meadow_path_and_hills_meadow_path, web_public_assets_meadow_path_and_hills_flowering_meadow, web_public_assets_meadow_path_and_hills_rolling_hills, web_public_assets_meadow_path_and_hills_tree_line, web_public_assets_meadow_path_and_hills_rural_village, web_public_assets_meadow_path_and_hills_cloudy_sky [EXTRACTED 1.00]
- **Pastoral Scene Composition** — web_public_assets_meadow_under_cloudy_skies_meadow, web_public_assets_meadow_under_cloudy_skies_cloudy_sky, web_public_assets_meadow_under_cloudy_skies_tree_line, web_public_assets_meadow_under_cloudy_skies_rural_village, web_public_assets_meadow_under_cloudy_skies_rolling_hills, web_public_assets_meadow_under_cloudy_skies_wildflowers [EXTRACTED 1.00]
- **Tendril Favicon Brand Mark** — web_public_favicon_favicon, web_public_favicon_green_background, web_public_favicon_cream_t_monogram [EXTRACTED 1.00]
- **x402 Verify Work Settle Flow** — docs_x402_api_payment_required, docs_x402_api_payment_signature, docs_x402_api_payment_flow, docs_x402_api_release_endpoint [EXTRACTED 1.00]
- **Sandbox Access and Security** — docs_concepts_sandboxes_bore_tunnels_disposable_execution, docs_concepts_sandboxes_bore_tunnels_outbound_tunnel, docs_guides_access_security_sandboxes_isolation_controls, docs_guides_access_ssh_access_keys_public_key_authentication [INFERRED 0.85]
- **Rural Cottage Scene** — web_public_assets_countryside_cottages_countryside_cottages, web_public_assets_countryside_cottages_rustic_cottages, web_public_assets_countryside_cottages_rural_landscape, web_public_assets_countryside_cottages_garden_path [INFERRED 0.95]

## Communities (141 total, 47 thin omitted)

### Community 0 - "Algorand Payments & Wallets"
Cohesion: 0.07
Nodes (51): Dashboard(), fmtAlgo(), fmtUsdc(), Filter, FILTERS, fmtAlgo(), fmtDate(), GasRequests() (+43 more)

### Community 1 - "server.ts"
Cohesion: 0.09
Nodes (47): Fetch, main(), MIN_RAM_MB, postJson(), REGISTRY, repoRoot, request(), signer() (+39 more)

### Community 2 - "Documentation & Reference"
Cohesion: 0.06
Nodes (38): ClientShell(), DocsRuntime, ArchDiagram(), compactEdges, compactNodes, Connection, EdgeId, edges (+30 more)

### Community 3 - "Algorand Payments & Wallets"
Cohesion: 0.04
Nodes (43): bin, tendril-mcp, dependencies, algosdk, dotenv, @modelcontextprotocol/sdk, @x402/avm, @x402/core (+35 more)

### Community 4 - "Leedlime landing page"
Cohesion: 0.09
Nodes (40): clampE2bMarkup(), clampMarkup(), E2B_DEFAULT_SIZE, E2B_GIB_OPTIONS, E2B_NOTEBOOK_GIB, E2B_NOTEBOOK_VCPU, E2B_PRESETS, E2B_USD_PER_GIB_SECOND (+32 more)

### Community 5 - "Documentation & Reference"
Cohesion: 0.05
Nodes (34): dependencies, marked, next, react, react-dom, react-router-dom, devDependencies, @playwright/test (+26 more)

### Community 6 - "web/src/App.tsx"
Cohesion: 0.08
Nodes (34): agentSockets, pendingContainers, pendingJobs, activeLeases, AgentHelloMsg, ALGORAND_MAINNET_CAIP2, ALGORAND_TESTNET_CAIP2, AlgorandNetwork (+26 more)

### Community 7 - "Authentication & Custodial Accounts"
Cohesion: 0.14
Nodes (28): @txnlab/use-wallet-react, EmailSessionResponse, GoogleSessionResponse, WalletLoginResponse, REGISTRY_URL, ConnectWalletModal(), handleGoogleLogin(), Props (+20 more)

### Community 8 - "shared/src/index.ts"
Cohesion: 0.15
Nodes (30): topUp(), discoveryExtensions(), RouteDiscovery, ROUTES, serviceMetadata, discovered, payloadFor(), rent (+22 more)

### Community 9 - "Web Frontend & Landing"
Cohesion: 0.09
Nodes (25): DocsRedirect, LandingPage, McpModal, DocsRedirect(), HashHero(), HashHeroProps, prefersReducedMotion(), randomGlyph() (+17 more)

### Community 10 - "Authentication & Custodial Accounts"
Cohesion: 0.11
Nodes (26): formatUsdc(), formatUsdcExact(), GasRequestInfo, GoogleAccountResponse, explorerAddrUrl(), explorerTxUrl(), Dashboard, BalanceChart() (+18 more)

### Community 11 - "Admin & Gas Requests"
Cohesion: 0.07
Nodes (29): dependencies, next, react, react-dom, react-router-dom, @tendril/shared, devDependencies, @types/node (+21 more)

### Community 12 - "Algorand Payments & Wallets"
Cohesion: 0.10
Nodes (21): config, net, repoRoot, initDb(), app, corsOrigin, main(), warmNotebookImage() (+13 more)

### Community 13 - "Compute Leases & Watchdogs"
Cohesion: 0.12
Nodes (22): ExplorerNode, usdToAtomic(), X402RentResponse, releaseLease(), toActiveLease(), writeClipboard(), copy(), Explore() (+14 more)

### Community 14 - "leases.ts"
Cohesion: 0.12
Nodes (20): App(), signIn(), ClientShell(), WebRuntime, ConnectWalletModal, loadSession(), storeSession(), walletManager (+12 more)

### Community 15 - "Compute Leases & Watchdogs"
Cohesion: 0.13
Nodes (27): abandonLease(), activateLease(), closeLease(), createLease(), earnsPayout(), expiredLeaseAction(), failLease(), fundedUntil() (+19 more)

### Community 16 - "Authentication & Custodial Accounts"
Cohesion: 0.12
Nodes (23): addressFromSession(), isCustodialSessionKind(), leaseIdFromAuthHeader(), sessionFromAuthHeader(), verifyLeaseToken(), createApiKey(), Handler, isAllowedNotebookImage() (+15 more)

### Community 17 - "Authentication & Custodial Accounts"
Cohesion: 0.12
Nodes (23): checkExportRateLimit(), confirmCustodialSign(), exportLog, exportMnemonicForUser(), failPaid(), optInUsdc(), pending, PendingRequest (+15 more)

### Community 18 - "Docker Sandboxes & Runtimes"
Cohesion: 0.17
Nodes (27): containerName(), dockerFailure(), dockerLog(), dockerNcpu(), ensureImage(), execFileP, ExecProfile, execRunArgs() (+19 more)

### Community 19 - "Authentication & Custodial Accounts"
Cohesion: 0.13
Nodes (22): WalletSummary, ActiveLease, GoogleCallback, Marketplace, Session, TopUpModal, Props, Props (+14 more)

### Community 20 - "Algorand Payments & Wallets"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+18 more)

### Community 21 - "Algorand Payments & Wallets"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, dotenv, @tendril/shared, tsx, @x402/avm, @x402/core, @x402/fetch (+18 more)

### Community 22 - "McpModal.tsx"
Cohesion: 0.07
Nodes (26): description, engines, node, name, overrides, lute-connect, private, scripts (+18 more)

### Community 23 - "Admin & Gas Requests"
Cohesion: 0.12
Nodes (20): adminRouter, Handler, countGasRequestsByStatus(), countGoogleUsers(), DbGasRequest, findGasRequestById(), GasRequestStatus, recordGasRequestDelivery() (+12 more)

### Community 24 - "Compute Leases & Watchdogs"
Cohesion: 0.14
Nodes (24): issueLeaseToken(), e2bConfigured(), isHosted(), modalConfigured(), sandboxLifetimeMs(), hasLivePayerLease(), nodeBusy(), providerFor() (+16 more)

### Community 25 - "Authentication & Custodial Accounts"
Cohesion: 0.17
Nodes (22): googleAuthEnabled(), createEmailUser(), createUser(), findUserByEmail(), findUserByGoogleSub(), isEmailAuthEnabled(), linkGoogleSub(), touchUserLogin() (+14 more)

### Community 26 - "example-buyer/src/index.ts"
Cohesion: 0.22
Nodes (24): ApiKeyInfo, CreateApiKeyResponse, apiError(), createApiKey(), fetchApiKeys(), fetchExplorer(), fetchLease(), fetchMetrics() (+16 more)

### Community 27 - "Authentication & Custodial Accounts"
Cohesion: 0.13
Nodes (23): adminGoogleCallback(), adminGoogleStart(), adminSessionExchange(), disabled(), isAdminAuthEnabled(), usedExchangeJtis, adminFromAuthHeader(), AdminInfo (+15 more)

### Community 28 - "NotebookSection.tsx"
Cohesion: 0.14
Nodes (24): signTransactions(), RunJobResponse, E2bPreset, E2bSize, e2bSizeKey(), asText(), availabilityCopy(), cellsFrom() (+16 more)

### Community 29 - "compilerOptions"
Cohesion: 0.12
Nodes (22): activeUsersByChange(), ActiveWindow, cumulativeByChange(), hashKey(), isWalletGasGrantEligible(), listApiKeys(), listGasRequests(), listGoogleUsers() (+14 more)

### Community 30 - "`POST /x402/run`"
Cohesion: 0.16
Nodes (22): buildImage(), DEPENDENCY_PROBE, destroy(), drop(), ensureImage(), exec(), execText(), id (+14 more)

### Community 31 - "Algorand Payments & Wallets"
Cohesion: 0.09
Nodes (22): algosdk, dotenv, nanoid, @tendril/shared, tsx, @types/node, typescript, @x402/avm (+14 more)

### Community 32 - "Algorand Payments & Wallets"
Cohesion: 0.09
Nodes (22): @blockshake/defly-connect, buffer, lute-connect, @perawallet/connect, process, algosdk, next, react (+14 more)

### Community 33 - "Compute Leases & Watchdogs"
Cohesion: 0.13
Nodes (17): NewLease, RunJobResult, contributorProvider, e2bProvider, providers, modalProvider, NotebookRun, ComputeProvider (+9 more)

### Community 34 - "Admin & Gas Requests"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 36 - "config"
Cohesion: 0.13
Nodes (17): JOB_LOG_MAX_BYTES, JOB_RESULT_MAX_BYTES, NormalizedNotebookRuntimeOptions, normalizeNotebookRuntimeOptions(), NOTEBOOK_ARTIFACT_BYTES, NOTEBOOK_MAX_BYTES, NOTEBOOK_MAX_CELLS, NOTEBOOK_MAX_ENV_VALUE_BYTES (+9 more)

### Community 37 - "compilerOptions"
Cohesion: 0.11
Nodes (19): Contributor Daemon, Contributor Withdrawals, Grace Window, Per-Second Metering, Usage Calculation, Disposable Execution, Ephemeral One-shot Sandbox, Isolation Controls (+11 more)

### Community 38 - "Algorand Payments & Wallets"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, cors, dotenv, e2b, express, jsonwebtoken, modal (+10 more)

### Community 39 - "backend/src/config.ts"
Cohesion: 0.27
Nodes (16): inTransaction(), ledger(), [{ n }], otherAfter, otherBefore, [{ s }], schemas, addCredit() (+8 more)

### Community 40 - "runAnywhere"
Cohesion: 0.20
Nodes (14): destroy(), exec(), id, start(), runNotebook(), notebookToPayload(), parseNotebookRun(), execute() (+6 more)

### Community 41 - "Documentation & Reference"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 42 - "Documentation & Reference"
Cohesion: 0.12
Nodes (6): metadata, metadata, metadata, mono, sans, serif

### Community 43 - "Authentication & Custodial Accounts"
Cohesion: 0.26
Nodes (14): GoogleAccountInfo, createGasRequest(), findGasRequestByAddress(), findGasRequestByUserId(), setGasGrantIneligible(), setWalletGasGrantIneligible(), canSubmitGasGrant(), ensureCustodialGasRequest() (+6 more)

### Community 44 - "Alpine Mountain Lake Landscape Painting"
Cohesion: 0.23
Nodes (16): apiKey(), bounded(), destroy(), drop(), ensureTemplate(), exec(), id, NOTEBOOK_PACKAGES (+8 more)

### Community 45 - "Algorand Payments & Wallets"
Cohesion: 0.13
Nodes (15): Backend Registry, Neon Postgres, Platform Algorand Account, Backend Compose Service, Algorand Settlement, Algorand USDC Asset, Sandboxes and Bore Tunnels, Network Discovery (+7 more)

### Community 46 - "Overview"
Cohesion: 0.19
Nodes (14): MetricPoint, Metrics, RankRow, Metrics, Board(), BoardTab, ChartRange, fmtDur() (+6 more)

### Community 47 - "Algorand Payments & Wallets"
Cohesion: 0.13
Nodes (15): dependencies, algosdk, @blockshake/defly-connect, buffer, lute-connect, next, @perawallet/connect, process (+7 more)

### Community 48 - "Authentication & Custodial Accounts"
Cohesion: 0.21
Nodes (11): SignPrepareResponse, Props, SignConfirmModal(), CustodialSignContext, CustodialSignContextValue, CustodialSignProvider(), approve(), PendingConfirm (+3 more)

### Community 49 - "Rural lime-green landscape"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 50 - "Compute Leases & Watchdogs"
Cohesion: 0.20
Nodes (12): getLease(), heldLease(), leaseByPayment(), leasesForNode(), waitForLeaseAccess(), markOffline(), touchHeartbeat(), isOpenSshPubKey() (+4 more)

### Community 51 - "Compute Leases & Watchdogs"
Cohesion: 0.20
Nodes (7): rate, hourly, mainnet, quote, rate, testnet, atomicPerHour()

### Community 52 - "hills-smudge-art.jpg"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

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

### Community 57 - "MCP Protocol & Tools"
Cohesion: 0.22
Nodes (8): compilerOptions, outDir, rootDir, types, extends, include, ../tsconfig.base.json, references

### Community 58 - "Clouds Painting"
Cohesion: 0.29
Nodes (7): Grok (xAI), currentColor fill, Grok mark lower path, Grok mark upper path, USDC logo, USDC (USD Coin), USDC compound path

### Community 59 - "grok.svg"
Cohesion: 0.25
Nodes (8): Autonomous Consumer Agent, Buyer Compose Service, Autonomous Agent Tool Loop, Serverless Python Execution, One-shot Jobs, MCP Consumer Tools, One-shot Run Endpoint, Autonomous Training Agent

### Community 60 - "MCP Protocol & Tools"
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

### Community 64 - "Compute Leases & Watchdogs"
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

### Community 69 - "Docker Sandboxes & Runtimes"
Cohesion: 0.53
Nodes (6): stopSandbox(), stopWarmExecPool(), handleDestroy(), handleStart(), main(), shutdown()

### Community 70 - "Authentication & Custodial Accounts"
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
Nodes (5): E2bSize, ExecArgs, JobInput, RunRequest, NotebookRuntimeOptions

### Community 74 - "Algorand Payments & Wallets"
Cohesion: 0.40
Nodes (5): Prepaid Credit, Payment Challenge, MCP Spend Cap, Top Up USDC, PaymentRequired

### Community 75 - "Algorand Payments & Wallets"
Cohesion: 0.40
Nodes (5): Sign and Retry, AVM Private Key, Stdio Model Context Protocol Server, Wallet Sign-in, PAYMENT-SIGNATURE Header

### Community 76 - "Algorand Payments & Wallets"
Cohesion: 0.40
Nodes (5): USDC with x402, Compute Marketplace, Pay-per-call Compute Marketplace, Tendril, x402 over USDC on Algorand

### Community 77 - "Tendril Open Graph Social Preview"
Cohesion: 0.60
Nodes (4): Charge, TopUp, Props, Pt

### Community 78 - "favicon.svg"
Cohesion: 0.40
Nodes (5): scripts, build, dev, start, typecheck

### Community 79 - "example-buyer/tsconfig.json"
Cohesion: 0.40
Nodes (5): Countryside Cottages, Garden Path, Impressionist Painting, Rural Landscape, Rustic Cottages

### Community 80 - "Docker Backend Service"
Cohesion: 0.40
Nodes (5): Alpine Lake, Conifer Forest, Lake Valley Landscape, Painterly Landscape Aesthetic, Snow-Capped Mountain Range

### Community 81 - "Tendril Favicon Mark"
Cohesion: 0.60
Nodes (5): Three-dot Ellipsis Motif, The last mile of funding, Open Graph Social Card, Tendril Open Graph Social Preview, Tendril Wordmark

### Community 82 - "Admin & Gas Requests"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, $schema

### Community 84 - "Defly"
Cohesion: 0.83
Nodes (3): detectGpu(), detectSpecs(), execFileP

### Community 86 - "Documentation & Reference"
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

### Community 90 - "Consumer Tools"
Cohesion: 0.67
Nodes (3): scripts, dev, start

### Community 92 - "Docker Sandboxes & Runtimes"
Cohesion: 0.67
Nodes (3): Contributor Compose Service, Docker Socket Mount, Contributor Compose Service

### Community 94 - "devDependencies"
Cohesion: 0.67
Nodes (3): Documentation App, Web App, Website

### Community 95 - "Algorand Payments & Wallets"
Cohesion: 0.67
Nodes (3): Best-Value Scoring Algorithm, Best-Value Idle Machine, Explorer Discovery Endpoint

### Community 97 - "Algorand Payments & Wallets"
Cohesion: 0.67
Nodes (3): Algorand logo, Algorand, Algorand glyph path

### Community 99 - "tendril_account"
Cohesion: 0.67
Nodes (3): Cream T Monogram, Tendril Favicon, Deep Green Background

## Knowledge Gaps
- **210 isolated node(s):** `next`, `react`, `react-dom`, `react-router-dom`, `@tendril/shared` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 728 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `marked` connect `Documentation & Reference` to `Documentation & Reference`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `next`, `react`, `react-dom` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Algorand Payments & Wallets` be split into smaller, more focused modules?**
  _Cohesion score 0.06935908691834942 - nodes in this community are weakly interconnected._
- **Why does `@txnlab/use-wallet-react` connect `Authentication & Custodial Accounts` to `Algorand Payments & Wallets`, `leases.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09387755102040816 - nodes in this community are weakly interconnected._
- **Should `Documentation & Reference` be split into smaller, more focused modules?**
  _Cohesion score 0.058279370952821465 - nodes in this community are weakly interconnected._
- **Should `Algorand Payments & Wallets` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._