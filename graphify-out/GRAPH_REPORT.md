# Graph Report - .  (2026-06-29)

## Corpus Check
- Corpus is ~18,864 words - fits in a single context window. You may not need a graph.

## Summary
- 422 nodes · 618 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.88)
- Token cost: 32,664 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Session Tokens|Auth & Session Tokens]]
- [[_COMMUNITY_Web UI Components|Web UI Components]]
- [[_COMMUNITY_Contributor Sandbox Runtime|Contributor Sandbox Runtime]]
- [[_COMMUNITY_Web Wallet & Dashboard|Web Wallet & Dashboard]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Architecture & Deployment Concepts|Architecture & Deployment Concepts]]
- [[_COMMUNITY_Wallet Ledger (Postgres)|Wallet Ledger (Postgres)]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Contributor Package Config|Contributor Package Config]]
- [[_COMMUNITY_TS Config (Web)|TS Config (Web)]]
- [[_COMMUNITY_Monorepo Workspace Config|Monorepo Workspace Config]]
- [[_COMMUNITY_Example Buyer Package Config|Example Buyer Package Config]]
- [[_COMMUNITY_TS Base Config|TS Base Config]]
- [[_COMMUNITY_Shared Package Config|Shared Package Config]]
- [[_COMMUNITY_TS Project Config I|TS Project Config I]]
- [[_COMMUNITY_TS Project Config II|TS Project Config II]]
- [[_COMMUNITY_TS Project Config III|TS Project Config III]]
- [[_COMMUNITY_Top-up Settlement & Login Verify|Top-up Settlement & Login Verify]]
- [[_COMMUNITY_TS Project Config IV|TS Project Config IV]]
- [[_COMMUNITY_Brand Mark  Favicon|Brand Mark / Favicon]]
- [[_COMMUNITY_Web HTML Entry|Web HTML Entry]]
- [[_COMMUNITY_Runtime Config|Runtime Config]]
- [[_COMMUNITY_Runtime Config (Alt)|Runtime Config (Alt)]]
- [[_COMMUNITY_Keygen Utility|Keygen Utility]]
- [[_COMMUNITY_Container Entrypoint|Container Entrypoint]]
- [[_COMMUNITY_Tendril (Project Root)|Tendril (Project Root)]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `startSandbox()` - 9 edges
4. `WalletSummary` - 9 edges
5. `Backend / Registry` - 9 edges
6. `endLeaseAndBill()` - 8 edges
7. `scripts` - 8 edges
8. `formatAlgo()` - 8 edges
9. `Shared Package` - 8 edges
10. `ActiveLease` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Backend / Registry` --conceptually_related_to--> `WebSocket Proxy (nginx)`  [INFERRED]
  README.md → DEPLOY.md
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/Dashboard.tsx → shared/src/index.ts
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/WalletPanel.tsx → shared/src/index.ts
- `Docker Backend Service` --implements--> `Backend / Registry`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Contributor Service` --implements--> `Contributor Agent`  [INFERRED]
  docker-compose.yml → README.md

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Three Deployable Components** — tendril_backend, tendril_contributor, tendril_web [EXTRACTED 1.00]
- **Prepaid Billing Flow** — tendril_custodial_model, tendril_pricing_model, tendril_watchdog, tendril_neon_postgres, tendril_algorand_algod [INFERRED 0.85]
- **Docker Compose Service Mapping** — deploy_docker_backend_service, deploy_docker_contributor_service, deploy_docker_buyer_service [EXTRACTED 1.00]

## Communities (27 total, 5 thin omitted)

### Community 0 - "Auth & Session Tokens"
Cohesion: 0.06
Nodes (55): main(), addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry (+47 more)

### Community 1 - "Web UI Components"
Cohesion: 0.08
Nodes (28): About(), ArchDiagram(), Contribute(), Docs(), Explore(), Props, HashHero(), HashHeroProps (+20 more)

### Community 2 - "Contributor Sandbox Runtime"
Cohesion: 0.10
Nodes (29): main(), containerName(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint, startSandbox() (+21 more)

### Community 3 - "Web Wallet & Dashboard"
Cohesion: 0.09
Nodes (27): Dashboard(), fmtDuration(), Props, PRESETS, Props, SignTransactions, WalletPanel(), main() (+19 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 5 - "Architecture & Deployment Concepts"
Cohesion: 0.12
Nodes (25): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+17 more)

### Community 6 - "Wallet Ledger (Postgres)"
Cohesion: 0.11
Nodes (23): creditWallet(), getBalance(), getWallet(), pool, q(), recordPayout(), Row, WalletRow (+15 more)

### Community 7 - "Web Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, @txnlab/use-wallet-react, devDependencies (+14 more)

### Community 8 - "Contributor Package Config"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 9 - "TS Config (Web)"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 10 - "Monorepo Workspace Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 11 - "Example Buyer Package Config"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 12 - "TS Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 13 - "Shared Package Config"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 14 - "TS Project Config I"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 15 - "TS Project Config II"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 16 - "TS Project Config III"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 17 - "Top-up Settlement & Login Verify"
Cohesion: 0.43
Nodes (6): algod, decodeSigned(), noteText(), SettledTopUp, settleTopUp(), verifyLoginSignature()

### Community 18 - "TS Project Config IV"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 19 - "Brand Mark / Favicon"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 20 - "Web HTML Entry"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **186 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+181 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared Package` connect `Architecture & Deployment Concepts` to `Contributor Package Config`, `Example Buyer Package Config`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Web Wallet & Dashboard` to `Web UI Components`, `Wallet Ledger (Postgres)`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Architecture & Deployment Concepts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Session Tokens` be split into smaller, more focused modules?**
  _Cohesion score 0.059395801331285206 - nodes in this community are weakly interconnected._
- **Should `Web UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07751937984496124 - nodes in this community are weakly interconnected._
- **Should `Contributor Sandbox Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._