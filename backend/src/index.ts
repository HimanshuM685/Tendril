import { createServer } from "node:http";
import express from "express";
import { config } from "./config.js";
import { router } from "./routes.js";
import { initDb } from "./db.js";
import { initWs } from "./ws.js";
import { startWatchdog } from "./leases.js";
import { allowedOrigin, corsPolicy } from "./x402/cors.js";
import { checkFacilitator } from "./x402/server.js";

// A billing/payment error must never take down the registry.
process.on("unhandledRejection", (reason) => {
  console.error("[registry] unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[registry] uncaughtException:", err);
});

const corsOrigin = allowedOrigin();

const app = express();
app.use(corsPolicy());
app.use(express.json());
app.use(router);

async function main(): Promise<void> {
  await initDb();

  // Loud at boot rather than opaque at the first payment: confirms the
  // facilitator speaks our network and tells us who sponsors the fees.
  await checkFacilitator();

  const httpServer = createServer(app);
  initWs(httpServer, corsOrigin);
  startWatchdog();

  httpServer.listen(config.port, () => {
    console.log(`[registry] listening on http://localhost:${config.port}`);
    console.log(`[registry] Neon Postgres connected (credit ledger only); watchdog every ${config.meterIntervalMs}ms`);
    console.log(`[registry] x402 → ${config.platformPayTo || "(PLATFORM_PAYTO not set!)"} in asset ${config.assetId} (${config.assetSymbol}) on ${config.x402Network}`);
    console.log(`[registry] facilitator ${config.facilitatorUrl}`);
    console.log(`[registry] payouts ${config.platformPrivateKey ? "enabled" : "DISABLED (set PLATFORM_PRIVATE_KEY)"}, platform fee ${config.platformFeePct}%`);
  });
}

main().catch((err) => {
  console.error("[registry] failed to start:", err);
  process.exit(1);
});
