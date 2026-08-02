# Tendril API

The plain HTTP reference: every endpoint, what it returns, and a `curl` you can paste.

Tendril has two kinds of endpoint. **Most of them are ordinary HTTP** — discovery, status,
sign-in, metrics — and those are what this document covers, with real request/response pairs.
The three that move money speak x402 and need a transaction signer; they are summarised here and
specified in full in **[x402-api.md](./x402-api.md)**.

- Base URL: whatever `REGISTRY_URL` points at (`http://localhost:4000` in dev). Examples below use
  `$API`.
- Everything is JSON. Errors are `{"error": "<code>"}`, sometimes with `detail`.
- All amounts are **integer atomic units of USDC** (6 decimals), sent as strings where they cross
  the wire in x402 payloads and as numbers in the plain endpoints. `1000000` = 1.00 USDC.

```bash
export API=http://localhost:4000
```

## Table of contents

- [Which endpoints need what](#which-endpoints-need-what)
- [Authentication](#authentication)
- **Free / read**
  - [`GET /health`](#get-health)
  - [`GET /platform`](#get-platform)
  - [`GET /explorer`](#get-explorer)
  - [`GET /nodes`](#get-nodes)
  - [`GET /metrics`](#get-metrics)
- **Session**
  - [`GET /auth/wallet-nonce`](#get-authwallet-nonce)
  - [`POST /auth/wallet-login`](#post-authwallet-login)
  - [`GET /wallet`](#get-wallet)
- **Lease** (free, lease-token gated)
  - [`GET /lease/:id`](#get-leaseid)
  - [`DELETE /x402/leases/:id`](#delete-x402leasesid)
- [Paid endpoints](#paid-endpoints)
- [Error index](#error-index)

---

# Overview

## Which endpoints need what

| Endpoint | Auth | Payment | `curl`-able |
|---|---|---|---|
| `GET /health` | none | — | yes |
| `GET /platform` | none | — | yes |
| `GET /explorer` | none | — | yes |
| `GET /nodes?owner=` | none | — | yes |
| `GET /metrics` | none | — | yes |
| `GET /auth/wallet-nonce` | none | — | yes |
| `POST /auth/wallet-login` | signature | — | needs a signer |
| `GET /wallet` | session token | — | yes, once you have a token |
| `GET /lease/:id` | lease token | — | yes |
| `DELETE /x402/leases/:id` | lease token | free | yes |
| `POST /topup` | none | **x402** | quote only |
| `POST /x402/rent` | none | **x402** | quote only |
| `POST /x402/run` | none (lease token optional) | **x402** | quote only |

"Quote only" means an unpaid `curl` gets back the `402` naming the exact price — useful, but paying
it needs a signed Algorand transaction group. See [x402-api.md](./x402-api.md).

## Authentication

Three independent credentials. None of them is required to *pay* — payment identifies itself.

| Credential | How you get it | Header | Grants |
|---|---|---|---|
| **Session token** | Sign a nonce with your wallet (`/auth/wallet-nonce` → `/auth/wallet-login`) | `authorization: Bearer <token>` | Reading your own credit balance and history |
| **Lease token** | Returned by a successful rent | `authorization: Bearer <token>` | Status, job execution and release **for that one lease** |
| **Payment** | A settled x402 transaction | `PAYMENT-SIGNATURE` | The paid action itself; the payer is the transaction's sender |

A session is *not* needed to rent or top up. Its only job is letting you read a balance that
otherwise has no owner to prove.

---

# Free / read

## `GET /health`

Liveness. No auth, no side effects.

```bash
curl -s $API/health
```

```json
{"ok":true}
```

## `GET /platform`

What the registry charges in and where it sends payments. Call this first — a client should take
the network and asset from here rather than hard-coding them, because they follow the server's
`ALGORAND_NETWORK`.

```bash
curl -s $API/platform | jq
```

```json
{
  "payTo": "PLATFORM7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" },
  "facilitatorUrl": "https://facilitator.goplausible.xyz",
  "minTopUpAtomic": 100000,
  "maxTopUpAtomic": 1000000000
}
```

| Field | Meaning |
|---|---|
| `payTo` | Address every x402 payment goes to. |
| `network` | CAIP-2 id. Register your x402 scheme against **this** value. |
| `asset` | The ASA all prices are denominated in. |
| `facilitatorUrl` | Who verifies, settles, and sponsors the network fee. |
| `minTopUpAtomic` / `maxTopUpAtomic` | Bounds enforced by `POST /topup`. |

## `GET /explorer`

Live nodes available to rent. Free on purpose — an agent surveys the market before spending
anything. Only nodes that are online and heartbeating appear.

```bash
curl -s $API/explorer | jq
```

```json
{
  "nodes": [
    {
      "id": "node_7f2",
      "ownerAddr": "OWNER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "payToAddr": "OWNER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "label": "my-laptop",
      "cpuCores": 8,
      "ramMb": 32768,
      "gpu": null,
      "pricePerHourUsd": 1.0,
      "status": "online",
      "payoutBlocked": false
    }
  ]
}
```

`{"nodes":[]}` with no contributor running is normal, not an error.

`payoutBlocked: true` means the contributor's address has not opted into the payment ASA. The node
still runs and still earns; the payout is recorded unpaid until they opt in.

Pick the cheapest node with enough RAM:

```bash
curl -s $API/explorer \
  | jq '[.nodes[] | select(.status=="online" and .ramMb>=1024)]
        | sort_by(.pricePerHourUsd) | .[0]'
```

## `GET /nodes`

Nodes belonging to one owner, whatever their status — the "my machines" view. `owner` is required.

```bash
curl -s "$API/nodes?owner=OWNER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" | jq
```

```json
{"nodes":[]}
```

Omitting it is a `400`:

```bash
curl -s $API/nodes
```

```json
{"error":"owner required"}
```

## `GET /metrics`

Public platform aggregates — cumulative growth (one point per new user, `t` = epoch ms) plus
leaderboards. Derived entirely from top-ups and charges; no PII beyond addresses that are already
public on-chain.

```bash
curl -s $API/metrics | jq
```

```json
{
  "usersOverTime":   [{ "t": 1754006400000, "count": 1 }],
  "activeOverTime":  [{ "t": 1754006400000, "count": 1 }],
  "totalUsers": 1,
  "totalActive": 1,
  "topUsers": {
    "topup":     [{ "address": "RENTER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "value": 6000000 }],
    "leaseTime": [{ "address": "RENTER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "value": 60 }],
    "leaseSpan": [{ "address": "RENTER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "value": 2 }]
  },
  "topContributors": {
    "timeServed":  [{ "address": "OWNER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "value": 60 }],
    "timesServed": [{ "address": "OWNER7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "value": 2 }]
  }
}
```

Units differ per board: `topup` is atomic USDC, `leaseTime`/`timeServed` are seconds,
`leaseSpan`/`timesServed` are lease counts.

---

# Session

Signing in proves you control an address so you can read its balance. It is **not** how money gets
in, and it is not needed to spend — see [Authentication](#authentication).

## `GET /auth/wallet-nonce`

A short-lived challenge to sign. Expires in ~5 minutes.

```bash
curl -s "$API/auth/wallet-nonce?address=YOUR7ADDRESS7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
```

```json
{"nonce":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoi…"}
```

Missing `address` is a `400` `{"error":"address required"}`.

## `POST /auth/wallet-login`

Exchange a signed nonce for a session token. The signature is over a **0-ALGO self-payment** whose
note is the nonce — it is verified and discarded, never broadcast, so this costs nothing and needs
no balance.

```bash
curl -s -X POST $API/auth/wallet-login \
  -H 'content-type: application/json' \
  -d '{
        "address": "YOUR7ADDRESS7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        "nonce":   "<from /auth/wallet-nonce>",
        "payment": "<base64 signed 0-ALGO self-txn, note = nonce>"
      }'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6…",
  "address": "YOUR7ADDRESS7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "balanceAtomic": 0
}
```

Building `payment` needs a signer, so this one call is not pure `curl`. Minimal Node version:

```js
import algosdk from "algosdk";
const { nonce } = await (await fetch(`${API}/auth/wallet-nonce?address=${addr}`)).json();
const sp = { fee: 1000, firstValid: 1, lastValid: 1000, minFee: 1000, genesisID: "testnet-v1.0",
  genesisHash: algosdk.base64ToBytes("SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=") };
const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  sender: addr, receiver: addr, amount: 0,
  note: new TextEncoder().encode(nonce), suggestedParams: sp });
const payment = Buffer.from(txn.signTxn(sk)).toString("base64");
```

| Status | `error` | Meaning |
|---|---|---|
| `400` | `address, payment and nonce required` | A field is missing. |
| `401` | `stale or invalid login challenge` | Nonce expired or was not issued for this address. |
| `401` | `signature did not verify for this address` | Signature does not match `address`. |

The token is a 7-day JWT. Treat it as a bearer secret.

## `GET /wallet`

Your credit balance, full history and lifetime totals. Requires a session token — this is the one
thing a session is for.

```bash
curl -s $API/wallet -H "authorization: Bearer $TOKEN" | jq
```

```json
{
  "address": "YOUR7ADDRESS7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "balanceAtomic": 0,
  "topups": [],
  "charges": [],
  "payouts": [],
  "stats": {
    "totalSpentAtomic": 0,
    "totalToppedUpAtomic": 0,
    "totalLeaseSeconds": 0,
    "leaseCount": 0,
    "totalEarnedAtomic": 0,
    "payoutCount": 0
  }
}
```

`topups`, `charges` and `payouts` are the 50 most recent each; `stats` is lifetime and uncapped.
`payouts` is what you have **earned as a contributor**, not what you spent.

Without a token:

```bash
curl -s $API/wallet
```

```json
{"error":"sign in with your wallet first"}
```

> A headless client typically has no session and therefore cannot call this. Credit surfaces to it
> two other ways: `billing.creditAtomic` in a successful rent response, and the
> `402 insufficient_credit` body when it is too low.

---

# Lease

Both are free and gated by the **lease token** returned when you rented.

## `GET /lease/:id`

Poll a live session.

```bash
curl -s $API/lease/$LEASE -H "authorization: Bearer $LEASE_TOKEN" | jq
```

```json
{
  "lease": {
    "id": "lease_9k2m",
    "nodeId": "node_7f2",
    "status": "active",
    "rateAtomicPerHour": 1000000,
    "startedAt": 1785606951000,
    "expiresAt": 1785610551000,
    "graceUntil": null
  }
}
```

`status` is `starting` | `active` | `ended` | `failed`. `expiresAt` is when credit runs out at this
rate — top up and it moves out.

Running out of credit does **not** disconnect you on the spot. `graceUntil` turns from `null` into a
timestamp: `GRACE_ATOMIC` (default 1.00 USDC) of runtime **at your rate**, to save your work in. When
it passes, the sandbox is destroyed. Top up during the window and `graceUntil` goes back to `null`
and the session carries on — so poll this endpoint if you care about not losing a buffer.

## `DELETE /x402/leases/:id`

Stop the meter. **This is when compute is billed** — nothing was taken when the session opened.
Free, and safe to call twice.

```bash
curl -s -X DELETE $API/x402/leases/$LEASE \
  -H "authorization: Bearer $LEASE_TOKEN" | jq
```

```json
{
  "leaseId": "lease_9k2m",
  "usedSeconds": 300,
  "usedAtomic": "83334",
  "chargedAtomic": "83334",
  "balance": "916666",
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" }
}
```

Alias: `POST /lease/:id/release`.

Without a valid token, both lease endpoints answer:

```json
{"error":"invalid or missing lease token"}
```

---

# Reference

## Paid endpoints

These three settle an on-chain USDC payment, so they need a signer. Full specification, ordering
guarantees and error semantics: **[x402-api.md](./x402-api.md)**.

| Endpoint | Price | Buys |
|---|---|---|
| `POST /topup?amount=<atomic>` | what you ask for | credit on the **paying** address |
| `POST /x402/rent` | `FLAT_RENT_ATOMIC` gate fee | a metered SSH session |
| `POST /x402/run` | `FLAT_RUN_ATOMIC` + execution time | one job on a machine Tendril picks — no lease needed |

You can still get a **price quote** with plain `curl` — an unpaid request returns the `402`:

```bash
curl -s -X POST "$API/topup?amount=5000000" | jq '.accepts[0]'
```

```json
{
  "scheme": "exact",
  "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "amount": "5000000",
  "asset": "10458941",
  "payTo": "PLATFORM7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "maxTimeoutSeconds": 60,
  "extra": { "decimals": 6, "name": "USDC", "feePayer": "…", "tag": "x402-global-challenge" }
}
```

---

## Error index

Every error is `{"error": "<code>"}`, some with `detail` or extra fields.

| Status | `error` | Where | Meaning |
|---|---|---|---|
| `400` | `owner required` | `/nodes` | Missing `?owner=`. |
| `400` | `address required` | `/auth/*nonce` | Missing `?address=`. |
| `400` | `address, payment and nonce required` | `/auth/wallet-login` | Incomplete body. |
| `400` | `invalid_amount` | `/topup` | `?amount=` is not a whole number. |
| `400` | `amount_below_minimum` | `/topup` | Carries `minimum`. |
| `400` | `amount_above_maximum` | `/topup` | Carries `maximum`. |
| `400` | `invalid_ssh_key` | `/rent` | Not a valid OpenSSH public key line. |
| `401` | `sign in with your wallet first` | `/wallet` | No/invalid session token. |
| `401` | `stale or invalid login challenge` | `/auth/wallet-login` | Nonce expired. |
| `401` | `signature did not verify for this address` | `/auth/wallet-login` | Wrong signer. |
| `401` | `invalid or missing lease token` | `/lease/*` | Token absent or for another lease. |
| `402` | *(PaymentRequired body)* | paid routes | Pay the quoted amount. |
| `402` | `insufficient_credit` | `/rent` | Top up first — nothing settled. |
| `402` | `settlement_failed` | paid routes | Carries `detail`. |
| `404` | `node_not_found` | `/rent` | No such node. |
| `404` | `lease not found` | `/lease/*` | Already gone. |
| `409` | `node_unavailable` | `/rent` | Offline or missed heartbeats. |
| `409` | `node_busy` | `/rent` | Taken — nothing settled. |
| `409` | `payment_already_used` | paid routes | Carries `txid`. |
| `500` | `metrics failed: …` | `/metrics` | Database unreachable. |
| `502` | `facilitator_unavailable` | paid routes | Nothing submitted. |
| `503` | `provisioning_failed` | `/rent` | Sandbox never came up — nothing settled. |

### CORS

The payable routes answer **any** origin on purpose, so any browser can pay one. `CORS_ORIGIN`
guards everything else — sign-in, `/wallet`, `/metrics`, `/explorer`, `/nodes`. CORS only ever
constrained browsers; a `curl` or a headless agent was never subject to it.
