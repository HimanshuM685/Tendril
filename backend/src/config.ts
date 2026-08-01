import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// The full-genesis-hash spelling, which is what the facilitator's /supported
// advertises. @x402/avm exports a 32-char-truncated variant of the same id;
// they are not interchangeable when matching a facilitator's supported kinds.
import { ALGORAND_TESTNET_CAIP2 } from "@tendril/shared";
import { USDC_TESTNET_ASA_ID } from "@x402/avm";

// Load env from the app's own directory first (highest file priority), then fall
// back to the monorepo-root .env. dotenv never overrides already-set vars, so
// inline env (e.g. `FOO=bar npm run backend`) still wins over both.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv();
loadEnv({ path: resolve(repoRoot, ".env") });

export const config = {
  port: Number(process.env.REGISTRY_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  heartbeatTimeoutMs: Number(process.env.HEARTBEAT_TIMEOUT_MS ?? 30_000),
  // Neon (Postgres) connection string — stores ONLY wallets, top-ups, charges,
  // payouts. Nodes + leases are kept in memory (they're ephemeral).
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Comma-separated list of allowed web origins for CORS; "*" allows all.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  // Algod endpoint used to read balances/opt-ins and submit payouts (public node, no token).
  algodUrl: process.env.ALGOD_TESTNET_URL ?? "https://testnet-api.algonode.cloud",

  // ─────────────────────────────── x402 ───────────────────────────────
  // CAIP-2 network every payment must be on.
  x402Network: process.env.X402_NETWORK ?? ALGORAND_TESTNET_CAIP2,
  // The ASA every price is denominated in. USDC has 6 decimals, so
  // `pricePerHourUsd * 1e6` is the atomic amount — there is no exchange rate.
  assetId: process.env.X402_ASSET_ID ?? USDC_TESTNET_ASA_ID,
  assetDecimals: Number(process.env.X402_ASSET_DECIMALS ?? 6),
  assetSymbol: process.env.X402_ASSET_SYMBOL ?? "USDC",
  // Verifies (simulates) and settles payment groups, and sponsors the network
  // fee, so a client needs the asset but no ALGO.
  facilitatorUrl: process.env.X402_FACILITATOR_URL ?? "https://facilitator.goplausible.xyz",
  // How long a 402 challenge stays payable.
  x402MaxTimeoutSeconds: Number(process.env.X402_MAX_TIMEOUT_SECONDS ?? 60),

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
  // What that flat fee buys. Unused time is still refunded at close.
  flatRentSeconds: Number(process.env.FLAT_RENT_SECONDS ?? 900),
  flatRunAtomic: Number(process.env.FLAT_RUN_ATOMIC ?? 10_000), // 0.01 USDC per job
  // Top-up is NOT flat — the caller names any amount within the bounds below.
  // This is only the fallback for a request that omits `?amount=`.
  defaultTopUpAtomic: Number(process.env.DEFAULT_TOPUP_ATOMIC ?? 1_000_000), // 1.00 USDC

  // ─────────────────────────── Lease bounds ───────────────────────────
  minLeaseSeconds: Number(process.env.MIN_LEASE_SECONDS ?? 60),
  maxLeaseSeconds: Number(process.env.MAX_LEASE_SECONDS ?? 14_400),
  leaseSecondsGranularity: Number(process.env.LEASE_SECONDS_GRANULARITY ?? 60),
  // How long to wait for a contributor's sandbox to come up before giving up
  // and returning 503 — the payment is never settled if this elapses.
  sandboxReadyTimeoutMs: Number(process.env.SANDBOX_READY_TIMEOUT_MS ?? 45_000),
  // How often the watchdog checks active leases for expiry (ms).
  meterIntervalMs: Number(process.env.METER_INTERVAL_MS ?? 10_000),
};
