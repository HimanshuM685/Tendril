import { createServer } from "node:http";
import express, { type NextFunction, type Request, type Response } from "express";
import { config } from "./config.js";
import { router } from "./routes.js";
import { initDb } from "./db.js";
import { initWs } from "./ws.js";
import { startWatchdog } from "./leases.js";
import { allowedOrigin, corsPolicy } from "./x402/cors.js";
import { checkFacilitator, checkDiscoveryConfig } from "./x402/server.js";

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
app.use(express.json({ limit: "2mb" }));

// One line per request, with the duration. Paid requests are slow by nature —
// verify, provision, settle — so when a client reports "failed to fetch" the
// only way to tell a hang from a rejection from a timeout is to see the timing.
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const paid = req.header("payment-signature") ?? req.header("x-payment") ? " [paid]" : "";
    console.log(
      `[http] ${req.method} ${req.originalUrl} -> ${res.statusCode}${paid} ${Date.now() - started}ms`,
    );
  });
  next();
});

app.use((req, _res, next) => {
  if (req.url.startsWith("//")) req.url = req.url.replace(/^\/+/, "/");
  next();
});

app.use(router);

/**
 * Anything a handler threw. Without this a rejected async handler in express 4
 * leaves the request open until the client times out — and on a payment route
 * that means the wallet has signed, the money may have moved, and the caller
 * sees only "Failed to fetch". A 500 they can read is strictly better.
 */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[registry] ${req.method} ${req.originalUrl} failed:`, err);
  if (res.headersSent) return; // a payment receipt may already be on the wire
  res.status(500).json({ error: "internal_error", detail: err.message });
});

async function main(): Promise<void> {
  await initDb();

  // Loud at boot rather than opaque at the first payment: confirms the
  // facilitator speaks our network and tells us who sponsors the fees.
  await checkFacilitator();
  await checkDiscoveryConfig();

  const httpServer = createServer(app);
  initWs(httpServer, corsOrigin);
  startWatchdog();

  httpServer.listen(config.port, () => {
    console.log(`[registry] listening on http://localhost:${config.port}`);
    console.log(`[registry] Neon Postgres connected (credit ledger only); watchdog every ${config.meterIntervalMs}ms`);
    console.log(`[registry] x402 → ${config.platformPayTo || "(PLATFORM_PAYTO not set!)"} in asset ${config.assetId} (${config.assetSymbol}) on ${config.x402Network}`);
    console.log(`[registry] facilitator ${config.facilitatorUrl}`);
    console.log(`[registry] payouts ${config.platformPrivateKey ? "enabled" : "DISABLED (set PLATFORM_PRIVATE_KEY)"}, platform fee ${config.platformFeePct}%`);
    console.log(
      `[registry] modal hosted ${config.modalTokenId && config.modalTokenSecret ? "enabled" : "off (set MODAL_TOKEN_ID and MODAL_TOKEN_SECRET)"}`,
    );
  });
}

main().catch((err) => {
  console.error("[registry] failed to start:", err);
  process.exit(1);
});
