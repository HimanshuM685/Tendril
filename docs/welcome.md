# Welcome to Tendril

Tendril rents real machines by the second, paid in **USDC over x402** on Algorand. Top up once, then rent a box and SSH into it, or send a script to `POST /x402/run`. Usage is billed at the end of your session.

## Choose your path

- **Rent compute:** [Getting started](/docs/start/getting-started) walks through sign-in, credit, and your first lease.
- **Understand the system:** [Architecture & Flow](/docs/start/architecture-flow) traces requests, sandboxes, and settlement.
- **Build an integration:** [Build on Tendril](/docs/build) covers scripts, contributor daemons, and agent tooling.
- **Call the API:** [HTTP API](/docs/api) and [x402 payments](/docs/api/x402) document requests, responses, and errors.

## How Tendril fits together

**Algorand** provides settlement and deterministic finality. The x402 facilitator sponsors payment network fees so renters can pay with USDC without holding ALGO for those payments.

**USDC with x402** provides USD-denominated payments, idempotent deposits, and an off-chain prepaid ledger.

**Docker and bore** provide disposable Linux sandboxes and outbound tunnels. Contributor machines do not need incoming router ports opened.

Read [Algorand settlement](/docs/concepts/algorand-settlement), [USDC with x402](/docs/concepts/usdc-with-x402), or [Sandboxes & Bore Tunnels](/docs/concepts/sandboxes-bore-tunnels) for details.
