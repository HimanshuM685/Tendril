import algosdk from "algosdk";

/**
 * Generate a fresh Algorand account for the **platform** wallet — the one that
 * receives x402 payments and signs contributor withdrawals.
 *
 * Contributors do not need this: they authenticate with an API key minted in the
 * web app, and are paid to the wallet they signed in with.
 *
 *   npm run keygen
 */
const account = algosdk.generateAccount();
const privateKeyB64 = Buffer.from(account.sk).toString("base64");

console.log("Address:            ", account.addr.toString());
console.log("PLATFORM_PRIVATE_KEY=", privateKeyB64);
console.log("\nNext steps:");
console.log("  1. Set PLATFORM_PAYTO to the address above, and the key as PLATFORM_PRIVATE_KEY.");
console.log("  2. Fund it with ALGO for fees:  https://bank.testnet.algorand.network/");
console.log("  3. Opt it into the payment asset (USDC) so it can hold and send it.");
