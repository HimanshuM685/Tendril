import { networkDefaults } from "@tendril/shared";

/**
 * The chain the web app talks to, from `NEXT_PUBLIC_ALGORAND_NETWORK` (testnet |
 * mainnet, default testnet). Next.js inlines this at build time, so a deployed
 * bundle is pinned to one network — set it in the build environment, not at
 * runtime.
 *
 * Next.js inlines this public value at build time. This must match the backend's
 * `ALGORAND_NETWORK`. If it doesn't, the registry
 * quotes a 402 on one chain and the wallet signs on another; the payment fails
 * to verify rather than going somewhere wrong, but the error is opaque, so
 * `NETWORK_MISMATCH_HINT` is worth showing when a payment won't verify.
 */
export const network = networkDefaults(
  process.env.NEXT_PUBLIC_ALGORAND_NETWORK,
);

/** Per-value overrides, for a private algod or a self-hosted explorer. */
export const ALGOD_URL =
  process.env.NEXT_PUBLIC_ALGOD_URL ?? network.algodUrl;

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ?? network.explorerUrl;
