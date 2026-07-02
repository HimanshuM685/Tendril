# Graph Report - .  (2026-07-02)

## Corpus Check
- 14 files · ~32,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 463 nodes · 663 edges · 27 communities (24 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 21,002 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web UI Components|Web UI Components]]
- [[_COMMUNITY_Contributor Agent & WS Protocol|Contributor Agent & WS Protocol]]
- [[_COMMUNITY_Dashboard & Balance Charts|Dashboard & Balance Charts]]
- [[_COMMUNITY_Backend Wallet Database|Backend Wallet Database]]
- [[_COMMUNITY_Auth & Token Issuance|Auth & Token Issuance]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Deployment Architecture Concepts|Deployment Architecture Concepts]]
- [[_COMMUNITY_Deploy Guide (DEPLOY.md)|Deploy Guide (DEPLOY.md)]]
- [[_COMMUNITY_Web Dependencies|Web Dependencies]]
- [[_COMMUNITY_Contributor Dependencies|Contributor Dependencies]]
- [[_COMMUNITY_Web TypeScript Config|Web TypeScript Config]]
- [[_COMMUNITY_Sandbox Docker Runtime|Sandbox Docker Runtime]]
- [[_COMMUNITY_Monorepo Root Scripts|Monorepo Root Scripts]]
- [[_COMMUNITY_Buyer Dependencies|Buyer Dependencies]]
- [[_COMMUNITY_Base TypeScript Config|Base TypeScript Config]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Contributor TS Config|Contributor TS Config]]
- [[_COMMUNITY_Buyer TS Config|Buyer TS Config]]
- [[_COMMUNITY_Shared TS Config|Shared TS Config]]
- [[_COMMUNITY_Hero Art Imagery|Hero Art Imagery]]
- [[_COMMUNITY_Tendril Brand Identity|Tendril Brand Identity]]
- [[_COMMUNITY_Web App Entry Point|Web App Entry Point]]
- [[_COMMUNITY_Buyer Config|Buyer Config]]
- [[_COMMUNITY_Keygen Utility|Keygen Utility]]
- [[_COMMUNITY_Sandbox Entrypoint Script|Sandbox Entrypoint Script]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `🌿 Tendril` - 11 edges
4. `startSandbox()` - 10 edges
5. `WalletSummary` - 9 edges
6. `Backend / Registry` - 9 edges
7. `endLeaseAndBill()` - 8 edges
8. `scripts` - 8 edges
9. `formatAlgo()` - 8 edges
10. `Shared Package` - 8 edges

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
- None detected.

## Hyperedges (group relationships)
- **Hero Art Composition: central figure gripping radiating threads against radial burst backdrop** — public_hero_art_multi_armed_figure, public_hero_art_radiating_threads, public_hero_art_radial_burst_backdrop [EXTRACTED 1.00]

## Communities (27 total, 3 thin omitted)

### Community 0 - "Web UI Components"
Cohesion: 0.07
Nodes (29): About(), ArchDiagram(), Contribute(), Docs(), Explore(), Props, HashHero(), HashHeroProps (+21 more)

### Community 1 - "Contributor Agent & WS Protocol"
Cohesion: 0.07
Nodes (37): main(), verifyAgentHello(), runInSandbox(), activeLeases, { address, signNonce }, AgentHelloMsg, ContainerFailedMsg, ContainerReadyMsg (+29 more)

### Community 2 - "Dashboard & Balance Charts"
Cohesion: 0.07
Nodes (32): BalanceChart(), Props, Pt, Dashboard(), Props, PRESETS, Props, SignTransactions (+24 more)

### Community 3 - "Backend Wallet Database"
Cohesion: 0.09
Nodes (32): main(), creditWallet(), debitWallet(), getBalance(), getWallet(), initDb(), pool, q() (+24 more)

### Community 4 - "Auth & Token Issuance"
Cohesion: 0.10
Nodes (29): algod, addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry (+21 more)

### Community 5 - "Backend Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+17 more)

### Community 6 - "Deployment Architecture Concepts"
Cohesion: 0.12
Nodes (25): @tendril/shared, Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Production Deployment, Sibling Container Pattern, WebSocket Proxy (nginx), Agentic Endpoints (+17 more)

### Community 7 - "Deploy Guide (DEPLOY.md)"
Cohesion: 0.08
Nodes (23): 1. Prerequisites, 2. Local setup, 3. Production deployment, 3a. Backend / registry (central API), 3b. Web app (static SPA), 3c. Contributor agent (on each contributor's machine), 3d. Autonomous consumer agent, 4. Production checklist (+15 more)

### Community 8 - "Web Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, algosdk, @blockshake/defly-connect, @perawallet/connect, react, react-dom, react-router-dom, @txnlab/use-wallet-react (+15 more)

### Community 9 - "Contributor Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 10 - "Web TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 11 - "Sandbox Docker Runtime"
Cohesion: 0.21
Nodes (14): config, repoRoot, containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), SandboxEndpoint (+6 more)

### Community 12 - "Monorepo Root Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 13 - "Buyer Dependencies"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 14 - "Base TypeScript Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 15 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 16 - "Backend TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 17 - "Contributor TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 18 - "Buyer TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 19 - "Shared TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 20 - "Hero Art Imagery"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 21 - "Tendril Brand Identity"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 22 - "Web App Entry Point"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **205 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Dashboard & Balance Charts` to `Web UI Components`, `Contributor Agent & WS Protocol`, `Backend Wallet Database`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `Shared Package` connect `Deployment Architecture Concepts` to `Contributor Dependencies`, `Buyer Dependencies`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Contributor Agent & WS Protocol` to `Sandbox Docker Runtime`, `Auth & Token Issuance`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06560283687943262 - nodes in this community are weakly interconnected._
- **Should `Contributor Agent & WS Protocol` be split into smaller, more focused modules?**
  _Cohesion score 0.07419712070874862 - nodes in this community are weakly interconnected._
- **Should `Dashboard & Balance Charts` be split into smaller, more focused modules?**
  _Cohesion score 0.06585365853658537 - nodes in this community are weakly interconnected._