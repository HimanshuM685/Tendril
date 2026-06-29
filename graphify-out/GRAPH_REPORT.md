# Graph Report - .  (2026-06-29)

## Corpus Check
- 2 files · ~18,978 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 423 nodes · 609 edges · 28 communities (23 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Contributor Agent & WS Protocol|Contributor Agent & WS Protocol]]
- [[_COMMUNITY_Backend DB & Wallet Ledger|Backend DB & Wallet Ledger]]
- [[_COMMUNITY_Web Pages & Components|Web Pages & Components]]
- [[_COMMUNITY_Wallet Dashboard UI|Wallet Dashboard UI]]
- [[_COMMUNITY_Auth & Wallet Signing|Auth & Wallet Signing]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Architecture & Deployment|Architecture & Deployment]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Monorepo Scripts|Monorepo Scripts]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Sandbox Docker Control|Sandbox Docker Control]]
- [[_COMMUNITY_Base TS Config|Base TS Config]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Package TS Config|Package TS Config]]
- [[_COMMUNITY_Module 16|Module 16]]
- [[_COMMUNITY_Module 17|Module 17]]
- [[_COMMUNITY_Module 18|Module 18]]
- [[_COMMUNITY_Module 19|Module 19]]
- [[_COMMUNITY_Module 20|Module 20]]
- [[_COMMUNITY_Module 21|Module 21]]
- [[_COMMUNITY_Module 22|Module 22]]
- [[_COMMUNITY_Module 23|Module 23]]
- [[_COMMUNITY_Module 24|Module 24]]
- [[_COMMUNITY_Module 25|Module 25]]
- [[_COMMUNITY_Module 26|Module 26]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `startSandbox()` - 9 edges
4. `Backend / Registry` - 9 edges
5. `endLeaseAndBill()` - 8 edges
6. `scripts` - 8 edges
7. `WalletSummary` - 8 edges
8. `Shared Package` - 8 edges
9. `formatAlgo()` - 7 edges
10. `ActiveLease` - 6 edges

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

## Communities (28 total, 5 thin omitted)

### Community 0 - "Contributor Agent & WS Protocol"
Cohesion: 0.08
Nodes (35): main(), verifyAgentHello(), activeLeases, { address, signNonce }, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg (+27 more)

### Community 1 - "Backend DB & Wallet Ledger"
Cohesion: 0.08
Nodes (34): main(), creditWallet(), debitWallet(), getBalance(), getWallet(), initDb(), pool, q() (+26 more)

### Community 2 - "Web Pages & Components"
Cohesion: 0.09
Nodes (26): About(), ArchDiagram(), Contribute(), Docs(), Explore(), Props, LeasePanel(), Props (+18 more)

### Community 3 - "Wallet Dashboard UI"
Cohesion: 0.08
Nodes (27): Dashboard(), Props, PRESETS, Props, SignTransactions, WalletPanel(), main(), balanceOf() (+19 more)

### Community 4 - "Auth & Wallet Signing"
Cohesion: 0.10
Nodes (29): algod, addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry (+21 more)

### Community 5 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 6 - "Architecture & Deployment"
Cohesion: 0.12
Nodes (25): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+17 more)

### Community 7 - "Web Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, @txnlab/use-wallet-react, devDependencies (+14 more)

### Community 8 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 10 - "Monorepo Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 11 - "Buyer Dependencies"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 12 - "Sandbox Docker Control"
Cohesion: 0.26
Nodes (13): containerName(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint, startSandbox(), stopSandbox() (+5 more)

### Community 13 - "Base TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 14 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 15 - "Package TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 16 - "Module 16"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 17 - "Module 17"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 18 - "Module 18"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 19 - "Module 19"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 20 - "Module 20"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 21 - "Module 21"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **187 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+182 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Wallet Dashboard UI` to `Contributor Agent & WS Protocol`, `Backend DB & Wallet Ledger`, `Web Pages & Components`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `Shared Package` connect `Architecture & Deployment` to `Contributor Dependencies`, `Buyer Dependencies`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Architecture & Deployment`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Backend / Registry` (e.g. with `Docker Backend Service` and `WebSocket Proxy (nginx)`) actually correct?**
  _`Backend / Registry` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contributor Agent & WS Protocol` be split into smaller, more focused modules?**
  _Cohesion score 0.07926829268292683 - nodes in this community are weakly interconnected._
- **Should `Backend DB & Wallet Ledger` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._