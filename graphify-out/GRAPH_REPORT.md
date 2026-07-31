# Graph Report - .  (2026-08-01)

## Corpus Check
- 9 files · ~35,063 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 493 nodes · 727 edges · 33 communities (29 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web App & API Client|Web App & API Client]]
- [[_COMMUNITY_Metrics UI & Contributor Daemon|Metrics UI & Contributor Daemon]]
- [[_COMMUNITY_Wallet Ledger & Balance Chart|Wallet Ledger & Balance Chart]]
- [[_COMMUNITY_Buyer Client & Wallet Panel|Buyer Client & Wallet Panel]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Sandbox Docker & x402|Sandbox Docker & x402]]
- [[_COMMUNITY_Tendril Concepts|Tendril Concepts]]
- [[_COMMUNITY_README & DEPLOY Sections|README & DEPLOY Sections]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_Auth & Session|Auth & Session]]
- [[_COMMUNITY_Leases, Billing & Payout|Leases, Billing & Payout]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Root Workspace Config|Root Workspace Config]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Base TS Config|Base TS Config]]
- [[_COMMUNITY_Node Registry|Node Registry]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_WebSocket Hub|WebSocket Hub]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Contributor TS Config|Contributor TS Config]]
- [[_COMMUNITY_Buyer TS Config|Buyer TS Config]]
- [[_COMMUNITY_Backend Bootstrap|Backend Bootstrap]]
- [[_COMMUNITY_Top-up Verify (wallet.ts)|Top-up Verify (wallet.ts)]]
- [[_COMMUNITY_Shared TS Config|Shared TS Config]]
- [[_COMMUNITY_Hero Art|Hero Art]]
- [[_COMMUNITY_Favicon Brand|Favicon Brand]]
- [[_COMMUNITY_Web SPA Shell|Web SPA Shell]]
- [[_COMMUNITY_Backend Config|Backend Config]]
- [[_COMMUNITY_Keygen|Keygen]]
- [[_COMMUNITY_SSH Entrypoint|SSH Entrypoint]]
- [[_COMMUNITY_Vercel SPA Config|Vercel SPA Config]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `apiError()` - 13 edges
4. `🌿 Tendril` - 11 edges
5. `startSandbox()` - 10 edges
6. `Backend / Registry` - 9 edges
7. `WalletSummary` - 9 edges
8. `formatAlgo()` - 9 edges
9. `endLeaseAndBill()` - 8 edges
10. `scripts` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Backend / Registry` --conceptually_related_to--> `WebSocket Proxy (nginx)`  [INFERRED]
  README.md → DEPLOY.md
- `Docker Backend Service` --implements--> `Backend / Registry`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Contributor Service` --implements--> `Contributor Agent`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Buyer Service` --implements--> `Example Buyer / Autonomous Agent`  [INFERRED]
  docker-compose.yml → README.md
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/WalletPanel.tsx → shared/src/index.ts

## Import Cycles
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Communities (33 total, 4 thin omitted)

### Community 0 - "Web App & API Client"
Cohesion: 0.07
Nodes (34): About(), ArchDiagram(), Contribute(), Docs(), Explore(), Props, HashHero(), HashHeroProps (+26 more)

### Community 1 - "Metrics UI & Contributor Daemon"
Cohesion: 0.07
Nodes (29): BoardTab, main(), activeLeases, { address, signNonce }, AgentHelloMsg, ContainerFailedMsg, DestroyContainerMsg, fetchNonce() (+21 more)

### Community 2 - "Wallet Ledger & Balance Chart"
Cohesion: 0.10
Nodes (21): BalanceChart(), Props, Pt, Dashboard(), Props, creditWallet(), cumulativeByDay(), getBalance() (+13 more)

### Community 3 - "Buyer Client & Wallet Panel"
Cohesion: 0.11
Nodes (25): PRESETS, Props, SignTransactions, WalletPanel(), main(), balanceOf(), formatAlgo(), LEASE_MINUTES (+17 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 5 - "Sandbox Docker & x402"
Cohesion: 0.14
Nodes (19): config, repoRoot, containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox() (+11 more)

### Community 6 - "Tendril Concepts"
Cohesion: 0.12
Nodes (25): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+17 more)

### Community 7 - "README & DEPLOY Sections"
Cohesion: 0.08
Nodes (23): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent, 4. Production checklist (+15 more)

### Community 8 - "Web Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, algosdk, @blockshake/defly-connect, lute-connect, @perawallet/connect, react, react-dom, react-router-dom (+16 more)

### Community 9 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 10 - "Auth & Session"
Cohesion: 0.15
Nodes (15): addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry, nonces (+7 more)

### Community 11 - "Leases, Billing & Payout"
Cohesion: 0.16
Nodes (16): debitWallet(), Lease, LeaseStatus, proratedCost(), createLease(), endLeaseAndBill(), getLease(), leases (+8 more)

### Community 12 - "Web TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 13 - "Root Workspace Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 14 - "Buyer Dependencies"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 15 - "Base TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 16 - "Node Registry"
Cohesion: 0.22
Nodes (10): isOnline(), getNode(), listNodesByOwner(), listOnlineNodes(), markOffline(), nodes, touchHeartbeat(), upsertNode() (+2 more)

### Community 17 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 18 - "WebSocket Hub"
Cohesion: 0.22
Nodes (8): ContainerReadyMsg, HeartbeatMsg, SandboxLimits, activateLease(), agentSockets, pendingContainers, pendingJobs, startContainer()

### Community 19 - "Backend TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 20 - "Contributor TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 21 - "Buyer TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 22 - "Backend Bootstrap"
Cohesion: 0.29
Nodes (5): initDb(), app, startWatchdog(), router, initWs()

### Community 23 - "Top-up Verify (wallet.ts)"
Cohesion: 0.43
Nodes (6): algod, decodeSigned(), noteText(), SettledTopUp, settleTopUp(), verifyLoginSignature()

### Community 24 - "Shared TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 25 - "Hero Art"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 26 - "Favicon Brand"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 27 - "Web SPA Shell"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **209 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared Package` connect `Tendril Concepts` to `Contributor Dependencies`, `Buyer Dependencies`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Buyer Client & Wallet Panel` to `Web App & API Client`, `Metrics UI & Contributor Daemon`, `Wallet Ledger & Balance Chart`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Tendril Concepts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _212 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web App & API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.06787330316742081 - nodes in this community are weakly interconnected._
- **Should `Metrics UI & Contributor Daemon` be split into smaller, more focused modules?**
  _Cohesion score 0.07422402159244265 - nodes in this community are weakly interconnected._
- **Should `Wallet Ledger & Balance Chart` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._