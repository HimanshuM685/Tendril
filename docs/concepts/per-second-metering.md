# Per-Second Metering

Nodes advertise an hourly USD rate, while Tendril tracks the seconds actually used. USDC-denominated pricing avoids an exchange-rate conversion during billing.

## Usage calculation

Runtime is tracked continuously. The basic proportional charge is:

```text
usage_usdc = price_per_hour_usd × elapsed_seconds / 3600
```

The registry reconciles usage when the lease closes. Opening a metered session also incurs the quoted gate fee.

## Charged once

Per-second tracking does not mean a separate debit or blockchain transaction each second. Usage is charged once at lease end and contributor earnings are credited to the off-chain ledger.

## Grace window

If prepaid credit runs out mid-session, a $1.00 goodwill runtime window gives the renter time to save work before termination. Its duration depends on the selected machine's hourly rate.

## One-shot jobs & payouts

A one-shot script is not killed mid-run solely because credit is exhausted. An overdrawn balance can remain negative until topped up. Contributors receive earnings after the configured platform fee and can withdraw them on-chain.

Use [GET /wallet](/docs/api#get-wallet) for balance and charge history, and [lease status](/docs/api#get-leaseid) to inspect a session.
