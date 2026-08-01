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

// ── the round trip a real payment makes ──
const rent = payloadFor(ROUTES.rent, "https://api.tendril.xyz/x402/rent/node_7f2?seconds=900");
const discovered = extractDiscoveryInfo(rent, {} as PaymentRequirements) as DiscoveredHTTPResource;

assert.ok(discovered, "rent payload produced no discoverable resource");
assert.equal(discovered.method, "POST");
assert.equal(discovered.serviceName, service.serviceName);
assert.ok(
  discovered.tags?.includes("x402-global-challenge"),
  `challenge tag missing from catalog entry — got ${JSON.stringify(discovered.tags)}`,
);

// ── the one that actually bites: per-node URLs must collapse to one resource ──
// Without `routeTemplate` the facilitator canonicalises on the real pathname, so
// every node ever rented becomes its own catalog entry and the endpoint's
// activity is scattered across dozens of near-duplicate rows.
assert.equal(discovered.resourceUrl, "https://api.tendril.xyz/x402/rent/:nodeId");

const otherNode = extractDiscoveryInfo(
  payloadFor(ROUTES.rent, "https://api.tendril.xyz/x402/rent/node_a91?seconds=3600"),
  {} as PaymentRequirements,
) as DiscoveredHTTPResource;
assert.equal(
  otherNode.resourceUrl,
  discovered.resourceUrl,
  "two nodes produced two catalog entries — routeTemplate is not being applied",
);

// Query strings must not split the entry either.
const topup = extractDiscoveryInfo(
  payloadFor(ROUTES.topup, "https://api.tendril.xyz/x402/topup?amount=5000000"),
  {} as PaymentRequirements,
) as DiscoveredHTTPResource;
assert.equal(topup.resourceUrl, "https://api.tendril.xyz/x402/topup");

console.log("discovery round trip ok");
