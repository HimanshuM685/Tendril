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
 * `routeTemplate` is the one field worth getting right, and it must contain **no
 * path parameters**. The catalog keys an entry on the resource URL, and in
 * practice the facilitator uses the concrete `resource.url` rather than this
 * template — so `/x402/rent/node_7f2` and `/x402/rent/node_a91` became two
 * catalog rows, one per node ever rented, and every lease minted its own `/run`
 * row. Volume that should roll up into one endpoint was scattered across dozens.
 *
 * So the fix is not to describe the parameter better, it is to take it out of
 * the path: every payable route is a fixed path and the variable part travels as
 * a query parameter or in the body. `resourceUrl()` then emits exactly this
 * string for every call, and one endpoint is one row.
 */
export interface RouteDiscovery {
  /** Fixed, parameter-free path, e.g. `/x402/rent`. Also the advertised URL. */
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
    routeTemplate: "/x402/rent",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { nodeId: "wbVu3T-ru3", sshPubKey: "ssh-ed25519 AAAA…" },
      inputSchema: {
        properties: {
          nodeId: {
            type: "string",
            description:
              "QUERY parameter (?nodeId=) or BODY field: which machine to rent. " +
              "Required. Pick one from GET /nodes.",
          },
          sshPubKey: {
            type: "string",
            description: "BODY field: OpenSSH public key to authorize. Optional.",
          },
        },
        required: ["nodeId"],
      },
      output: {
        example: {
          leaseId: "lease_9k2m",
          leaseToken: "eyJhbGciOi…",
          ssh: { host: "bore.pub", port: 41823, username: "root", command: "ssh root@bore.pub -p 41823" },
          startedAt: "2026-08-01T10:14:02Z",
          fundedUntil: "2026-08-01T11:14:02Z",
        },
      },
    },
  },
  run: {
    routeTemplate: "/x402/run",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { payload: "print('hello from the sandbox')" },
      inputSchema: {
        properties: {
          payload: {
            type: "string",
            description:
              "BODY field: Python source to execute. Its stdout comes back in `result`. " +
              "No lease, no setup: Tendril picks the best-value idle machine, runs it in a " +
              "throwaway sandbox and bills the seconds it took from your credit.",
          },
        },
        required: ["payload"],
      },
      output: {
        example: {
          jobId: "a1b2c3",
          ok: true,
          result: "hello from the sandbox\n",
          execution: { nodeId: "wbVu3T-ru3", seconds: 12, costAtomic: "1667", balance: "4998333" },
        },
      },
    },
  },
  mintkey: {
    routeTemplate: "/x402/keys",
    method: "POST",
    spec: {
      bodyType: "json",
      input: { label: "my-machine" },
      inputSchema: {
        properties: {
          label: {
            type: "string",
            description:
              "BODY field: optional display label for the key (max 64 chars). " +
              "Requires a signed-in session (`Authorization: Bearer <session>`).",
          },
        },
      },
      output: {
        example: {
          key: { id: 1, preview: "tdr_…abc", label: "my-machine", createdAt: 1720000000000 },
          secret: "tdr_live_…",
        },
      },
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
