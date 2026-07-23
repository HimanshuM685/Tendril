# Graph Report - .  (2026-07-24)

## Corpus Check
- 16 files · ~33,885 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 477 nodes · 694 edges · 30 communities (26 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Contributor Daemon & Registry|Contributor Daemon & Registry]]
- [[_COMMUNITY_Web App & Wallet Client|Web App & Wallet Client]]
- [[_COMMUNITY_Backend API & x402|Backend API & x402]]
- [[_COMMUNITY_Prepaid Wallet & Ledger|Prepaid Wallet & Ledger]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Tendril Concepts & Docker Deploy|Tendril Concepts & Docker Deploy]]
- [[_COMMUNITY_README & DEPLOY Sections|README & DEPLOY Sections]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_Sandbox Docker & Bore Tunnel|Sandbox Docker & Bore Tunnel]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Root Workspace Config|Root Workspace Config]]
- [[_COMMUNITY_Billing, Leases & Payouts|Billing, Leases & Payouts]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Base TS Config|Base TS Config]]
- [[_COMMUNITY_Autonomous Buyer Agent|Autonomous Buyer Agent]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Contributor TS Config|Contributor TS Config]]
- [[_COMMUNITY_Buyer TS Config|Buyer TS Config]]
- [[_COMMUNITY_Hash Hero Animation|Hash Hero Animation]]
- [[_COMMUNITY_Shared TS Config|Shared TS Config]]
- [[_COMMUNITY_Hero Illustration Art|Hero Illustration Art]]
- [[_COMMUNITY_Docs & Arch Diagram|Docs & Arch Diagram]]
- [[_COMMUNITY_Favicon Brand Mark|Favicon Brand Mark]]
- [[_COMMUNITY_Web SPA Shell|Web SPA Shell]]
- [[_COMMUNITY_Backend Config & Env|Backend Config & Env]]
- [[_COMMUNITY_Keygen Utility|Keygen Utility]]
- [[_COMMUNITY_SSH Sandbox Entrypoint|SSH Sandbox Entrypoint]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `apiError()` - 12 edges
4. `🌿 Tendril` - 11 edges
5. `startSandbox()` - 10 edges
6. `Backend / Registry` - 9 edges
7. `WalletSummary` - 9 edges
8. `endLeaseAndBill()` - 8 edges
9. `scripts` - 8 edges
10. `Shared Package` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Backend / Registry` --conceptually_related_to--> `WebSocket Proxy (nginx)`  [INFERRED]
  README.md → DEPLOY.md
- `Docker Backend Service` --implements--> `Backend / Registry`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Contributor Service` --implements--> `Contributor Agent`  [INFERRED]
  docker-compose.yml → README.md
- `Docker Buyer Service` --implements--> `Example Buyer / Autonomous Agent`  [INFERRED]
  docker-compose.yml → README.md
- `main()` --calls--> `formatAlgo()`  [EXTRACTED]
  example-buyer/src/index.ts → shared/src/index.ts

## Import Cycles
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Communities (30 total, 4 thin omitted)

### Community 0 - "Contributor Daemon & Registry"
Cohesion: 0.06
Nodes (46): main(), activeLeases, { address, signNonce }, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg, DestroyContainerMsg, fetchNonce() (+38 more)

### Community 1 - "Web App & Wallet Client"
Cohesion: 0.08
Nodes (35): About(), Contribute(), Explore(), Props, fmtCountdown(), LeasePanel(), Props, Marketplace() (+27 more)

### Community 2 - "Backend API & x402"
Cohesion: 0.07
Nodes (31): algod, addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry (+23 more)

### Community 3 - "Prepaid Wallet & Ledger"
Cohesion: 0.08
Nodes (24): BalanceChart(), Props, Pt, Dashboard(), Props, PRESETS, Props, SignTransactions (+16 more)

### Community 4 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 5 - "Tendril Concepts & Docker Deploy"
Cohesion: 0.11
Nodes (26): @tendril/shared, @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx) (+18 more)

### Community 6 - "README & DEPLOY Sections"
Cohesion: 0.08
Nodes (23): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent, 4. Production checklist (+15 more)

### Community 7 - "Web Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, react-router-dom, @txnlab/use-wallet-react (+15 more)

### Community 8 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, algosdk, dotenv, nanoid, socket.io-client, tsx, devDependencies, @types/node (+9 more)

### Community 9 - "Sandbox Docker & Bore Tunnel"
Cohesion: 0.20
Nodes (15): repoRoot, containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox(), SandboxEndpoint (+7 more)

### Community 10 - "Web TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 11 - "Root Workspace Config"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 12 - "Billing, Leases & Payouts"
Cohesion: 0.22
Nodes (13): debitWallet(), recordPayout(), Lease, LeaseStatus, proratedCost(), endLeaseAndBill(), leases, payoutContributor() (+5 more)

### Community 13 - "Buyer Dependencies"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 14 - "Base TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 15 - "Autonomous Buyer Agent"
Cohesion: 0.21
Nodes (11): main(), balanceOf(), LEASE_MINUTES, MIN_RAM_MB, postJson(), repoRoot, RunResponse, SandboxAccess (+3 more)

### Community 16 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 17 - "Backend TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 18 - "Contributor TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 19 - "Buyer TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 20 - "Hash Hero Animation"
Cohesion: 0.29
Nodes (3): HashHero(), HashHeroProps, ROWS

### Community 21 - "Shared TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 22 - "Hero Illustration Art"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 24 - "Favicon Brand Mark"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 25 - "Web SPA Shell"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **206 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Shared Package` connect `Tendril Concepts & Docker Deploy` to `Buyer Dependencies`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `WalletSummary` connect `Prepaid Wallet & Ledger` to `Contributor Daemon & Registry`, `Web App & Wallet Client`, `Autonomous Buyer Agent`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Dependencies` to `Tendril Concepts & Docker Deploy`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contributor Daemon & Registry` be split into smaller, more focused modules?**
  _Cohesion score 0.059506531204644414 - nodes in this community are weakly interconnected._
- **Should `Web App & Wallet Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08244680851063829 - nodes in this community are weakly interconnected._
- **Should `Backend API & x402` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._