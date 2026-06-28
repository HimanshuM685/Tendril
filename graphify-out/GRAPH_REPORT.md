# Graph Report - .  (2026-06-28)

## Corpus Check
- Corpus is ~11,601 words - fits in a single context window. You may not need a graph.

## Summary
- 356 nodes · 502 edges · 20 communities (17 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.88)
- Token cost: 36,000 input · 4,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Auth & Database|Backend Auth & Database]]
- [[_COMMUNITY_Contributor Sandbox & Agent|Contributor Sandbox & Agent]]
- [[_COMMUNITY_Autonomous Buyer & Shared Types|Autonomous Buyer & Shared Types]]
- [[_COMMUNITY_Backend Package & Deps|Backend Package & Deps]]
- [[_COMMUNITY_Payment & Architecture Concepts|Payment & Architecture Concepts]]
- [[_COMMUNITY_Web App & Wallet Deps|Web App & Wallet Deps]]
- [[_COMMUNITY_Contributor Package & Deps|Contributor Package & Deps]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Monorepo Root Config|Monorepo Root Config]]
- [[_COMMUNITY_Buyer Package & Deps|Buyer Package & Deps]]
- [[_COMMUNITY_Shared TS Base Config|Shared TS Base Config]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Backend tsconfig|Backend tsconfig]]
- [[_COMMUNITY_Contributor tsconfig|Contributor tsconfig]]
- [[_COMMUNITY_Buyer tsconfig|Buyer tsconfig]]
- [[_COMMUNITY_WebShared tsconfig|Web/Shared tsconfig]]
- [[_COMMUNITY_Backend Runtime Config|Backend Runtime Config]]
- [[_COMMUNITY_Contributor Runtime Config|Contributor Runtime Config]]
- [[_COMMUNITY_Key Generation|Key Generation]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `algoPayMiddleware()` - 11 edges
4. `scripts` - 8 edges
5. `startSandbox()` - 7 edges
6. `getNode()` - 6 edges
7. `getLease()` - 6 edges
8. `usdToMicroAlgos()` - 6 edges
9. `ActiveLease` - 6 edges
10. `Backend / Registry (Express + SQLite + socket.io)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Native ALGO Settlement (no USDC/ASA)` --semantically_similar_to--> `Native ALGO Payment`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `algoPayMiddleware()` --calls--> `usdToMicroAlgos()`  [INFERRED]
  backend/src/pay-algo.ts → shared/src/index.ts
- `Docker Compose: web service` --implements--> `Web App (Vite + React + use-wallet)`  [INFERRED]
  docker-compose.yml → README.md
- `Web SPA HTML Entry (main.tsx mount)` --implements--> `Web App (Vite + React + use-wallet)`  [INFERRED]
  web/index.html → README.md
- `algoPayMiddleware()` --calls--> `leasePrice()`  [INFERRED]
  backend/src/pay-algo.ts → shared/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Docker Compose Services Forming the Marketplace** — compose_backend_service, compose_web_service, compose_contributor_service, compose_buyer_service [EXTRACTED 1.00]
- **402 Native-ALGO Payment Flow** — readme_402_challenge, readme_native_algo_payment, deploy_usd_algo_conversion, deploy_algod_endpoint, readme_synchronous_settlement [EXTRACTED 0.85]
- **Ephemeral Docker Sandbox Trust Boundary** — readme_ephemeral_docker_sandbox, readme_contributor_agent, readme_cloudflared_tunnel, readme_lease_reaper [EXTRACTED 0.85]

## Communities (20 total, 3 thin omitted)

### Community 0 - "Backend Auth & Database"
Cohesion: 0.06
Nodes (53): issueLeaseToken(), issueNonce(), issuePaymentChallenge(), leaseIdFromAuthHeader(), NonceEntry, nonces, PaymentChallengeClaims, verifyAgentHello() (+45 more)

### Community 1 - "Contributor Sandbox & Agent"
Cohesion: 0.08
Nodes (36): main(), containerName(), execFileP, getFreePort(), runInSandbox(), Sandbox, sessionUrlFor(), startSandbox() (+28 more)

### Community 2 - "Autonomous Buyer & Shared Types"
Cohesion: 0.09
Nodes (31): Contribute(), Explore(), Props, LeasePanel(), Props, WalletBar(), main(), ActiveLease (+23 more)

### Community 3 - "Backend Package & Deps"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, better-sqlite3, cors, dotenv, express, jsonwebtoken, nanoid (+18 more)

### Community 4 - "Payment & Architecture Concepts"
Cohesion: 0.12
Nodes (26): Docker Compose: backend service, Docker Compose: buyer service, Docker Compose: contributor service, tendril-data SQLite Volume, Docker Compose: web service, Algod Endpoint (submit + confirm payments), Native ALGO Payment, USD to ALGO Price Conversion (ALGO_USD_PRICE / PRICE_PER_MIN_USD) (+18 more)

### Community 5 - "Web App & Wallet Deps"
Cohesion: 0.08
Nodes (23): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, @txnlab/use-wallet-react, devDependencies (+15 more)

### Community 6 - "Contributor Package & Deps"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 7 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 8 - "Monorepo Root Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 9 - "Buyer Package & Deps"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 10 - "Shared TS Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 11 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 12 - "Backend tsconfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 13 - "Contributor tsconfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 14 - "Buyer tsconfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 15 - "Web/Shared tsconfig"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

## Knowledge Gaps
- **176 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ExplorerNode` connect `Autonomous Buyer & Shared Types` to `Backend Auth & Database`, `Contributor Sandbox & Agent`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Contributor Sandbox & Agent` to `Backend Auth & Database`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `usdToMicroAlgos()` connect `Autonomous Buyer & Shared Types` to `Backend Auth & Database`, `Contributor Sandbox & Agent`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `algoPayMiddleware()` (e.g. with `issuePaymentChallenge()` and `verifyPaymentChallenge()`) actually correct?**
  _`algoPayMiddleware()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Auth & Database` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `Contributor Sandbox & Agent` be split into smaller, more focused modules?**
  _Cohesion score 0.08305647840531562 - nodes in this community are weakly interconnected._