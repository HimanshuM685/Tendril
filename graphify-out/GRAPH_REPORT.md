# Graph Report - Tendril  (2026-06-29)

## Corpus Check
- 51 files · ~31,757 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 454 nodes · 668 edges · 29 communities (24 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b66ebb6b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 28|Community 28]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `WalletSummary` - 11 edges
4. `🌿 Tendril` - 11 edges
5. `startSandbox()` - 9 edges
6. `formatAlgo()` - 9 edges
7. `Backend / Registry` - 9 edges
8. `endLeaseAndBill()` - 8 edges
9. `scripts` - 8 edges
10. `ActiveLease` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Backend / Registry` --conceptually_related_to--> `WebSocket Proxy (nginx)`  [INFERRED]
  README.md → DEPLOY.md
- `main()` --calls--> `formatAlgo()`  [EXTRACTED]
  example-buyer/src/index.ts → shared/src/index.ts
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/Dashboard.tsx → shared/src/index.ts
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/WalletPanel.tsx → shared/src/index.ts
- `BalanceChart()` --calls--> `formatAlgo()`  [EXTRACTED]
  web/src/components/BalanceChart.tsx → shared/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Communities (29 total, 5 thin omitted)

### Community 0 - "Contributor Agent & WS Protocol"
Cohesion: 0.08
Nodes (39): main(), containerName(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint, startSandbox() (+31 more)

### Community 1 - "Backend DB & Wallet Ledger"
Cohesion: 0.09
Nodes (33): main(), BalanceChart(), Props, Pt, creditWallet(), debitWallet(), getBalance(), getWallet() (+25 more)

### Community 2 - "Web Pages & Components"
Cohesion: 0.07
Nodes (36): About(), ArchDiagram(), Contribute(), Dashboard(), Props, Docs(), Explore(), Props (+28 more)

### Community 3 - "Wallet Dashboard UI"
Cohesion: 0.14
Nodes (18): main(), balanceOf(), LEASE_MINUTES, MIN_RAM_MB, PlatformInfo, postJson(), repoRoot, RunResponse (+10 more)

### Community 4 - "Auth & Wallet Signing"
Cohesion: 0.09
Nodes (35): addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces (+27 more)

### Community 5 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 6 - "Architecture & Deployment"
Cohesion: 0.12
Nodes (25): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+17 more)

### Community 7 - "Web Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, react-router-dom, @txnlab/use-wallet-react (+15 more)

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
Cohesion: 0.08
Nodes (23): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent, 4. Production checklist (+15 more)

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

### Community 28 - "Community 28"
Cohesion: 0.43
Nodes (6): algod, decodeSigned(), noteText(), SettledTopUp, settleTopUp(), verifyLoginSignature()

## Knowledge Gaps
- **204 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared Package` connect `Architecture & Deployment` to `Contributor Dependencies`, `Buyer Dependencies`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Web Pages & Components` to `Contributor Agent & WS Protocol`, `Backend DB & Wallet Ledger`, `Wallet Dashboard UI`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Architecture & Deployment`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contributor Agent & WS Protocol` be split into smaller, more focused modules?**
  _Cohesion score 0.0797979797979798 - nodes in this community are weakly interconnected._
- **Should `Backend DB & Wallet Ledger` be split into smaller, more focused modules?**
  _Cohesion score 0.08636977058029689 - nodes in this community are weakly interconnected._
- **Should `Web Pages & Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07197763801537387 - nodes in this community are weakly interconnected._