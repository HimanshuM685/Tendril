# Tendril Terms of Service

Last updated: 2026-10-20

These Terms describe use of Tendril's compute marketplace. They are a product
description and an agreement template; they are not legal advice. Confirm the
contact mailbox and have counsel review before publishing.

## 1. Service

Tendril is a best-effort, per-second compute marketplace. Depending on the
deployment, compute may come from hosted infrastructure such as Modal or from
nodes operated by independent contributors. Hosted notebook capacity and
contributor-run nodes may have different surfaces, availability, prices, and
limits.

Tendril is not a bank, investment account, or provider of guaranteed compute
capacity. The service does not pay interest and does not maintain segregated
deposit accounts. For custodial accounts, Tendril holds and signs with a
platform-managed Algorand wallet. Prepaid credit is an off-chain service ledger,
not a bank balance or an investment product.

## 2. Identity and accounts

An Algorand wallet address is used as payment and credit identity for wallet
flows. A settled payment credits the address that sent it; access to that
address's credit requires the ability to sign for it. Where email or Google
sign-in is enabled, Tendril creates a platform-managed Algorand wallet for the
account. The platform may hold and sign with that wallet to perform actions you
explicitly approve.

Do not send funds from an exchange or another address you cannot sign for: the
resulting credit may not be spendable by you. Tendril does not promise that no
identity, sanctions, tax, or other compliance checks will ever apply.

## 3. Prepaid credit and payments

USDC payments on Algorand buy prepaid, off-chain Tendril credit. The default
top-up bounds are 0.10 USDC minimum and 1000 USDC maximum per top-up, subject to
deployment configuration. Credit is recorded in Tendril's ledger and is usable
for eligible Tendril services; it is not an on-chain deposit, does not earn
interest, and is not itself a token or claim on a segregated account.

The same settled payment cannot be credited twice. Tendril records payment
identity and rejects or idempotently handles replays according to the endpoint;
a replay does not create duplicate credit or a second paid action.

On-chain transfers are made to the platform address shown in the payment
request. Except where this policy expressly says otherwise, Tendril does not
promise a chain-level refund or reversal of a settled transfer. Network,
facilitator, wallet, and asset-issuer rules can also affect a payment.

## 4. Prices and billing

Prices are shown by the applicable API response or UI and may vary by node,
provider, deployment, and configuration. Current default examples are:

- 0.01 USDC on-chain gate fee to open a metered rent session;
- per-second rent at the selected contributor node's advertised rate;
- 0.01 USDC on-chain gate fee per one-shot run job, plus execution time from
  prepaid credit;
- 0.10 USDC on-chain fee to mint a contributor API key; and
- contributor node time at the node's advertised rate, less a 1% platform fee
  on collected usage by default.

For a metered session, the gate fee is separate from usage. Tendril starts the
meter when the sandbox is ready and closes it on release, watchdog close, or
another terminal event. The close calculation uses the seconds the sandbox
actually ran, prorated at the node rate. A session charge is capped by available
credit; a leaseless code run can be charged for its actual execution and may
leave a negative credit balance that must be topped up before further use.

When credit runs out, an idle watchdog may allow a grace window worth 1.00 USDC
at that node's rate before force-closing the sandbox, subject to deployment
configuration. Grace is not purchased credit or a promise of additional free
capacity. It exists to save work. Only seconds the sandbox actually runs enter
the close calculation, and a session cannot be charged beyond the credit the
ledger permits.

## 5. Contributor earnings

For contributor-run nodes, collected usage is credited to the contributor's
earnings ledger when the lease closes. Earnings are not sent on-chain per lease.
The contributor may withdraw the full available balance once it reaches the
5.00 USDC minimum and the payout address has opted into the payment asset, if
withdrawals are enabled for the deployment. If Tendril determines that an
on-chain send failed before completion, it restores the debited earnings
balance and records the failed attempt. A confirmed send is recorded with its
transaction id, but a process failure or uncertain chain result may require
manual reconciliation and is not guaranteed to restore automatically.

Contributors must operate only software and hardware they control, keep their
daemon and runtime supported, accurately advertise capacity and price, protect
their API key, maintain required network connectivity, and avoid tampering with
or accessing renter workloads. Tendril may suspend a node or account for abuse,
material misrepresentation, security risk, or non-payment risk.

## 6. Acceptable use

You may not use Tendril to violate law or third-party rights; distribute
malware, credentials, or illegal content; attack, scan, or disrupt networks or
systems without authorization; evade access controls; mine cryptocurrency;
infringe intellectual property; process regulated data without an appropriate
agreement; or interfere with another user's compute, privacy, or availability.

You are responsible for code, data, packages, secrets, credentials, outputs,
and network activity you send through the service. Do not place secrets in
workloads unless you accept the risks of shared or third-party infrastructure.

## 7. Availability and security

Tendril is provided on a best-effort basis with no uptime, performance,
durability, backup, or availability SLA. Nodes can disappear, restart, become
unreachable, or be reclaimed. Sandboxes are intended to provide isolation, but
no hosted or contributor-run environment is guaranteed secure or error-free.
Keep your own copies of important inputs and outputs.

## 8. Suspension and termination

Tendril may reject work, limit spend, suspend access, stop a node, or terminate
a session when required for safety, capacity, maintenance, legal compliance,
payment risk, or violation of these Terms. Closing a session does not reverse a
settled on-chain gate fee. Any remaining eligible prepaid credit remains subject
to the Refund Policy and applicable law.

## 9. Disclaimers and liability

To the maximum extent permitted by law, Tendril is provided as-is and as
available, without implied warranties of merchantability, fitness, title,
non-infringement, uninterrupted service, or suitability for a particular
workload. You use third-party nodes and hosted providers at your own risk.

To the maximum extent permitted by law, Tendril and its operators will not be
liable for indirect, incidental, special, consequential, exemplary, or lost
profit, revenue, data, goodwill, or business losses. The aggregate liability
cap for claims arising from the service is the greater of the amount you paid
Tendril for the affected service during the six months before the event or
100.00 USDC, except to the extent a limitation is prohibited by law.

## 10. Changes and contact

Tendril may change these Terms, prices, limits, providers, or features. The
updated version will carry a new last-updated date. Continued use after an
effective update means you accept the updated Terms to the extent allowed by
law.

Contact: **legal@tendrilhq.com** or the Tendril GitHub repository. Confirm that
this mailbox is monitored before publication.
