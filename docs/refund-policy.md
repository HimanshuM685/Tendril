# Tendril Refund Policy

Last updated: 2026-10-19

This policy explains how failed work and prepaid credit are handled. It is a
product policy and is not legal advice. Replace the contact placeholder before
publication.

## 1. Prepaid credit

USDC top-ups become prepaid Tendril credit in an off-chain ledger. Credit is a
usable service balance, not a refundable on-chain deposit, bank balance, or
interest-bearing instrument. If you have not used eligible credit, it remains
available for eligible Tendril services, subject to account limits, suspension,
expiry rules if later disclosed, and applicable law.

Tendril does not claim to provide a chain-level refund path for a settled
Algorand transfer. On-chain payments may be irreversible. Contact Tendril
promptly about an error; do not assume that a wallet, facilitator, asset
issuer, or blockchain can reverse a confirmed transfer.

## 2. Provisioning failures

For a metered rent session, Tendril verifies the payment, provisions the
sandbox, and settles the 0.01 USDC gate fee only after the sandbox is ready. If
provisioning fails before settlement, no gate fee settles and no usage credit
is charged. Retry with another available node when the response says the
request is safe to retry.

For a one-shot run without an existing lease, the 0.01 USDC job gate fee is
settled before provisioning so the signed payment remains valid during a long
startup. If provisioning then fails, the gate fee remains settled, but no
execution seconds are billed because no execution window started.

For a notebook job, the same ordering means a provisioning failure after gate
fee settlement leaves the gate fee settled and leaves execution-time credit
uncharged. The job result reports the failure through its polling endpoint.

## 3. Run failures and actual usage

Execution failure, timeout, or a failed program is not automatically a refund
when compute actually ran. Tendril closes the run and bills the seconds the
sandbox actually ran at the selected node's rate. A failed result can therefore
include an execution charge. A run that fails before execution starts does not
receive an execution-time charge; its already-settled gate fee, if any, is not
automatically reversed.

For a job executed inside an existing lease, the job's gate payment is settled
after execution succeeds. If execution fails before that settlement, the job
gate fee is not settled, while the existing lease remains governed by its own
meter and close rules.

## 4. Grace and lease close

When prepaid credit runs out, the watchdog may provide a grace window worth the
configured grace amount at the node's rate. Grace is an opportunity to save
work, not a new credit grant. Only seconds the sandbox actually runs enter the
close calculation, and the session charge is limited by the remaining ledger
balance. There is no separate grace refund because unused grace was never
charged.

Releasing a session bills actual elapsed sandbox seconds once. If nothing was
taken up front for usage, there is no unused usage charge to refund. Duplicate
close attempts do not create duplicate charges.

## 5. Contributor withdrawals

Contributor earnings accrue at lease close and are withdrawn in one on-chain
transfer after the 5.00 USDC minimum is met. Tendril debits the earnings ledger
before sending to prevent double payment. If the on-chain send is known to have
failed, Tendril restores the debited balance and records the failed attempt.

If a transfer is confirmed on-chain, Tendril cannot promise reversal. Verify the
destination address and asset opt-in before withdrawing.

## 6. Contact and disputes

For a suspected duplicate charge, incorrect usage duration, failed provisioning
outcome, or withdrawal problem, preserve the request id, job or lease id,
transaction id, and response, then contact **[support contact to be added]**.
Do not send private keys, seed phrases, API keys, or other secrets in a support
request.
