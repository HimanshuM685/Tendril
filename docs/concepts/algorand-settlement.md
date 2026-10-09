# Algorand Settlement

Algorand provides deterministic block finality without chain reorganizations. Deposits and contributor withdrawals use standard USDC asset transfers on the configured network.

## Network & asset

Algorand USDC uses ASA `10458941` on testnet and `31566704` on mainnet, with six decimals. Discover the active configuration through `GET /platform`; a client must sign for the same network and asset as the registry.

## Deposits & prepaid credit

The facilitator verifies a payment claim, then settles the transaction group after successful work. The registry credits the settled sender's prepaid balance. Idempotent deposit handling prevents the same payment from creating credit twice.

Balances and charge history live in the off-chain Neon ledger. Each second of runtime does not create a separate on-chain transaction.

## Sponsored transaction fees

The client signs its USDC transfer. The facilitator signs the transaction that covers the group's network fee. Renters need USDC but no ALGO for these sponsored payments.

## Contributor withdrawals

Lease closure credits contributor earnings. Contributors withdraw from the **Contribute** page once the configured minimum is met; the default minimum is 5 USDC. The receiving wallet must be opted into the payment asset.

See [POST /withdraw](/docs/api#post-withdraw) for requirements and errors, and [x402 payment flow](/docs/api/x402#how-payment-works) for transaction ordering.
