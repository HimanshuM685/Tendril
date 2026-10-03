# USDC with x402

x402 is an open HTTP payment standard that turns `402 Payment Required` into a machine-readable on-chain payment challenge.

## Payment challenge

An unpaid request to a paid endpoint returns the exact price, network, asset, and payment destination. Prices use integer atomic units, not floating-point dollars: `1000000` equals 1 USDC.

## Sign & retry

The client builds the quoted Algorand transaction group, signs its transfer, and retries with the `PAYMENT-SIGNATURE` header. The contributor API key cannot authorize a payment; payment signing needs a wallet or transaction signer.

## Verify → work → settle

Verification simulates the group without submitting it. The registry provisions the sandbox or performs the job before asking the facilitator to settle. A startup failure returns an error without settling the payment.

Successful settlement is reported in `PAYMENT-RESPONSE`. Payer identity comes from the transaction sender.

## Integrate a client

Use an x402-capable client or the [MCP tools](/docs/build/mcp) to handle challenges and signing. A plain unpaid `curl` demonstrates the challenge; it does not execute paid work.

The [x402 API](/docs/api/x402) covers headers, schemas, client recipes, and errors.
