import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// networkDefaults carries the full-genesis-hash CAIP-2 spelling, which is what
// the facilitator's /supported advertises. @x402/avm exports a 32-char-truncated
// variant of the same id; they are not interchangeable when matching a
// facilitator's supported kinds.
import { networkDefaults } from "@tendril/shared";

// Load env from the app's own directory first (highest file priority), then fall
// back to the monorepo-root .env. dotenv never overrides already-set vars, so
// inline env (e.g. `FOO=bar npm run backend`) still wins over both.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv();
loadEnv({ path: resolve(repoRoot, ".env") });

// One switch for the chain. Every network-dependent default below comes from
// here, so testnet/mainnet can't be half-applied; the individual vars still
// override for a private algod or a non-USDC asset. Throws at import on an
// unrecognised name rather than quietly running testnet.
const net = networkDefaults(process.env.ALGORAND_NETWORK);

/** The algod override for the network we're actually on, if one is set. */
function networkAlgodUrl(): string | undefined {
  return net.network === "mainnet" ? process.env.ALGOD_MAINNET_URL : process.env.ALGOD_TESTNET_URL;
}

export const config = {
  /** "testnet" | "mainnet" — what ALGORAND_NETWORK resolved to. */
  network: net.network,
  port: Number(process.env.REGISTRY_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  heartbeatTimeoutMs: Number(process.env.HEARTBEAT_TIMEOUT_MS ?? 30_000),
  // Neon (Postgres) connection string — stores ONLY wallets, top-ups, charges,
  // payouts. Nodes + leases are kept in memory (they're ephemeral).
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Comma-separated list of allowed web origins for CORS; "*" allows all.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Algod endpoint used to read balances/opt-ins and submit payouts (public node, no token).
  // ALGOD_URL overrides on any network. The network-named vars are deliberately
  // scoped to their own network — a leftover ALGOD_TESTNET_URL must not quietly
  // pin a mainnet deployment to testnet algod (and @x402/avm reads these two for
  // its own defaults, so the names stay meaningful).
  algodUrl: process.env.ALGOD_URL ?? networkAlgodUrl() ?? net.algodUrl,

  // ─────────────────────────────── x402 ───────────────────────────────
  // CAIP-2 network every payment must be on.
  x402Network: process.env.X402_NETWORK ?? net.caip2,
  // The ASA every price is denominated in. USDC has 6 decimals, so
  // `pricePerHourUsd * 1e6` is the atomic amount — there is no exchange rate.
  assetId: process.env.X402_ASSET_ID ?? net.asset.id,
  assetDecimals: Number(process.env.X402_ASSET_DECIMALS ?? net.asset.decimals),
  assetSymbol: process.env.X402_ASSET_SYMBOL ?? net.asset.symbol,
  // Verifies (simulates) and settles payment groups, and sponsors the network
  // fee, so a client needs the asset but no ALGO.
  facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://facilitator.goplausible.xyz",
  // How long a 402 challenge stays payable.
  x402MaxTimeoutSeconds: Number(process.env.X402_MAX_TIMEOUT_SECONDS ?? 60),

  // ────────────────────── Bazaar discovery / branding ──────────────────────
  // Tag every resource carries. The facilitator uses it to attribute activity,
  // so the challenge tag has to be present for challenge tracking to see us.
  x402Tag: process.env.X402_TAG ?? "x402-global-challenge",
  // Extra categorisation tags (comma-separated). 5 tags total, 32 chars each.
  x402ExtraTags: (process.env.X402_EXTRA_TAGS ?? "compute,ssh,sandbox")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
  // How the API is named and pictured in the Bazaar dashboard. The icon must be
  // a publicly reachable http(s) URL or the facilitator drops it.
  // Must match the <title>/og:site_name the web app serves — the facilitator
  // takes the name from whichever it sees, so they should not disagree.
  serviceName: process.env.X402_SERVICE_NAME ?? "TENDRIL",
  serviceIconUrl: process.env.X402_ICON_URL ?? "",
  // Absolute base URL this registry is reachable at. Discovery canonicalises on
  // the origin, so behind a proxy this must be the PUBLIC url, not localhost.
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",

  // Algorand address that receives x402 payments. REQUIRED in production.
  platformPayTo: process.env.PLATFORM_PAYTO ?? "",
  // Base64 64-byte secret key for PLATFORM_PAYTO — signs on-chain contributor
  // payouts. REQUIRED for payouts to work; safeguard it (it custodies funds).
  platformPrivateKey: process.env.PLATFORM_PRIVATE_KEY ?? "",
  // Platform's percentage cut of each charge; the rest is paid to the contributor.
  platformFeePct: Number(process.env.PLATFORM_FEE_PCT ?? 1),

  // ─────────────────────────── Amount bounds ───────────────────────────
  // All in atomic units of the asset above.
  minTopUpAtomic: Number(process.env.MIN_TOPUP_ATOMIC ?? 100_000), // 0.10 USDC
  maxTopUpAtomic: Number(process.env.MAX_TOPUP_ATOMIC ?? 1_000_000_000), // 1000 USDC
  // Least a contributor may withdraw at once. Earnings accrue as a balance and
  // move on-chain only here, so a floor keeps one transfer from costing more in
  // fees + attention than it is worth.
  minWithdrawAtomic: Number(process.env.MIN_WITHDRAW_ATOMIC ?? 5_000_000), // 5.00 USDC
  // Floor on what an *unauthenticated* rent must pay on-chain, no matter how
  // much credit the hinted address has. Paying proves control of that address;
  // without this floor, `?payer=<victim>` would drain a stranger's balance.
  minPayableAtomic: Number(process.env.MIN_PAYABLE_ATOMIC ?? 10_000), // 0.01 USDC

  // ──────────────────── Flat-price routes ("pay to execute") ────────────────────
  // A second, simpler way to buy: one fixed price per call, no quote, no credit
  // arithmetic. `POST /rent/:nodeId` and `POST /lease/:id/run` answer 402 with
  // exactly this amount, and on payment do the ordinary thing. The metered
  // /x402/rent is unchanged and still there for callers who want prorating.
  flatRentAtomic: Number(process.env.FLAT_RENT_ATOMIC ?? 10_000), // 0.01 USDC
  flatRunAtomic: Number(process.env.FLAT_RUN_ATOMIC ?? 10_000), // 0.01 USDC per job
  // Top-up is NOT flat — the caller names any amount within the bounds below.
  // This is only the fallback for a request that omits `?amount=`.
  defaultTopUpAtomic: Number(process.env.DEFAULT_TOPUP_ATOMIC ?? 1_000_000), // 1.00 USDC

  // ────────────────────── Sandbox tunnel (sent to agents) ──────────────────────
  // The bore server a contributor's sandbox dials out to, to expose SSH. Handed
  // to the agent in the hello ack so a contributor never configures a tunnel:
  // the platform picks it, and can move everyone at once.
  boreServer: process.env.BORE_SERVER ?? "bore.pub",
  // Shared secret for a self-hosted bore server; empty for the public bore.pub.
  boreSecret: process.env.BORE_SECRET ?? "",

  // ─────────────────────────── Lease bounds ───────────────────────────
  // Least credit a renter must hold to open a session, as seconds of runtime at
  // the node's rate. Below this the gate fee would buy a session the watchdog
  // kills almost immediately.
  minLeaseSeconds: Number(process.env.MIN_LEASE_SECONDS ?? 60),
  // How long to wait for a contributor's sandbox to come up before giving up
  // and returning 503 — the payment is never settled if this elapses.
  sandboxReadyTimeoutMs: Number(process.env.SANDBOX_READY_TIMEOUT_MS ?? 45_000),
  // Hard ceiling on one `/x402/run` job. It is also the cost ceiling on a
  // leaseless run, since the sandbox is destroyed the moment the job ends.
  runTimeoutMs: Number(process.env.RUN_TIMEOUT_MS ?? 120_000),
  // How often the watchdog checks active leases for expiry (ms).
  meterIntervalMs: Number(process.env.METER_INTERVAL_MS ?? 10_000),
  // Runtime handed to a renter whose credit has run out, so they can save their
  // work before the sandbox is destroyed — in atomic units, converted to seconds
  // at that lease's own rate. A cheap node therefore gets a long window and an
  // expensive one a short one, which is the same dollar of goodwill either way.
  // The platform absorbs it: the close bills at most the remaining balance.
  graceAtomic: Number(process.env.GRACE_ATOMIC ?? 1_000_000), // 1.00 USDC

  // ─────────────────────── Google OAuth custodial login ───────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  /** First origin from CORS_ORIGIN, or explicit WEB_ORIGIN. */
  webOrigin: (() => {
    const explicit = process.env.WEB_ORIGIN?.trim();
    if (explicit) return explicit.replace(/\/$/, "");
    const cors = process.env.CORS_ORIGIN ?? "*";
    if (cors === "*") return "http://localhost:5173";
    return cors.split(",")[0]?.trim().replace(/\/$/, "") ?? "http://localhost:5173";
  })(),
  walletEncryptionKey: process.env.WALLET_ENCRYPTION_KEY ?? "",
};

export function googleAuthEnabled(): boolean {
  return !!(
    config.googleClientId &&
    config.googleClientSecret &&
    config.googleRedirectUri &&
    config.walletEncryptionKey
  );
}
