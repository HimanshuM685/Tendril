import algosdk from "algosdk";

/**
 * Generate a fresh Algorand account and print it in the format Tendril expects.
 * Fund the address with testnet ALGO before using it (payments are native ALGO).
 *
 *   npm run keygen
 */
const account = algosdk.generateAccount();
const privateKeyB64 = Buffer.from(account.sk).toString("base64");

console.log("Address:        ", account.addr.toString());
console.log("AVM_PRIVATE_KEY=", privateKeyB64);
console.log("\nNext steps:");
console.log("  1. Fund the address with testnet ALGO:  https://bank.testnet.algorand.network/");
console.log("  2. Put AVM_PRIVATE_KEY in your .env. (Payments are native ALGO — no USDC opt-in.)");
