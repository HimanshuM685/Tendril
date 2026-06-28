# Graph Report - .  (2026-06-29)

## Corpus Check
- 29 files · ~16,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 394 nodes · 573 edges · 25 communities (19 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend UI Components|Frontend UI Components]]
- [[_COMMUNITY_Contributor Service Core|Contributor Service Core]]
- [[_COMMUNITY_Backend API Core|Backend API Core]]
- [[_COMMUNITY_Auth and Session Management|Auth and Session Management]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Deployment and Infrastructure|Deployment and Infrastructure]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Monorepo Root Config|Monorepo Root Config]]
- [[_COMMUNITY_Example Buyer Package|Example Buyer Package]]
- [[_COMMUNITY_Base TypeScript Config|Base TypeScript Config]]
- [[_COMMUNITY_Shared Package Config|Shared Package Config]]
- [[_COMMUNITY_Backend TSConfig|Backend TSConfig]]
- [[_COMMUNITY_Contributor TSConfig|Contributor TSConfig]]
- [[_COMMUNITY_Example Buyer TSConfig|Example Buyer TSConfig]]
- [[_COMMUNITY_Wallet and Algorand Ops|Wallet and Algorand Ops]]
- [[_COMMUNITY_Shared TSConfig|Shared TSConfig]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Contributor Config|Contributor Config]]
- [[_COMMUNITY_Key Generation|Key Generation]]
- [[_COMMUNITY_Sandbox SSH Entrypoint|Sandbox SSH Entrypoint]]
- [[_COMMUNITY_Web SPA Entry|Web SPA Entry]]
- [[_COMMUNITY_Project Identity|Project Identity]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `startSandbox()` - 9 edges
4. `Backend / Registry` - 9 edges
5. `scripts` - 8 edges
6. `endLeaseAndBill()` - 8 edges
7. `WalletSummary` - 7 edges
8. `formatAlgo()` - 6 edges
9. `ActiveLease` - 6 edges
10. `Contributor Agent` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Backend / Registry` --conceptually_related_to--> `WebSocket Proxy (nginx)`  [INFERRED]
  README.md → DEPLOY.md
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/WalletPanel.tsx → shared/src/index.ts
- `Docker Backend Service` --implements--> `Backend / Registry`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Contributor Service` --implements--> `Contributor Agent`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Buyer Service` --implements--> `Example Buyer / Autonomous Agent`  [INFERRED]
  docker-compose.yml → README.md

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Prepaid Billing Flow** — tendril_custodial_model, tendril_pricing_model, tendril_watchdog, tendril_neon_postgres, tendril_algorand_algod [INFERRED 0.85]
- **Three Deployable Components** — tendril_backend, tendril_contributor, tendril_web [EXTRACTED 1.00]
- **Docker Compose Service Mapping** — deploy_docker_backend_service, deploy_docker_contributor_service, deploy_docker_buyer_service [EXTRACTED 1.00]

## Communities (25 total, 6 thin omitted)

### Community 0 - "Frontend UI Components"
Cohesion: 0.06
Nodes (46): Contribute(), Explore(), Props, LeasePanel(), Props, Props, WalletBar(), PRESETS (+38 more)

### Community 1 - "Contributor Service Core"
Cohesion: 0.07
Nodes (39): main(), containerName(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint, startSandbox() (+31 more)

### Community 2 - "Backend API Core"
Cohesion: 0.08
Nodes (34): main(), creditWallet(), debitWallet(), getBalance(), getWallet(), initDb(), pool, q() (+26 more)

### Community 3 - "Auth and Session Management"
Cohesion: 0.10
Nodes (32): addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces (+24 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 5 - "Deployment and Infrastructure"
Cohesion: 0.12
Nodes (24): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+16 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, @txnlab/use-wallet-react, devDependencies (+15 more)

### Community 7 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 8 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 9 - "Monorepo Root Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 10 - "Example Buyer Package"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 11 - "Base TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 12 - "Shared Package Config"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 13 - "Backend TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 14 - "Contributor TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 15 - "Example Buyer TSConfig"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 16 - "Wallet and Algorand Ops"
Cohesion: 0.43
Nodes (6): algod, decodeSigned(), noteText(), SettledTopUp, settleTopUp(), verifyLoginSignature()

### Community 17 - "Shared TSConfig"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

## Knowledge Gaps
- **184 isolated node(s):** `extends`, `rootDir`, `outDir`, `types`, `references` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Frontend UI Components` to `Contributor Service Core`, `Backend API Core`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Contributor Service Core` to `Auth and Session Management`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `SandboxAccess` connect `Frontend UI Components` to `Contributor Service Core`, `Backend API Core`, `Auth and Session Management`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Backend / Registry` (e.g. with `Docker Backend Service` and `WebSocket Proxy (nginx)`) actually correct?**
  _`Backend / Registry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `extends`, `rootDir`, `outDir` to the rest of the system?**
  _187 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06390977443609022 - nodes in this community are weakly interconnected._
- **Should `Contributor Service Core` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._