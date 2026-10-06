# Algorand settlement basics

Tendril prices compute in USDC and settles payments on Algorand. Start by discovering the network and asset from the registry.

## Discover the network

`GET /platform` returns the registry's payment address, CAIP-2 network identifier, USDC asset ID, and facilitator URL. Clients should use these values rather than hard-code a different network.

```bash
curl -s "$API/platform"
```

## Prepare USDC

Algorand USDC uses six decimal places: `1000000` atomic units equals 1 USDC. Testnet and mainnet use different asset IDs. Your paying wallet must be opted into the configured asset and hold enough USDC for the quoted payment.

## Pay with sponsored fees

The x402 facilitator sponsors the payment transaction group's network fee. The client signs its USDC transfer; the facilitator signs the fee-payer transaction and submits the group after successful work.

For settlement ordering, prepaid accounting, and withdrawals, continue to [Algorand Settlement](/docs/concepts/algorand-settlement) or the [x402 API](/docs/api/x402#how-payment-works).
