/**
 * Who may call what, from a browser.
 *
 * The payable routes are open to **any** origin. A paid endpoint does not need
 * an allowlist to protect it — the 402 does that job, and the price is the same
 * whoever asks. Everything else (sign-in, the credit ledger, metrics, node
 * registration) stays behind `CORS_ORIGIN`.
 *
 * This only constrains browsers. A headless agent ignores CORS entirely, so the
 * restriction never stood between an agent and these endpoints; opening them
 * means a *browser* on any origin is as much a first-class client as the Tendril
 * web app is.
 */
import cors from "cors";
import type { Request } from "express";
import { config } from "../config.js";

/** Routes that answer 402, and are therefore open to everyone. */
const PAYABLE_PATHS = [
  /^\/(x402\/)?topup$/, // POST — buy credit, any amount
  /^\/x402\/(rent|run|keys)$/, // POST — the canonical paid endpoints
  /^\/(x402\/)?rent\/[^/]+$/, // POST — legacy per-node alias
  /^\/lease\/[^/]+\/(run|release)$/, // POST — legacy alias / close early
  /^\/x402\/leases\/[^/]+$/, // DELETE — close early
];

/** Headers a browser must be able to read, or a paid response looks unpaid. */
export const X402_HEADERS = ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE", "X-PAYMENT-RESPONSE"];

/** True if `path` is one of the payable routes. */
export function isPayablePath(path: string): boolean {
  return PAYABLE_PATHS.some((re) => re.test(path));
}

/** `CORS_ORIGIN` as the cors package wants it: "*" or a list. */
export function allowedOrigin(): string | string[] {
  return config.corsOrigin === "*" ? "*" : config.corsOrigin.split(",").map((s) => s.trim());
}

/** The CORS middleware: open on the payable routes, `CORS_ORIGIN` everywhere else. */
export function corsPolicy() {
  const restricted = allowedOrigin();
  // Typed to express's Request so the delegate can read `req.path`; the cors
  // package itself only promises {method, headers}.
  return cors<Request>((req, done) => {
    done(null, {
      origin: isPayablePath(req.path) ? "*" : restricted,
      // The V2 payment header is non-simple, so a browser preflights every paid
      // request. Naming it explicitly keeps that working under a strict origin.
      // `access-control-expose-headers` is here because @x402/fetch sets it as
      // a *request* header on the paid retry — the browser preflights it, and
      // without it in allowedHeaders the preflight fails silently ("Failed to fetch").
      allowedHeaders: ["content-type", "authorization", "payment-signature", "x-payment", "access-control-expose-headers"],
      exposedHeaders: X402_HEADERS,
    });
  });
}
