# Architecture & Flow

Tendril decouples execution, orchestration, and settlement into three planes. Renters and agents use sandboxed compute; contributors connect outward without opening incoming router ports.

## Overview

- **Control plane — Tendril Registry & Ledger:** orchestrates leases over WebSockets, tracks runtime, monitors contributor heartbeats, verifies x402 payment claims, and maintains balances in Neon Postgres.
- **Execution plane — Disposable Sandboxes & Bore:** contributor daemons spawn resource-limited Docker containers. SSH reaches each sandbox through an outbound bore relay tunnel. Containers are destroyed at release.
- **Settlement plane — Algorand & x402 Facilitator:** USDC asset transfers settle on Algorand. The facilitator sponsors payment transaction fees; contributors withdraw accumulated earnings on-chain.

<!-- architecture-diagram -->

## Request Flow

1. A renter or agent discovers live nodes with the free `GET /explorer` endpoint.
2. The client requests a lease or job. A paid request receives an HTTP `402` challenge when payment is required.
3. The client signs the quoted payment and retries. The registry asks the facilitator to verify the claim without submitting it on-chain.
4. The registry dispatches work to the contributor over an authenticated WebSocket.
5. Successful provisioning or execution is followed by settlement and the response. If sandbox startup fails, nothing is settled.

For exact request shapes, see [HTTP API](/docs/api) and [x402 payments](/docs/api/x402).

## Machine Lifecycle

1. **Discovery & opening:** select an available node and open a metered lease. The gate fee establishes a session.
2. **Dispatch & provisioning:** the contributor runs a container with CPU, memory, and PID limits and launches its internal bore client.
3. **SSH access:** the renter receives the relay host and allocated port. SSH is encrypted end-to-end into the sandbox; the host filesystem is not mounted.
4. **Watchdog & release:** the registry checks runtime and available credit. Release or timeout destroys the sandbox and reconciles the exact duration.

Save artifacts before release. A new lease creates a fresh sandbox.

## Settlement Flow

USDC deposits settle on Algorand and credit an off-chain balance. Runtime is tracked continuously but charged once when the lease closes. Contributor earnings are credited to their ledger balance and withdrawn on-chain.

The facilitator follows **verify → work → settle**. Payment identity comes from the settled transaction's sender, not a caller-supplied payout address.

## Core Architectural Pillars

- **Outbound-only NAT traversal:** the contributor's bore client initiates its tunnel; no port forwarding or static public IP is needed.
- **Wallet decoupling:** the daemon holds an API key, not an Algorand private key. The wallet that minted the key owns the node and its earnings.
- **Continuous metering:** runtime is tracked by the second and reconciled at release. A goodwill runtime grace window lets a renter save work if credit runs out.
- **Sandbox isolation:** no host mounts, dropped Linux capabilities, `no-new-privileges`, hard resource limits, and automatic teardown.
