/**
 * Self-check for Bazaar discovery. Run: npx tsx backend/src/x402/discovery.test.ts
 *
 * This is worth a test because the failure is silent. A malformed discovery
 * extension does not fail a payment, does not error, and does not log anything
 * on our side — the facilitator calls `console.warn` on its own machine and
 * drops the resource. The endpoint keeps earning and never appears in the
 * catalog, which looks exactly like "discovery is just slow".
 *
 * So we validate with the same functions the facilitator uses.
 */
import assert from "node:assert/strict";
import {
  extractDiscoveryInfo,
  validateDiscoveryExtension,
  type DiscoveredHTTPResource,
} from "@x402/extensions";
import type { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import { ROUTES, discoveryExtensions, serviceMetadata } from "./discovery.js";
import { resourceUrl } from "./server.js";

const service = serviceMetadata();

/** Rebuild what a v2 client sends back: `resource` + `extensions` copied verbatim. */
function payloadFor(route: (typeof ROUTES)[keyof typeof ROUTES], url: string): PaymentPayload {
  return {
    x402Version: 2,
    resource: {
      url,
      description: "a paid Tendril endpoint",
      mimeType: "application/json",
      ...service,
    },
    accepted: {} as PaymentRequirements,
    payload: { paymentGroup: [], paymentIndex: 0 },
    extensions: discoveryExtensions(route),
  } as unknown as PaymentPayload;
}

// ── every declared route produces an extension the facilitator accepts ──
for (const [name, route] of Object.entries(ROUTES)) {
  const ext = discoveryExtensions(route);
  const bazaar = ext.bazaar as Parameters<typeof validateDiscoveryExtension>[0];

  const result = validateDiscoveryExtension(bazaar);
  assert.ok(result.valid, `${name}: invalid discovery extension — ${result.errors?.join(", ")}`);

  // The middleware normally fills `method` in; we drive the facilitator directly,
  // so if we ever stop setting it the catalog entry loses its HTTP method.
  const info = (bazaar as { info: { input: { method?: string } } }).info;
  assert.equal(info.input.method, route.method, `${name}: method not stamped onto the extension`);
}
console.log("discovery extensions valid");

// ── no route may carry a path parameter ──
// This is the invariant the catalog actually keys on. A `:param` in the path
// means one Bazaar row per node id / lease id / whatever, and the endpoint's
// volume scatters across near-duplicate entries. The variable part belongs in a
// query parameter or the body. Guarding it here because the damage is invisible
// from our side — payments keep settling perfectly while the listing fragments.
for (const [name, route] of Object.entries(ROUTES)) {
  assert.ok(
    !/[:*]/.test(route.routeTemplate),
    `${name}: routeTemplate "${route.routeTemplate}" has a path parameter — ` +
      `move it to a query parameter or the body`,
  );
}

// ── the canonical URL is what we advertise, whichever alias was called ──
// `challenge()` passes routeTemplate to resourceUrl, so a legacy call to
// /rent/node_7f2 still declares itself as /x402/rent and folds into that row.
for (const path of ["/rent/node_7f2", "/x402/rent/node_a91", "/x402/rent?nodeId=node_7f2"]) {
  const req = { originalUrl: path, protocol: "https", get: () => "api.tendril.xyz" };
  assert.equal(
    resourceUrl(req as unknown as Parameters<typeof resourceUrl>[0], ROUTES.rent.routeTemplate),
    "https://api.tendril.xyz/x402/rent",
    `${path} did not canonicalise`,
  );
}
// Without a canonical path it falls back to the request URL — which is exactly
// the behaviour that produced a row per node, so it must stay opt-in.
assert.equal(
  resourceUrl(
    { originalUrl: "/x402/rent/node_7f2", protocol: "https", get: () => "api.tendril.xyz" } as never,
  ),
  "https://api.tendril.xyz/x402/rent/node_7f2",
);

// ── the round trip a real payment makes ──
const rent = payloadFor(ROUTES.rent, "https://api.tendril.xyz/x402/rent");
const discovered = extractDiscoveryInfo(rent, {} as PaymentRequirements) as DiscoveredHTTPResource;

assert.ok(discovered, "rent payload produced no discoverable resource");
assert.equal(discovered.method, "POST");
assert.equal(discovered.serviceName, service.serviceName);
assert.ok(
  discovered.tags?.includes("x402-global-challenge"),
  `challenge tag missing from catalog entry — got ${JSON.stringify(discovered.tags)}`,
);

// ── what the catalog ends up keyed on ──
assert.equal(discovered.resourceUrl, "https://api.tendril.xyz/x402/rent");

// One job, one row: the lease id rides in the bearer token, not the path.
const run = extractDiscoveryInfo(
  payloadFor(ROUTES.run, "https://api.tendril.xyz/x402/run"),
  {} as PaymentRequirements,
) as DiscoveredHTTPResource;
assert.equal(run.resourceUrl, "https://api.tendril.xyz/x402/run");

// Query strings must not split the entry either.
const topup = extractDiscoveryInfo(
  payloadFor(ROUTES.topup, "https://api.tendril.xyz/x402/topup?amount=5000000"),
  {} as PaymentRequirements,
) as DiscoveredHTTPResource;
assert.equal(topup.resourceUrl, "https://api.tendril.xyz/x402/topup");

console.log("discovery round trip ok");
