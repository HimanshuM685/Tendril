# Graph Report - .  (2026-08-01)

## Corpus Check
- Corpus is ~36,677 words - fits in a single context window. You may not need a graph.

## Summary
- 492 nodes · 764 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.82)
- Token cost: 44,000 input · 331 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Metrics Charts & Docker Runtime|Metrics Charts & Docker Runtime]]
- [[_COMMUNITY_Marketing Pages & Layout|Marketing Pages & Layout]]
- [[_COMMUNITY_Wallet Auth & Session Tokens|Wallet Auth & Session Tokens]]
- [[_COMMUNITY_Postgres Ledger & DB|Postgres Ledger & DB]]
- [[_COMMUNITY_Dashboard & Top-Up UI|Dashboard & Top-Up UI]]
- [[_COMMUNITY_Shared DTOs & Buyer Agent|Shared DTOs & Buyer Agent]]
- [[_COMMUNITY_System Architecture Concepts|System Architecture Concepts]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Web Wallet Dependencies|Web Wallet Dependencies]]
- [[_COMMUNITY_Buyer Package Config|Buyer Package Config]]
- [[_COMMUNITY_Web TS Config|Web TS Config]]
- [[_COMMUNITY_Monorepo Root Scripts|Monorepo Root Scripts]]
- [[_COMMUNITY_Contributor Package Config|Contributor Package Config]]
- [[_COMMUNITY_Shared TS Base Config|Shared TS Base Config]]
- [[_COMMUNITY_Shared Package Manifest|Shared Package Manifest]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Workspace TS Config|Workspace TS Config]]
- [[_COMMUNITY_Hero Illustration Art|Hero Illustration Art]]
- [[_COMMUNITY_Registry URL Config|Registry URL Config]]
- [[_COMMUNITY_Docker Compose Services|Docker Compose Services]]
- [[_COMMUNITY_Brand Identity & Favicon|Brand Identity & Favicon]]
- [[_COMMUNITY_Web App Entry Point|Web App Entry Point]]
- [[_COMMUNITY_Buyer Config|Buyer Config]]
- [[_COMMUNITY_Platform Keygen|Platform Keygen]]
- [[_COMMUNITY_Sandbox Entrypoint|Sandbox Entrypoint]]
- [[_COMMUNITY_Vercel SPA Rewrites|Vercel SPA Rewrites]]
- [[_COMMUNITY_Production Deployment|Production Deployment]]
- [[_COMMUNITY_Nginx WebSocket Proxy|Nginx WebSocket Proxy]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `compilerOptions` - 13 edges
3. `apiError()` - 13 edges
4. `formatAlgoExact()` - 12 edges
5. `formatAlgo()` - 12 edges
6. `WalletSummary` - 11 edges
7. `startSandbox()` - 10 edges
8. `ActiveLease` - 10 edges
9. `backend/ (Registry + API)` - 10 edges
10. `endLeaseAndBill()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `WalletSummary`  [EXTRACTED]
  web/src/components/WalletPanel.tsx → shared/src/index.ts
- `main()` --calls--> `formatAlgoExact()`  [EXTRACTED]
  example-buyer/src/index.ts → shared/src/index.ts
- `endLeaseAndBill()` --calls--> `proratedCost()`  [EXTRACTED]
  backend/src/leases.ts → shared/src/index.ts
- `withStatus()` --calls--> `isOnline()`  [EXTRACTED]
  backend/src/registry.ts → shared/src/index.ts
- `Props` --references--> `TopUp`  [EXTRACTED]
  web/src/components/BalanceChart.tsx → shared/src/index.ts

## Import Cycles
- 1-file cycle: `contributor/src/index.ts -> contributor/src/index.ts`
- 1-file cycle: `example-buyer/src/index.ts -> example-buyer/src/index.ts`

## Hyperedges (group relationships)
- **Three Deployable Components** — tendril_backend, tendril_contributor, tendril_web [EXTRACTED 1.00]
- **Docker Compose Service Mapping** — deploy_docker_backend_service, deploy_docker_contributor_service, deploy_docker_buyer_service [EXTRACTED 1.00]
- **Hero Art Composition: central figure gripping radiating threads against radial burst backdrop** — public_hero_art_multi_armed_figure, public_hero_art_radiating_threads, public_hero_art_radial_burst_backdrop [EXTRACTED 1.00]
- **Prepaid Money Flow Lifecycle** — readme_wallet_signin_nonce, readme_wallet_topup, readme_rent_endpoint, readme_onchain_payout, readme_prorated_hourly_billing [EXTRACTED 0.90]
- **@tendril Monorepo Workspaces** — readme_backend, readme_contributor, readme_web, readme_example_buyer, readme_shared [EXTRACTED 0.90]
- **Contribution Safety Boundary** — readme_trust_model, readme_ephemeral_docker_sandbox, readme_bore_tunnel, readme_ssh_sandbox_session [EXTRACTED 0.85]

## Communities (31 total, 7 thin omitted)

### Community 0 - "Metrics Charts & Docker Runtime"
Cohesion: 0.06
Nodes (44): BoardTab, main(), containerName(), dockerNcpu(), ensureImage(), execFileP, getFreePort(), runInSandbox() (+36 more)

### Community 1 - "Marketing Pages & Layout"
Cohesion: 0.07
Nodes (34): About(), ArchDiagram(), Contribute(), Props, Docs(), Explore(), Props, HashHero() (+26 more)

### Community 2 - "Wallet Auth & Session Tokens"
Cohesion: 0.08
Nodes (40): algod, addressFromSession(), issueLeaseToken(), issueNonce(), issueSession(), issueWalletNonce(), leaseIdFromAuthHeader(), NonceEntry (+32 more)

### Community 3 - "Postgres Ledger & DB"
Cohesion: 0.09
Nodes (34): main(), creditWallet(), cumulativeByDay(), debitWallet(), getBalance(), getWallet(), initDb(), metrics() (+26 more)

### Community 4 - "Dashboard & Top-Up UI"
Cohesion: 0.10
Nodes (24): BalanceChart(), Props, Pt, AlgoStat(), Dashboard(), ExplorerLink(), short(), SignTransactions (+16 more)

### Community 5 - "Shared DTOs & Buyer Agent"
Cohesion: 0.10
Nodes (23): main(), balanceOf(), LEASE_MINUTES, MIN_RAM_MB, PaymentRequired, PlatformInfo, postJson(), repoRoot (+15 more)

### Community 6 - "System Architecture Concepts"
Cohesion: 0.11
Nodes (28): Algorand (Algod), backend/ (Registry + API), bore Tunnel, Charge-Once at Lease End, contributor/ (Contributor Daemon), Custodial Off-chain Ledger, Ephemeral Docker Sandbox, example-buyer/ (Autonomous Agent) (+20 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, algosdk, cors, dotenv, express, jsonwebtoken, nanoid, pg (+18 more)

### Community 8 - "Web Wallet Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, algosdk, @blockshake/defly-connect, lute-connect, @perawallet/connect, react, react-dom, react-router-dom (+17 more)

### Community 9 - "Buyer Package Config"
Cohesion: 0.11
Nodes (18): dependencies, algosdk, dotenv, nanoid, socket.io-client, @tendril/shared, tsx, devDependencies (+10 more)

### Community 10 - "Web TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 11 - "Monorepo Root Scripts"
Cohesion: 0.12
Nodes (15): description, engines, node, name, private, scripts, backend, build:shared (+7 more)

### Community 12 - "Contributor Package Config"
Cohesion: 0.13
Nodes (14): dependencies, algosdk, dotenv, @tendril/shared, tsx, devDependencies, @types/node, typescript (+6 more)

### Community 13 - "Shared TS Base Config"
Cohesion: 0.14
Nodes (13): compilerOptions, composite, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+5 more)

### Community 14 - "Shared Package Manifest"
Cohesion: 0.20
Nodes (9): exports, main, name, private, scripts, build, type, types (+1 more)

### Community 15 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 16 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 17 - "Workspace TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, types, extends, include, references

### Community 18 - "Workspace TS Config"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, rootDir, extends, include

### Community 19 - "Hero Illustration Art"
Cohesion: 0.60
Nodes (5): Hero Art Illustration (blue duotone engraving), Multi-armed Hermes-like Central Figure, Radial Burst Circle over Lightning-Tendril Square Backdrop, Radiating Thread Bundles Gripped in Fists, Tendril Network Hub Metaphor

### Community 21 - "Docker Compose Services"
Cohesion: 0.50
Nodes (4): Docker Backend Service, Docker Buyer Service, Docker Contributor Service, Sibling Container Pattern

### Community 22 - "Brand Identity & Favicon"
Cohesion: 0.67
Nodes (4): Tendril Brand Green (#0B5D3A), Tendril Brand Identity, Tendril Favicon Mark, Cream Serif 'T' Glyph

### Community 23 - "Web App Entry Point"
Cohesion: 0.50
Nodes (4): main.tsx Module Entry Point, Prepaid Compute Metered in ALGO, Tendril Web App HTML Entry, React Root Mount Node (#root)

## Knowledge Gaps
- **200 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WalletSummary` connect `Marketing Pages & Layout` to `Metrics Charts & Docker Runtime`, `Postgres Ledger & DB`, `Dashboard & Top-Up UI`, `Shared DTOs & Buyer Agent`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `SandboxLimits` connect `Wallet Auth & Session Tokens` to `Metrics Charts & Docker Runtime`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `SandboxAccess` connect `Shared DTOs & Buyer Agent` to `Metrics Charts & Docker Runtime`, `Marketing Pages & Layout`, `Wallet Auth & Session Tokens`, `Postgres Ledger & DB`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `apiError()` (e.g. with `loginWithWallet()` and `topUp()`) actually correct?**
  _`apiError()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Metrics Charts & Docker Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `Marketing Pages & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._