# Tendril x402 API

Payment-gated HTTP API for renting compute. Every endpoint that costs money speaks
[x402](https://x402.org) V2, `exact` scheme, AVM (Algorand) mechanism.

- **Base URL** — `http://localhost:4000` in development; whatever `PUBLIC_BASE_URL` says in production.
- **Asset** — Algorand USDC. Testnet ASA `10458941`, mainnet `31566704`, 6 decimals.
- **Network** — CAIP-2 `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=` (testnet).
- **Content type** — `application/json` on every request and response.

**All amounts are integer strings of atomic units.** `"250000"` is 0.25 USDC. They are strings
because a JSON number cannot carry a `uint64` safely; never parse one into a float before doing
arithmetic on it.

---

## Table of contents

- [How payment works](#how-payment-works)
- [Headers](#headers)
- [Authentication](#authentication)
- [CORS](#cors)
- [Common schemas](#common-schemas)
- **Endpoints**
  - [`POST /topup`](#post-topup) — buy credit, any amount
  - [`POST /rent/:nodeId`](#post-rentnodeid) — open a metered session
  - [`POST /lease/:id/run`](#post-leaseidrun) — execute one job, flat price
  - [`DELETE /x402/leases/:id`](#delete-x402leasesid) — stop the meter and bill
  - [`GET /lease/:id`](#get-leaseid) — lease status (free)
  - [`GET /platform`](#get-platform) — asset + network discovery (free)
  - [`GET /explorer`](#get-explorer) — available nodes (free)
- [Error index](#error-index)
- [Configuration](#configuration)
- [Renting from the CLI](#renting-from-the-cli) — no browser, no sign-in
- [Client recipes](#client-recipes)

> Looking for the **free** endpoints — `/explorer`, `/platform`, `/metrics`, `/wallet`,
> sign-in, lease status and release? Those are plain HTTP with copy-paste `curl`:
> **[api.md](./api.md)**. This document covers only the three that move money.

---

## How payment works

Three round trips at most, and the middle one is where the money would be lost if the ordering were
wrong.

```
  client                          server                      facilitator        chain
    │  POST /topup?amount=5000000    │                              │              │
    │───────────────────────────────>│                              │              │
    │  402 + PaymentRequired         │                              │              │
    │<───────────────────────────────│                              │              │
    │                                │                              │              │
   build atomic group:               │                              │              │
     [0] USDC transfer   (signed)    │                              │              │
     [1] fee payer txn   (unsigned)  │                              │              │
    │                                │                              │              │
    │  POST … PAYMENT-SIGNATURE      │                              │              │
    │───────────────────────────────>│  verify() ──────────────────>│              │
    │                                │<──────────── isValid ────────│  (simulate,  │
    │                                │                              │   no submit) │
    │                          ...do the work...                    │              │
    │                          (provision sandbox / run job)        │              │
    │                                │                              │              │
    │                                │  settle() ──────────────────>│───signs [1]─>│
    │                                │<──────────── txid ───────────│              │
    │  200 + PAYMENT-RESPONSE        │                              │              │
    │<───────────────────────────────│                              │              │
```

**Verify, then work, then settle.** `verify()` only simulates the transaction group — nothing
reaches the chain. The server does the work in that gap and settles afterwards. So a sandbox that
fails to start returns `503` with **nothing settled**: the caller has paid nothing and can retry
elsewhere.

**Fees are sponsored.** The 402 carries `extra.feePayer`, the facilitator's address. The client
builds a two-transaction group — its own transfer plus an unsigned self-payment from the fee payer
whose fee covers both — and signs **only its own**. The facilitator signs the other and submits.
A client therefore needs USDC and **zero ALGO**. The fee is never itemised and never charged on.

**Payer identity comes off the settled transaction.** The server decodes the transaction at
`paymentIndex` and takes its sender. That address is what gets credited, billed, and refunded —
nothing a client says about who it is, is trusted.

---

## Headers

### Request

| Header | When | Value |
|---|---|---|
| `PAYMENT-SIGNATURE` | retrying a 402 | base64 JSON of a [PaymentPayload](#paymentpayload) |
| `X-PAYMENT` | — | accepted as a legacy alias for the above |
| `Authorization: Bearer <token>` | optional / required per route | a **session token** or a **lease token** — see [Authentication](#authentication) |
| `Content-Type: application/json` | with a body | |

### Response

| Header | When | Value |
|---|---|---|
| `PAYMENT-REQUIRED` | on every `402` challenge | base64 JSON of the [PaymentRequired](#paymentrequired) body |
| `PAYMENT-RESPONSE` | on a `200` that settled a payment | base64 JSON of a [SettleResponse](#settleresponse) |
| `X-PAYMENT-RESPONSE` | same | legacy alias, identical value |

`PAYMENT-REQUIRED` and the `402` body carry the same object; read whichever is convenient.

> **Browsers:** `PAYMENT-SIGNATURE` is a non-simple header, so every paid request is preflighted.
> The three response headers above are in `Access-Control-Expose-Headers`, or a paid response would
> look unpaid to JavaScript.

---

## Authentication

Three independent credentials. None of them is how you pay.

| Credential | Obtained from | Used by | Lifetime |
|---|---|---|---|
| **Session token** | `POST /auth/wallet-login` | spending an existing credit balance | 7 days |
| **Lease token** | the `leaseToken` field of a successful rent | `/lease/:id/*` | 24 hours |
| **A payment** | your wallet | everything that costs money | per request |

Signing in proves you control an address so you can *spend* credit already sitting against it. It is
not required to pay, and it never was: a brand-new address with no history can call `POST /topup` and
be credited on its first ever request.

---

## CORS

Every **payable** route answers `Access-Control-Allow-Origin: *`. A browser on any origin is as much
a first-class client as the Tendril web app — the 402 is what protects these routes, and the price is
the same whoever asks.

| Open to any origin | Behind `CORS_ORIGIN` |
|---|---|
| `POST /topup`, `POST /x402/topup` | `GET /platform` |
| `POST /rent/:nodeId`, `POST /x402/rent/:nodeId` | `GET /explorer`, `GET /nodes` |
| `POST /lease/:id/run` | `GET /wallet`, `GET /metrics` |
| `POST /lease/:id/release`, `DELETE /x402/leases/:id` | `GET /lease/:id`, `/auth/*` |

CORS constrains browsers only — a headless agent was never subject to it and can call anything.

---

## Common schemas

### PaymentRequired

The body of every `402` challenge, and the base64 payload of `PAYMENT-REQUIRED`.

```jsonc
{
  "x402Version": 2,
  "error": "Payment required",          // or a facilitator reason, e.g. "insufficient_funds"
  "resource": {
    "url": "https://api.tendril.xyz/topup?amount=5000000",
    "description": "Credit 5 USDC to the paying address. Pay from a wallet you control: …",
    "mimeType": "application/json"
  },
  "accepts": [ /* PaymentRequirements */ ]
}
```

`accepts` always has exactly one entry: Tendril takes one asset on one network.

### PaymentRequirements

```jsonc
{
  "scheme": "exact",
  "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "amount": "5000000",                  // atomic units — pay exactly this
  "asset": "10458941",                  // ASA id
  "payTo": "PLATFORM…ADDRESS",
  "maxTimeoutSeconds": 60,              // how long this challenge stays payable
  "extra": {
    "decimals": 6,
    "name": "USDC",
    "feePayer": "ZMFK2OI7…RA22AA"       // absent if the facilitator sponsors nothing
  }
}
```

If `extra.feePayer` is absent, build a one-transaction group and pay your own fee — you will need
ALGO. If present, build the two-transaction group described above and sign only index 0.

### PaymentPayload

What you base64-encode into `PAYMENT-SIGNATURE`.

```jsonc
{
  "x402Version": 2,
  "scheme": "exact",
  "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "payload": {
    "paymentGroup": ["<base64 msgpack txn>", "<base64 msgpack txn>"],
    "paymentIndex": 0                   // which entry is YOUR transfer
  }
}
```

The group must already carry a valid group id. `paymentIndex` names your signed transfer; the other
entry is the fee payer's, left unsigned.

### SettleResponse

Base64 payload of `PAYMENT-RESPONSE`.

```jsonc
{
  "success": true,
  "transaction": "ABC123…",             // on-chain txid
  "network": "algorand:SGO1…cOUJOiI=",
  "payer": "AGENT7…XYZ"
}
```

### AssetInfo

```jsonc
{ "id": "10458941", "decimals": 6, "symbol": "USDC" }
```

### PaymentReceipt

```jsonc
{ "txid": "ABC123…", "network": "algorand:SGO1…cOUJOiI=" }
```

### SandboxAccess

```jsonc
{
  "kind": "ssh",
  "host": "bore.pub",
  "port": 41823,
  "username": "root",
  "authMethod": "publickey",            // or "password"
  "password": null,                     // your address, under "password"
  "command": "ssh root@bore.pub -p 41823"
}
```

### Error envelope

Every non-402 failure, and the two 402s that are *not* challenges:

```jsonc
{ "error": "node_busy" }                      // machine-readable code
{ "error": "insufficient_credit", "detail": "…" } // some carry extra context
```

> **Two shapes of 402.** A 402 that means *"pay this"* has a [PaymentRequired](#paymentrequired)
> body. A 402 that means *"your payment cannot proceed"* — `settlement_failed`,
> `insufficient_credit` — has an error envelope. Branch on the presence of `accepts`, not on the
> status code alone.

---

# Endpoints

## `POST /topup`

Buy credit. **Alias:** `POST /x402/topup` — identical behaviour.

Credit is keyed to the **sender of the settled transaction**, not to any session. Pay from a wallet
you control: money sent from an address you cannot sign for (an exchange withdrawal, say) creates a
balance nobody can spend.

| | |
|---|---|
| **Auth** | none |
| **CORS** | open |
| **Price** | whatever you ask for |

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `amount` | integer string, atomic units | no | How much credit to buy. Between `MIN_TOPUP_ATOMIC` (default `100000` = 0.10 USDC) and `MAX_TOPUP_ATOMIC` (default `1000000000` = 1000 USDC). Omit it and you get `DEFAULT_TOPUP_ATOMIC` (default `1000000` = 1 USDC). |

### Request body

None.

### `200 OK`

Payment settled. One `topups` row written and the address's credit balance raised by the same amount,
in one database transaction. Carries `PAYMENT-RESPONSE`.

```jsonc
{
  "address": "AGENT7XYZ…",              // the payer, read off the settled transaction
  "credited": "5000000",
  "balance": "7250000",                 // after crediting
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" },
  "payment": { "txid": "ABC123…", "network": "algorand:SGO1…cOUJOiI=" }
}
```

**Replays return `200` too.** Send the same `PAYMENT-SIGNATURE` twice and the second call returns the
original receipt, credits nothing further, and omits the `PAYMENT-RESPONSE` header — there was no new
settlement to report.

### `402 Payment Required`

No payment attached, or the payment did not verify. Body is [PaymentRequired](#paymentrequired).
Nothing was submitted.

Also `402` with an **error envelope** when settlement itself failed:

```jsonc
{ "error": "settlement_failed", "detail": "insufficient_funds" }
```

### `400 Bad Request`

| `error` | Meaning |
|---|---|
| `invalid_amount` | `?amount=` was not a whole number of atomic units. Carries `detail`. |
| `amount_below_minimum` | Below `MIN_TOPUP_ATOMIC`. Carries `minimum`. |
| `amount_above_maximum` | Above `MAX_TOPUP_ATOMIC`. Carries `maximum`. |
| `malformed_payment` | `PAYMENT-SIGNATURE` was not decodable, or is not an AVM transaction group. |

### `502 Bad Gateway`

```jsonc
{ "error": "facilitator_unavailable", "detail": "fetch failed" }
```

The facilitator could not be reached. Nothing was submitted and nothing was credited.

### Example

**Step 1 — ask, with `curl`.** Reading the quote needs no signer, so this half is plain HTTP.

```bash
curl -isS -X POST "$API/topup?amount=5000000"
```

```http
HTTP/1.1 402 Payment Required
payment-required: eyJ4NDAyVmVyc2lvbiI6MiwiZXJyb3IiOiJQYXltZW50IHJlcXVpcmVkIiwi…
content-type: application/json; charset=utf-8
```

The body is the same object as the header, so `jq` it directly:

```bash
curl -sS -X POST "$API/topup?amount=5000000" | jq '{amount:.accepts[0].amount, payTo:.accepts[0].payTo, asset:.accepts[0].asset}'
```

```json
{
  "amount": "5000000",
  "payTo": "PLATFORM7ADDRESS7EXAMPLE7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "10458941"
}
```

Or decode the header, which is what a v2 client actually reads:

```bash
curl -sS -D - -o /dev/null -X POST "$API/topup?amount=5000000" \
  | grep -i '^payment-required:' | cut -d' ' -f2 | base64 -d | jq .resource
```

```json
{
  "url": "https://api.tendril.example/topup?amount=5000000",
  "description": "Credit 5 USDC to the paying address. Pay from a wallet you control: the balance is keyed to the sender and can only be spent by signing from that address.",
  "mimeType": "application/json",
  "serviceName": "TENDRIL",
  "tags": ["x402-global-challenge", "compute", "ssh", "sandbox"]
}
```

**Step 2 — pay.** `curl` cannot build this header: it is a base64-msgpack Algorand transaction
group with your signature over one of its transactions. Mint it with the helper below, then the
request itself is `curl` again.

```bash
# sign.mjs prints a PAYMENT-SIGNATURE value for a given 402 body
SIG=$(curl -sS -X POST "$API/topup?amount=5000000" | node sign.mjs)

curl -isS -X POST "$API/topup?amount=5000000" -H "PAYMENT-SIGNATURE: $SIG"
```

```http
HTTP/1.1 200 OK
payment-response: eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6…
```

```json
{
  "address": "YOUR7ADDRESS7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "credited": "5000000",
  "balance": "5000000",
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" },
  "payment": { "txid": "ABC123…", "network": "algorand:SGO1…cOUJOiI=" }
}
```

<details>
<summary><code>sign.mjs</code> — reads a 402 body on stdin, prints the header value</summary>

```js
// npm i @x402/core @x402/avm algosdk
import { x402Client } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import algosdk from "algosdk";

const sk = new Uint8Array(Buffer.from(process.env.AVM_PRIVATE_KEY, "base64"));
const address = algosdk.encodeAddress(sk.slice(32));
const signer = {
  address,
  // Sign only the indexes asked for — the fee-payer transaction is left unsigned
  // for the facilitator, which is why this account needs USDC but no ALGO.
  async signTransactions(txns, indexes) {
    const wanted = indexes ?? txns.map((_, i) => i);
    return txns.map((b, i) =>
      wanted.includes(i) ? algosdk.decodeUnsignedTransaction(b).signTxn(sk) : null,
    );
  },
};

const challenge = JSON.parse(await new Response(process.stdin).text());
const client = new x402Client().register(
  challenge.accepts[0].network,
  new ExactAvmScheme(signer),
);
process.stdout.write(
  encodePaymentSignatureHeader(await client.createPaymentPayload(challenge)),
);
```

</details>

The signed header is **single-use**: replaying it returns the original receipt for `/topup`
(idempotent) but `409 payment_already_used` on `/rent` and `/run`, which buy something.

### Errors, with `curl`

All three are plain requests — no signer needed to see them.

```bash
curl -sS -X POST "$API/topup?amount=1"            # below MIN_TOPUP_ATOMIC
curl -sS -X POST "$API/topup?amount=99999999999"  # above MAX_TOPUP_ATOMIC
curl -sS -X POST "$API/topup?amount=abc"          # not an integer
```

```json
{"error":"amount_below_minimum","minimum":"100000"}
{"error":"amount_above_maximum","maximum":"1000000000"}
{"error":"invalid_amount","detail":"?amount= must be a whole number of atomic units"}
```

---

## `POST /rent/:nodeId`

Open a metered session on a node. **Alias:** `POST /x402/rent/:nodeId`.

There is no duration to choose and no block to buy. Renting pays one flat on-chain **gate fee** —
that is the x402 payment, and the only thing that moves up front. From there the clock simply runs,
and the seconds actually used are billed from credit **once**, when the session closes.

The session lives exactly as long as the renter's credit can pay for it. The watchdog stops it at
`fundedUntil`, which is `credit ÷ rate`. Top up and that moment moves out — nobody is disconnected
at the end of a block they guessed wrong.

| | |
|---|---|
| **Auth** | none |
| **CORS** | open |
| **Price** | `FLAT_RENT_ATOMIC` (0.01 USDC) on-chain, then `pricePerHourUsd` billed from credit |

### Path parameters

| Name | Description |
|---|---|
| `nodeId` | From `GET /explorer`. |

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `sshPubKey` | string | no | An OpenSSH public key line, e.g. `ssh-ed25519 AAAAC3Nza…`. Installed as the sandbox's `authorized_keys`; the response then has `authMethod: "publickey"` and `password: null`. **Without a session this is the only usable auth** — there is no address to use as a password. |

```jsonc
{ "sshPubKey": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI… you@host" }
```

### `200 OK`

Sandbox is up, the gate fee has settled, and the meter is running. Carries `PAYMENT-RESPONSE`.

```jsonc
{
  "leaseId": "lease_9k2m",
  "leaseToken": "eyJhbGciOi…",          // required by /lease/:id/run and /release
  "node": {
    "id": "node_7f2",
    "cpu": 8,
    "memoryGb": 32,
    "gpu": null,
    "pricePerHourUsd": 1.0
  },
  "ssh": {
    "kind": "ssh",
    "host": "bore.pub",
    "port": 41823,
    "username": "root",
    "authMethod": "publickey",
    "password": null,
    "command": "ssh root@bore.pub -p 41823"
  },
  "startedAt": "2026-08-01T10:14:02.000Z",
  "fundedUntil": "2026-08-01T11:14:02.000Z",   // or "never" on a free node
  "billing": {
    "rateAtomicPerHour": "1000000",
    "gateFeeAtomic": "10000",
    "creditAtomic": "1000000",          // credit at open — what funded the window
    "fundedSeconds": 3600,              // null on a free node
    "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" }
  },
  "payment": { "txid": "DEF456…", "network": "algorand:SGO1…cOUJOiI=" }
}
```

`fundedUntil` is a projection, not a promise of disconnection at that instant: the watchdog checks
every `METER_INTERVAL_MS`, so a session can overrun by up to one tick. That overrun is clamped to the
balance at billing time and absorbed by the platform, never charged past what the renter holds.

Reaching it does not kill the session outright either. The watchdog re-reads the payer's live balance
first, so a top-up made mid-session extends the window instead of waiting for the next rent. Only if
the credit really is spent does it open a **grace window** — `GRACE_ATOMIC` (default 1.00 USDC) of
runtime at that lease's rate, enough to push your work somewhere — and destroy the sandbox when the
window closes. `GET /lease/:id` reports it as `graceUntil`. Top up during it and it clears.

### Responses

| Status | `error` | Meaning |
|---|---|---|
| `402` | *(PaymentRequired body)* | Pay the gate fee, or your payment did not verify. Nothing submitted. |
| `402` | `insufficient_credit` | Verified, but the payer's credit funds less than `MIN_LEASE_SECONDS` at this node's rate. **Nothing settled** — top up first. Carries `detail`, `creditAtomic`, `rateAtomicPerHour`. |
| `402` | `settlement_failed` | Sandbox came up but the gate fee would not settle. Sandbox torn down, node freed. Carries `detail`. |
| `400` | `invalid_ssh_key` | `sshPubKey` is not a valid OpenSSH public key line. |
| `400` | `malformed_payment` | `PAYMENT-SIGNATURE` undecodable. |
| `404` | `node_not_found` | No such node. |
| `409` | `node_unavailable` | Node is offline or has missed heartbeats. |
| `409` | `node_busy` | Someone else took the node — including while you were away paying. **Nothing was settled.** |
| `409` | `payment_already_used` | That payment already bought something. Carries `txid`. |
| `503` | `provisioning_failed` | Sandbox did not come up within `SANDBOX_READY_TIMEOUT_MS`. **Nothing was settled** — retry on another node. Carries `detail`. |
| `502` | `facilitator_unavailable` | Facilitator unreachable. Nothing submitted. |

The credit check runs **after** `verify()` and **before** `settle()`. An address that cannot fund a
minimum session is turned away without paying the gate fee, rather than being charged for a session
the watchdog would kill on its next tick.

### Example

Pick a node and read the gate-fee quote — both plain `curl`:

```bash
NODE=$(curl -sS $API/explorer | jq -r '[.nodes[] | select(.status=="online")]
                                       | sort_by(.pricePerHourUsd) | .[0].id')

curl -sS -X POST "$API/rent/$NODE" | jq '.accepts[0].amount'
```

```json
"10000"
```

Then pay it, sending your public key so you can actually log in (see the note below):

```bash
BODY=$(jq -n --arg k "$(cat ~/.ssh/id_ed25519.pub)" '{sshPubKey:$k}')
SIG=$(curl -sS -X POST "$API/rent/$NODE" -H 'content-type: application/json' -d "$BODY" | node sign.mjs)

curl -sS -X POST "$API/rent/$NODE" \
     -H 'content-type: application/json' \
     -H "PAYMENT-SIGNATURE: $SIG" \
     -d "$BODY" | tee lease.json | jq '{cmd:.ssh.command, until:.fundedUntil}'
```

```json
{
  "cmd": "ssh root@bore.pub -p 41823",
  "until": "2026-08-01T11:14:02.000Z"
}
```

Keep the token — it is the only credential for status, `/run` and release, and it is returned once:

```bash
export LEASE=$(jq -r .leaseId lease.json)
export LEASE_TOKEN=$(jq -r .leaseToken lease.json)
eval "$(jq -r .ssh.command lease.json)"      # actually connect
```

Without a session, **omitting `sshPubKey` leaves you locked out**: the fallback password is the
session address, and there isn't one. The rent still succeeds and still bills.

Failures you can reproduce with `curl` alone, no signer:

```bash
curl -sS -X POST "$API/rent/node_doesnotexist"
```

```json
{"error":"node_not_found"}
```


## `POST /lease/:id/run`

Execute one job inside a running sandbox, at a flat price per call.

**The job runs before the payment settles.** A job that never ran is never paid for.

| | |
|---|---|
| **Auth** | lease token, required |
| **CORS** | open |
| **Price** | `FLAT_RUN_ATOMIC` (default `10000` = 0.01 USDC) |

### Request headers

| Header | Required | Description |
|---|---|---|
| `Authorization: Bearer <leaseToken>` | yes | The `leaseToken` from the rent response. Must match `:id`. |
| `PAYMENT-SIGNATURE` | on the retry | |

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `payload` | string | yes | Source to execute in the sandbox. |

```jsonc
{ "payload": "print(sum(range(100)))" }
```

### `200 OK`

Carries `PAYMENT-RESPONSE`.

```jsonc
{
  "jobId": "V1StGXR8Z5",
  "ok": true,
  "result": "4950\n"
}
```

`ok: false` means the job ran and failed; `result` holds whatever it printed. It is still a `200`,
and it is still charged — the compute was consumed.

### Responses

| Status | `error` | Meaning |
|---|---|---|
| `402` | *(PaymentRequired body)* | Pay `FLAT_RUN_ATOMIC`. |
| `402` | `settlement_failed` | Job ran but the payment would not settle. Carries `detail`. |
| `400` | `payload (string) required` | Body had no `payload` string. |
| `400` | `malformed_payment` | `PAYMENT-SIGNATURE` undecodable. |
| `401` | `invalid or missing lease token` | Token absent, malformed, or for a different lease. |
| `404` | `lease not found` | Token valid but the lease is gone. |
| `409` | `lease not active` | Lease has not started, or has already ended. |
| `409` | `payment_already_used` | That payment already bought something. Carries `txid`. |
| `502` | *(message from the agent)* | Job timed out or the node dropped. **Nothing settled.** |

### Example

The lease token authenticates; the payment buys the execution. Both headers are required.

```bash
RUN=$(jq -n '{payload:"print(sum(range(100)))"}')
SIG=$(curl -sS -X POST "$API/lease/$LEASE/run" \
        -H "authorization: Bearer $LEASE_TOKEN" \
        -H 'content-type: application/json' -d "$RUN" | node sign.mjs)

curl -sS -X POST "$API/lease/$LEASE/run" \
     -H "authorization: Bearer $LEASE_TOKEN" \
     -H 'content-type: application/json' \
     -H "PAYMENT-SIGNATURE: $SIG" \
     -d "$RUN" | jq
```

```json
{ "jobId": "a1b2c3d4e5", "ok": true, "result": "4950\n" }
```

If you have an SSH session open you do not need this endpoint at all — `/run` exists for clients
that want one-shot execution without holding a shell.

---

## `DELETE /x402/leases/:id`

Stop the meter. **Alias:** `POST /lease/:id/release`.

Free — closing costs nothing. This is the moment compute is billed, and the only one: nothing was
taken when the session opened, so there is nothing to refund.

```
usedSeconds = wall-clock seconds the sandbox was up
usedAtomic  = ceil(usedSeconds / 3600 × rate)
charged     = min(usedAtomic, balance)   -> taken from the payer's credit
payout      = charged × (1 − PLATFORM_FEE_PCT/100)  -> contributor, on-chain USDC
```

`charged` is clamped to the balance because the watchdog only ticks every `METER_INTERVAL_MS`, so a
session can legitimately overrun its funding by up to one tick. The platform absorbs that; the
contributor is paid out of what was collected, never out of what was merely owed.

| | |
|---|---|
| **Auth** | lease token, required |
| **CORS** | open |
| **Price** | free |

### `200 OK`

```jsonc
{
  "leaseId": "lease_9k2m",
  "usedSeconds": 300,
  "usedAtomic": "83334",
  "chargedAtomic": "83334",             // what was actually taken from credit
  "balance": "916666",                  // payer's credit after the charge
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" }
}
```

Idempotent. `charges.lease_id` is unique, so a concurrent release and watchdog tick cannot bill the
same session twice — the loser returns zeros and the current balance.

### Responses

| Status | `error` | Meaning |
|---|---|---|
| `401` | `invalid or missing lease token` | Token absent, malformed, or for a different lease. |
| `404` | `lease not found` | Already gone. |

---

## `GET /lease/:id`

Lease status. Free.

| | |
|---|---|
| **Auth** | lease token, required |
| **CORS** | `CORS_ORIGIN` |

### `200 OK`

```jsonc
{
  "lease": {
    "id": "lease_9k2m",
    "nodeId": "node_7f2",
    "renterAddr": "AGENT7XYZ…",
    "payerAddr": "AGENT7XYZ…",
    "payToAddr": "CONTRIB…",
    "access": { /* SandboxAccess */ },
    "status": "active",                 // starting | active | ended | failed
    "rateAtomicPerHour": 1000000,
    "gateFeeAtomic": 10000,
    "fundingAtomic": 1000000,
    "paymentTxid": "DEF456…",
    "startedAt": 1785542042000,
    "expiresAt": 1785542942000,
    "graceUntil": null,                 // set once credit runs out — see below
    "createdAt": 1785542040000
  }
}
```

`401` / `404` as above.

---

## `GET /platform`

What the platform charges in and where. Free, no auth. Useful for showing prices before anyone
pays — though you do not need it to pay, since the 402 challenge carries `payTo`, `asset` and
`network` itself.

### `200 OK`

```jsonc
{
  "payTo": "PLATFORM…ADDRESS",
  "network": "algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
  "asset": { "id": "10458941", "decimals": 6, "symbol": "USDC" },
  "facilitatorUrl": "https://facilitator.goplausible.xyz",
  "minTopUpAtomic": 100000,
  "maxTopUpAtomic": 1000000000
}
```

---

## `GET /explorer`

Nodes available to rent. Free, no auth.

### `200 OK`

```jsonc
{
  "nodes": [
    {
      "id": "node_7f2",
      "ownerAddr": "OWNER…",
      "payToAddr": "CONTRIB…",
      "payoutBlocked": false,           // true = payout address never opted into the ASA
      "label": "workstation",
      "cpuCores": 8,
      "ramMb": 32768,
      "gpu": null,
      "pricePerHourUsd": 1.0,
      "status": "online"
    }
  ]
}
```

`payoutBlocked: true` means the contributor's address has not opted into the payment asset, so their
payouts are recorded but unpaid until they do. The node still rents and still works normally.

---

## Error index

| `error` | Status | Where | Notes |
|---|---|---|---|
| `amount_above_maximum` | 400 | topup | carries `maximum` |
| `amount_below_minimum` | 400 | topup | carries `minimum` |
| `facilitator_unavailable` | 502 | all paid | nothing submitted; carries `detail` |
| `invalid_amount` | 400 | topup | carries `detail` |
| `insufficient_credit` | 402 | rent | verified but unfunded; **nothing settled**; carries `detail`, `creditAtomic`, `rateAtomicPerHour` |
| `invalid_ssh_key` | 400 | rent | |
| `invalid or missing lease token` | 401 | lease routes | |
| `lease not active` | 409 | run | |
| `lease not found` | 404 | lease routes | |
| `malformed_payment` | 400 | all paid | header undecodable or not an AVM group |
| `node_busy` | 409 | rent | nothing settled |
| `node_not_found` | 404 | rent | |
| `node_unavailable` | 409 | rent | offline or missed heartbeats |
| `payment_already_used` | 409 | rent, run | carries `txid` |
| `payload (string) required` | 400 | run | |
| `provisioning_failed` | 503 | rent | **nothing settled**; carries `detail` |
| `settlement_failed` | 402 | all paid | carries `detail` |

### The first-run failure

A payment that is built correctly but cannot be *simulated* comes back as a fresh `402` whose
`error` is the facilitator's own message. By far the most common one:

```json
{
  "x402Version": 2,
  "error": "Transaction simulation failed: transaction KOAJRO…: asset 10458941 missing from T42FOE…",
  "accepts": [ … ]
}
```

The paying address has never **opted into** the asset. An Algorand account cannot receive or send
an ASA it has not opted into, and simulation catches that before anything is submitted — so nothing
settled and nothing was charged. Opt in, fund the address, retry the same request.

The sibling of this one is `asset 10458941 missing from <PLATFORM_PAYTO>`, which means the
*server's* address is not opted in. That is an operator problem, not a client one.

### What is safe to retry

| Outcome | Money moved? | Retry? |
|---|---|---|
| `402` with `accepts` | no | yes — pay the amount quoted |
| `402 insufficient_credit` | no | yes — after topping up |
| `402 settlement_failed` | no | yes — with a fresh payment |
| `409 node_busy` | no | yes — another node |
| `409 payment_already_used` | **yes, earlier** | no — build a new payment |
| `503 provisioning_failed` | no | yes — another node |
| `502 facilitator_unavailable` | no | yes — after a pause |

---

## Configuration

Server-side environment variables that change what clients see.

| Variable | Default | Effect |
|---|---|---|
| `X402_NETWORK` | testnet CAIP-2 | Network quoted in every challenge. **Must match the facilitator's `/supported` byte for byte** — checked loudly at boot. |
| `X402_ASSET_ID` | `10458941` | ASA every price is denominated in. |
| `X402_ASSET_DECIMALS` | `6` | |
| `X402_ASSET_SYMBOL` | `USDC` | |
| `X402_FACILITATOR_URL` | `https://facilitator.goplausible.xyz` | Verifies, settles, sponsors fees. |
| `X402_MAX_TIMEOUT_SECONDS` | `60` | `maxTimeoutSeconds` in the challenge. |
| `PLATFORM_PAYTO` | — | `payTo`. Required; must be opted into the asset. |
| `PLATFORM_FEE_PCT` | `1` | Platform's cut of used time; the rest goes to the contributor. |
| `MIN_TOPUP_ATOMIC` | `100000` | 0.10 USDC |
| `MAX_TOPUP_ATOMIC` | `1000000000` | 1000 USDC |
| `DEFAULT_TOPUP_ATOMIC` | `1000000` | Used when `?amount=` is omitted. |
| `FLAT_RENT_ATOMIC` | `10000` | Gate fee to open a session on `POST /rent/:nodeId`. |
| `FLAT_RUN_ATOMIC` | `10000` | Price of one job execution. |
| `MIN_LEASE_SECONDS` | `60` | Least credit (as seconds of runtime) needed to open a session. |
| `SANDBOX_READY_TIMEOUT_MS` | `45000` | Wait before `provisioning_failed`. |
| `CORS_ORIGIN` | `*` | Guards everything **except** the payable routes. |
| `PUBLIC_BASE_URL` | request host | `resource.url` in challenges. |

---

## Renting from the CLI

No browser, no wallet extension, no sign-in. An address holding USDC is the whole account.

### What `curl` can and cannot do

Read this first, because it is the thing that surprises people. Paying an x402 endpoint means
building an Algorand **atomic transaction group**, signing your transaction in it with an ed25519
key, and base64-msgpack encoding the group into `PAYMENT-SIGNATURE`. `curl` cannot do that. There
is no header you can hand-write that stands in for a signature.

| You want to | `curl` alone? |
|---|---|
| List nodes, read prices, check platform config | **yes** — `GET /explorer`, `/platform`, `/metrics`, `/nodes` are free |
| See a price quote before paying | **yes** — the unpaid `POST` returns `402` with the exact amount |
| Read lease status | **yes** — `GET /lease/:id` with the lease token |
| Stop a session | **yes** — `DELETE /x402/leases/:id` is free |
| Top up, rent, or run a job | **no** — those settle a payment and need a signer |

So: everything except the three paid calls is plain HTTP. For those three you need ~20 lines of
JavaScript, below.

### Option A — the bundled agent

The repo ships a working headless renter. It tops up, picks the cheapest node meeting a RAM floor,
opens a session, runs a script inside it, releases, and prints what it was billed.

```bash
npm run keygen                  # prints an Address + AVM_PRIVATE_KEY
# fund that address: opt into ASA 10458941, then use the testnet USDC dispenser
echo 'AVM_PRIVATE_KEY=<base64 64-byte key>' >> .env
echo 'REGISTRY_URL=https://api.your-domain.com' >> .env

npm run client
```

Knobs: `AGENT_TOPUP_ATOMIC` (default `500000` = 0.50 USDC), `AGENT_MIN_RAM_MB` (default `1024`).
Source: [`example-buyer/src/index.ts`](../example-buyer/src/index.ts) — the same code path the
browser runs, differing only in the signer.

### Option B — rent a box and SSH into it

The agent above executes a script and leaves. If what you want is a **shell**, you never touch
`/run` at all: rent, `ssh` in, work, release. Save as `rent.mjs` in a directory with
`@x402/fetch @x402/avm @x402/core algosdk` installed:

```js
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import algosdk from "algosdk";
import { readFileSync } from "node:fs";

const API = process.env.REGISTRY_URL ?? "http://localhost:4000";
const sk = new Uint8Array(Buffer.from(process.env.AVM_PRIVATE_KEY, "base64"));
const address = algosdk.encodeAddress(sk.slice(32));

// Sign only the indexes asked for. The fee-payer transaction in the group is
// left unsigned on purpose — the facilitator signs that one and pays the fee,
// which is why this account needs USDC but no ALGO.
const signer = {
  address,
  async signTransactions(txns, indexes) {
    const wanted = indexes ?? txns.map((_, i) => i);
    return txns.map((b, i) =>
      wanted.includes(i) ? algosdk.decodeUnsignedTransaction(b).signTxn(sk) : null,
    );
  },
};

const { network } = await (await fetch(`${API}/platform`)).json();
const pay = wrapFetchWithPayment(
  fetch,
  new x402Client().register(network, new ExactAvmScheme(signer)),
);

// 1. Buy credit. Renting bills from credit, so this must cover the time you want.
//    Skip it if the address already has a balance.
await pay(`${API}/topup?amount=1000000`, { method: "POST" });   // 1.00 USDC

// 2. Pick a node. Free endpoint — no payment, no auth.
const { nodes } = await (await fetch(`${API}/explorer`)).json();
const node = nodes
  .filter((n) => n.status === "online" && n.ramMb >= 1024)
  .sort((a, b) => a.pricePerHourUsd - b.pricePerHourUsd)[0];
if (!node) throw new Error("no node available");

// 3. Open the session. Send a public key — without a session token it is the
//    only usable auth, since there is no wallet address to use as a password.
const res = await pay(`${API}/rent/${node.id}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    sshPubKey: readFileSync(`${process.env.HOME}/.ssh/id_ed25519.pub`, "utf8").trim(),
  }),
});
if (!res.ok) throw new Error(`rent failed: ${res.status} ${await res.text()}`);
const lease = await res.json();

console.log(lease.ssh.command);                 // ssh root@bore.pub -p 41823
console.log("lease   ", lease.leaseId);
console.log("token   ", lease.leaseToken);      // KEEP THIS — needed to release
console.log("funded  ", lease.fundedUntil);     // when credit runs out at this rate
```

```bash
node rent.mjs
# ssh root@bore.pub -p 41823
```

No key yet? `ssh-keygen -t ed25519` first. Omitting `sshPubKey` falls back to password auth, but
the password is the *session* address — so without signing in there is nothing to log in with. Send
the key.

### Working, then stopping

`leaseToken` is the credential for everything after the rent. Both calls below are free, so plain
`curl` is fine:

```bash
LEASE=lease_9k2m
TOKEN=eyJhbGciOi…

# Is it still up, and how long is it funded for?
curl -s "$API/lease/$LEASE" -H "authorization: Bearer $TOKEN" | jq

# Stop the meter. This is when compute is billed — nothing was taken up front.
curl -s -X DELETE "$API/x402/leases/$LEASE" -H "authorization: Bearer $TOKEN" | jq
# { "usedSeconds": 300, "chargedAtomic": "83334", "balance": "916666", … }
```

**Always release.** If you walk away the watchdog stops the session at `fundedUntil` and bills the
time used, so you cannot be charged past your credit — but the sandbox keeps running (and keeps
billing) until then.

### Things that bite

- **Losing `leaseToken` means you cannot release.** It is returned once and stored nowhere you can
  read back. If you lose it, the session runs until credit is exhausted. Print it, save it.
- **Credit is per address, and the address comes from the settled transaction** — never from
  anything you send. Paying from an exchange withdrawal address credits an account nobody can spend.
- **A headless client cannot read its own balance.** `GET /wallet` needs a session token, which
  needs a signed login. Without one, credit surfaces two ways: `billing.creditAtomic` in a
  successful rent, and the `402 insufficient_credit` body when it is too low.
- **`402 insufficient_credit` is not "pay more"**, it is "top up first". It means the gate fee
  verified but your credit funds less than `MIN_LEASE_SECONDS` at that node's rate. Nothing settled.
- **`409 node_busy` can happen after you paid nothing.** The node is not held while you are away
  paying, so a retry may find it taken. Nothing settled — pick another node.

---

## Client recipes

### Node — the whole flow, no sign-in

```ts
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import algosdk from "algosdk";

const sk = new Uint8Array(Buffer.from(process.env.AVM_PRIVATE_KEY!, "base64"));
const address = algosdk.encodeAddress(sk.slice(32));

// Sign only the transactions asked for — the fee payer's is left for the facilitator.
const signer = {
  address,
  async signTransactions(txns: Uint8Array[], indexes?: number[]) {
    const wanted = indexes ?? txns.map((_, i) => i);
    return txns.map((b, i) =>
      wanted.includes(i) ? algosdk.decodeUnsignedTransaction(b).signTxn(sk) : null,
    );
  },
};

const { network } = await (await fetch(`${API}/platform`)).json();
const client = new x402Client().register(network, new ExactAvmScheme(signer));
const pay = wrapFetchWithPayment(fetch, client);

// Every 402 below is answered automatically.
const top = await (await pay(`${API}/topup?amount=5000000`, { method: "POST" })).json();
const lease = await (await pay(`${API}/rent/${nodeId}`, { method: "POST" })).json();
// lease.fundedUntil — when credit runs out at this rate. Top up and it moves.
const run = await (
  await pay(`${API}/lease/${lease.leaseId}/run`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${lease.leaseToken}` },
    body: JSON.stringify({ payload: "print(1+1)" }),
  })
).json();
await pay(`${API}/x402/leases/${lease.leaseId}`, {
  method: "DELETE",
  headers: { authorization: `Bearer ${lease.leaseToken}` },
});
```

### Browser — same code, different signer

`@txnlab/use-wallet`'s `signTransactions` already matches the signer interface, so only that line
changes:

```ts
const { activeAddress, signTransactions } = useWallet();
const client = new x402Client().register(
  network,
  new ExactAvmScheme({ address: activeAddress!, signTransactions }),
);
const pay = wrapFetchWithPayment(fetch, client);
```

Wallet approvals, end to end:

| Action | Popups |
|---|---|
| Top up | 1 |
| Rent (opens the meter) | 1 |
| Each job execution | 1 |
| Release, SSH, lease status | 0 |

### Testnet setup

1. Fund an account with testnet ALGO from the [dispenser](https://bank.testnet.algorand.network/) —
   needed only to *opt in*, not to pay.
2. Opt that address into ASA `10458941`.
3. Get testnet USDC from the [asset dispenser](https://asset-dispenser.testnet.algorand.network/).
4. From there on the facilitator covers fees, so the account can run to zero ALGO and still pay.
