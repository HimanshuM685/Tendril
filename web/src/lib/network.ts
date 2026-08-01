import { networkDefaults } from "@tendril/shared";

/**
 * The chain the web app talks to, from `VITE_ALGORAND_NETWORK` (testnet |
 * mainnet, default testnet). Vite inlines this at build time, so a deployed
 * bundle is pinned to one network — set it in the build environment, not at
 * runtime.
 *
 * This must match the backend's `ALGORAND_NETWORK`. If it doesn't, the registry
 * quotes a 402 on one chain and the wallet signs on another; the payment fails
 * to verify rather than going somewhere wrong, but the error is opaque, so
 * `NETWORK_MISMATCH_HINT` is worth showing when a payment won't verify.
 */
export const network = networkDefaults(
  import.meta.env.VITE_ALGORAND_NETWORK as string | undefined,
);

/** Per-value overrides, for a private algod or a self-hosted explorer. */
export const ALGOD_URL =
  (import.meta.env.VITE_ALGOD_URL as string | undefined) ?? network.algodUrl;

export const EXPLORER_URL =
  (import.meta.env.VITE_EXPLORER_URL as string | undefined) ?? network.explorerUrl;
