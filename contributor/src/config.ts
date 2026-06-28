import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Local app .env first, then monorepo-root .env as fallback (see backend config).
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv();
loadEnv({ path: resolve(repoRoot, ".env") });

export const config = {
  registryUrl: process.env.REGISTRY_URL ?? "http://localhost:4000",
  privateKeyB64: process.env.AVM_PRIVATE_KEY ?? "",
  label: process.env.NODE_LABEL ?? "tendril-node",
  // Advertised price per HOUR (USD) — industry-standard hourly billing.
  pricePerHourUsd: Number(process.env.PRICE_PER_HOUR_USD ?? 1.0),
  payToAddr: process.env.PAYTO_ADDR ?? "", // defaults to the signing address
  sandbox: {
    // SSH sandbox image (built locally on first run if missing). The renter gets
    // a plain SSH shell, not a Jupyter server.
    image: process.env.SANDBOX_IMAGE ?? "tendril-ssh-sandbox:latest",
    memory: process.env.SANDBOX_MEMORY ?? "2g",
    cpus: Number(process.env.SANDBOX_CPUS ?? 2),
    gpus: process.env.SANDBOX_GPUS ?? "", // "all" to pass GPUs through
    // bore server the sandbox dials out to, to expose SSH publicly.
    boreServer: process.env.BORE_SERVER ?? "bore.pub",
    // Optional shared secret for a self-hosted bore server (bore reads it from
    // the BORE_SECRET env var). Leave empty for the public bore.pub.
    boreSecret: process.env.BORE_SECRET ?? "",
  },
  // "bore" exposes SSH publicly via an in-container bore tunnel; "local" publishes
  // SSH to loopback (handy when consumer + agent run on the same machine).
  tunnelMode: (process.env.TUNNEL_MODE ?? "bore") as "bore" | "local",
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS ?? 10_000),
};
