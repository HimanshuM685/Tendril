/**
 * Bazaar discovery — how a paid endpoint becomes a *findable* one.
 *
 * Settlement and discovery are separate systems. A settled payment is only
 * proof that an address paid an amount; it carries no method, no input shape,
 * no example output, so there is nothing in it to build a catalog entry from.
 * That metadata has to be declared, and it rides along in the 402:
 *
 *   402 PaymentRequired { resource, extensions: { bazaar: … } }
 *        ↓ the v2 client copies `resource` + `extensions` onto the payload verbatim
 *   PAYMENT-SIGNATURE  { resource, extensions, accepted, payload }
 *        ↓ we hand that payload to facilitator.settle()
 *   facilitator catalogs the resource
 *
 * Two consequences worth knowing:
 *
 *  1. **Discovery is triggered by a settled payment.** An endpoint can advertise
 *     discovery in every 402 it sends and still never appear in the catalog if
 *     nobody ever actually pays it. A route that resolves from credit without
 *     settling on-chain contributes nothing here.
 *  2. **Nothing is needed on the client.** `x402Client.createPaymentPayload`
 *     copies `resource` and merges `extensions` for x402Version 2 with no
 *     client extension registered, so third-party agents catalog us too.
 *
 * Everything below is declaration only — it never affects whether a payment
 * verifies, settles, or how much is charged.
 */
import { declareDiscoveryExtension } from "@x402/extensions";
import type { DeclareDiscoveryExtensionInput } from "@x402/extensions";
import { config } from "../config.js";

/**
 * How a route describes itself to the Bazaar.
 *
 * `routeTemplate` is the one field worth getting right: the facilitator
 * canonicalises a resource as `origin + (routeTemplate ?? pathname)`. Without
 * it, `/x402/rent/node_7f2` and `/x402/rent/node_a91` become two catalog
 * entries — one per node ever rented — instead of a single endpoint.
 */
export interface RouteDiscovery {
  /** Express-style path with its params, e.g. `/x402/rent/:nodeId`. */
  routeTemplate: string;
  method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  /** Query params, body shape and an example response. `{}` is valid. */
  spec?: DeclareDiscoveryExtensionInput;
}

/** Service-level branding, attached to every resource we declare. */
export interface ServiceMetadata {
  serviceName?: string;
  tags?: string[];
  iconUrl?: string;
}

/**
 * Tags are how the facilitator attributes activity. `x402-global-challenge`
 * must be present for challenge tracking to pick us up; the rest is
 * categorisation. Capped at 5 tags of 32 printable-ASCII chars by the
 * sanitiser, so keep them short — anything over the cap is silently dropped.
 */
export function serviceMetadata(): ServiceMetadata {
  const tags = [config.x402Tag, ...config.x402ExtraTags].filter(Boolean).slice(0, 5);
  return {
    serviceName: config.serviceName,
    tags,
    ...(config.serviceIconUrl ? { iconUrl: config.serviceIconUrl } : {}),
  };
}

/**
 * Build the `extensions` object for a 402.
 *
 * `declareDiscoveryExtension` deliberately omits `method` from its input type —
 * it expects the framework middleware to narrow it at request time. We drive
 * the facilitator directly (so that settlement can happen *after* the work
 * succeeds), so there is no middleware to do it and we set both `method` and
 * `routeTemplate` on the extension ourselves.
 */
/**
 * Every payable endpoint Tendril exposes, and how it advertises itself.
 *
 * ADDING AN ENDPOINT: add an entry here and pass it as the last argument to
 * `requirePayment` (or `challenge`). That is the whole job — the extension
 * reaches the payload, the facilitator, and the catalog on its own. An endpoint
 * that skips this still takes payments perfectly well; it just stays invisible.
 *
 * The `input`/`output` examples are what a browsing agent sees, so they should
 * be real values a caller could copy, not placeholders.
 */
export const ROUTES = {
  topup: {
    routeTemplate: "/x402/topup",
    method: "POST",
    spec: {
      // `amount` is a query parameter, not a body field, but the spec's
      // query-style declaration only permits GET/HEAD/DELETE and this is a POST.
      // So it is declared body-style with the truth in the description — the
      // alternative is an extension the facilitator rejects outright.
      bodyType: "json",
      input: {},
      inputSchema: {
        properties: {
          amount: {
            type: "string",
            description:
              "QUERY parameter (?amount=): atomic units of USDC to credit " +
              "(6 decimals; 5000000 = 5 USDC). Request body is empty.",
          },
        },
      },
      output: {
        example: {
          address: "AGENT7XYZ…",
          credited: "5000000",
          balance: "7250000",
          asset: { id: "10458941", decimals: 6, symbol: "USDC" },
          payment: { txid: "ABC…", network: "algorand:SGO1…" },
        },
      },
    },
  },
  rent: {
    routeTemplate: "/x402/rent/:nodeId",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { sshPubKey: "ssh-ed25519 AAAA…" },
      inputSchema: {
        properties: {
          seconds: {
            type: "string",
            description:
              "QUERY parameter (?seconds=): lease length, a multiple of 60 between 60 and 14400. Required.",
          },
          payer: {
            type: "string",
            description:
              "QUERY parameter (?payer=): address to apply existing credit from. " +
              "Unauthenticated callers still pay a floor on-chain, and the payment must be " +
              "signed by this address.",
          },
          sshPubKey: {
            type: "string",
            description: "BODY field: OpenSSH public key to authorize. Optional.",
          },
        },
      },
      output: {
        example: {
          leaseId: "lease_9k2m",
          ssh: { host: "bore.pub", port: 41823, username: "root", command: "ssh root@bore.pub -p 41823" },
          paidSeconds: 900,
          paidUntil: "2026-08-01T10:29:02Z",
        },
      },
    },
  },
  rentFlat: {
    routeTemplate: "/rent/:nodeId",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { sshPubKey: "ssh-ed25519 AAAA…" },
      inputSchema: {
        properties: {
          sshPubKey: { type: "string", description: "OpenSSH public key to authorize (optional)" },
        },
      },
      output: {
        example: {
          leaseId: "lease_9k2m",
          ssh: { host: "bore.pub", port: 41823, username: "root", command: "ssh root@bore.pub -p 41823" },
          paidSeconds: 900,
        },
      },
    },
  },
  run: {
    routeTemplate: "/lease/:id/run",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { payload: "print('hello from the sandbox')" },
      inputSchema: {
        properties: { payload: { type: "string", description: "Code to execute in the sandbox" } },
        required: ["payload"],
      },
      output: { example: { jobId: "a1b2c3", ok: true, result: "hello from the sandbox\n" } },
    },
  },
} as const satisfies Record<string, RouteDiscovery>;

export function discoveryExtensions(route: RouteDiscovery): Record<string, unknown> {
  const declared = declareDiscoveryExtension(route.spec ?? {});
  const bazaar = declared.bazaar as { info: { input: Record<string, unknown> } };
  return {
    ...declared,
    bazaar: {
      ...bazaar,
      routeTemplate: route.routeTemplate,
      info: { ...bazaar.info, input: { ...bazaar.info.input, method: route.method } },
    },
  };
}
