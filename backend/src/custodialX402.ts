import { x402Client } from "@x402/core/client";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import { normalizeAlgorandNetwork } from "@x402/avm";
import { wrapFetchWithPayment } from "@x402/fetch";
import { networkDefaults } from "@tendril/shared";
import { config } from "./config.js";
import { accountFromUser, signTransactions, type CustodialAccount } from "./custodialWallet.js";
import type { DbUser } from "./db.js";

const net = networkDefaults(config.network);

/**
 * A fetch that pays x402 challenges with a custodial account's key.
 * Used server-side for Google users after explicit browser confirmation.
 */
export function custodialPayingFetch(
  account: CustodialAccount,
): typeof globalThis.fetch {
  const sign = (txns: Uint8Array[], indexes?: number[]) =>
    Promise.resolve(signTransactions(account, txns, indexes));
  const scheme = new ExactAvmScheme(
    { address: account.address, signTransactions: sign },
    { algodUrl: config.algodUrl },
  );
  const client = new x402Client()
    .register(net.caip2, scheme)
    .register(normalizeAlgorandNetwork(net.caip2), scheme);
  return wrapFetchWithPayment(fetch, client) as typeof globalThis.fetch;
}

export function custodialPayingFetchForUser(user: DbUser): typeof globalThis.fetch {
  return custodialPayingFetch(accountFromUser(user));
}

/** Registry base URL for self-calls (x402 top-up, rent, run). */
export function registryBaseUrl(): string {
  if (config.publicBaseUrl) return config.publicBaseUrl.replace(/\/$/, "");
  return `http://127.0.0.1:${config.port}`;
}
