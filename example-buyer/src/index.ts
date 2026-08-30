/**
 * Tendril autonomous consumer agent.
 *
 * A headless "training agent" that, with zero human clicks and no sign-in:
 *   1. tops up its credit over x402 (POST /x402/topup) — the payment itself is
 *      the identity, so a brand-new address works on its first request,
 *   2. discovers live compute via the free GET /explorer endpoint,
 *   3. picks the cheapest node meeting its RAM requirement and opens a metered
 *      session over x402 (POST /rent/:nodeId) — a small gate fee on-chain, then
 *      billed by the second from the credit it just bought,
 *   4. streams a training script into the sandbox via /run,
 *   5. releases, and only the seconds it actually used are billed.
 *
 * This is the same code path the browser runs (see web/src/lib/x402Client.ts) —
 * only the signer differs: a private key here, a wallet extension there.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";

// Local .env first, then monorepo-root .env as fallback.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv();
loadEnv({ path: resolve(repoRoot, ".env") });
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactAvmScheme } from "@x402/avm/exact/client";
import type { ClientAvmSigner } from "@x402/avm";
import type { Network } from "@x402/core/types";
import {
  formatUsdcExact,
  type ExplorerNode,
  type LeaseCloseResponse,
  type PlatformInfo,
  type RunResponse,
  type X402RentResponse,
  type X402TopUpResponse,
} from "@tendril/shared";

const REGISTRY = (process.env.REGISTRY_URL ?? "http://localhost:4000").replace(/\/+$/, "");
const MIN_RAM_MB = Number(process.env.AGENT_MIN_RAM_MB ?? 1024);
const TOPUP_ATOMIC = Number(process.env.AGENT_TOPUP_ATOMIC ?? 500_000); // 0.50 USDC
const PRIVATE_KEY = process.env.AVM_PRIVATE_KEY ?? "";

const TRAINING_SCRIPT = `
import random
random.seed(0)
# y = 3x + 2 with noise
data = [(x, 3*x + 2 + random.uniform(-0.5, 0.5)) for x in range(50)]
w, b, lr = 0.0, 0.0, 0.001
for epoch in range(2000):
    dw = db = 0.0
    for x, y in data:
        err = (w*x + b) - y
        dw += err * x
        db += err
    w -= lr * dw / len(data)
    b -= lr * db / len(data)
    if epoch % 500 == 0:
        loss = sum(((w*x+b)-y)**2 for x,y in data)/len(data)
        print(f"epoch {epoch:4d}  loss={loss:.4f}  w={w:.3f} b={b:.3f}")
print(f"DONE  learned w={w:.3f} (~3)  b={b:.3f} (~2)")
`.trim();

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error(
      "AVM_PRIVATE_KEY is required (a testnet account holding the payment asset). Generate one with: npm run keygen",
    );
  }

  const sk = new Uint8Array(Buffer.from(PRIVATE_KEY, "base64"));
  const address = algosdk.encodeAddress(sk.slice(32));
  console.log(`[agent] wallet: ${address}`);

  const platform = (await (await fetch(`${REGISTRY}/platform`)).json()) as PlatformInfo;
  console.log(
    `[agent] paying in ${platform.asset.symbol} (asa ${platform.asset.id}) on ${platform.network}`,
  );

  // One payment-aware fetch for everything. On a 402 it reads the challenge,
  // builds the atomic group (this agent's transfer plus the facilitator's
  // unsigned fee transaction), signs only its own, and retries — so the agent
  // needs no ALGO for fees and never has to handle a 402 itself.
  const client = new x402Client().register(
    platform.network as Network,
    new ExactAvmScheme(signer(address, sk)),
  );
  const pay = wrapFetchWithPayment(fetch, client);

  // 1. Top up. No sign-in anywhere: the sender of the settled transaction is
  //    the address that gets the credit.
  console.log(`[agent] topping up ${formatUsdcExact(TOPUP_ATOMIC)} ...`);
  const top = (await postJson(
    pay,
    `${REGISTRY}/x402/topup?amount=${TOPUP_ATOMIC}`,
  )) as X402TopUpResponse;
  console.log(
    `[agent] credited ${formatUsdcExact(Number(top.credited))} (txid ${top.payment.txid}); ` +
      `balance ${formatUsdcExact(Number(top.balance))}`,
  );

  // 2. Discover.
  const { nodes } = (await (await fetch(`${REGISTRY}/explorer`)).json()) as { nodes: ExplorerNode[] };
  console.log(`[agent] ${nodes.length} live node(s) found`);

  // 3. Choose: cheapest node meeting the RAM requirement, then rent a block.
  const node = nodes
    .filter((n) => n.ramMb >= MIN_RAM_MB)
    .sort((a, b) => a.pricePerHourUsd - b.pricePerHourUsd)[0];
  if (!node) throw new Error(`no online node with >= ${MIN_RAM_MB}MB RAM`);
  console.log(`[agent] picked ${node.label} (${node.id}) @ $${node.pricePerHourUsd}/hr — renting ...`);

  // No duration to choose: the gate fee opens a metered session that runs for as
  // long as this address's credit can pay for it.
  const lease = (await postJson(
    pay,
    `${REGISTRY}/x402/rent?nodeId=${encodeURIComponent(node.id)}`,
  )) as X402RentResponse;
  console.log(
    `[agent] lease ${lease.leaseId} — ${formatUsdcExact(Number(lease.billing.rateAtomicPerHour))}/hr, ` +
      `gate fee ${formatUsdcExact(Number(lease.billing.gateFeeAtomic))}, ` +
      `credit funds ${lease.billing.fundedSeconds ?? "unlimited"}s (until ${lease.fundedUntil})`,
  );
  console.log(`[agent] ssh: ${lease.ssh.command}`);

  // 4. Run the training job inside the rented sandbox. Execution is flat-priced
  //    per call, so this is another 402 the wrapper answers on its own.
  console.log("[agent] running training script ...");
  const run = (await postJson(pay, `${REGISTRY}/x402/run`, {
    headers: { authorization: `Bearer ${lease.leaseToken}` },
    body: JSON.stringify({ payload: TRAINING_SCRIPT }),
  })) as RunResponse;
  console.log("──────── remote job output ────────");
  console.log(run.result);
  console.log("───────────────────────────────────");

  // 5. Stop the meter. Only the seconds actually used are billed.
  const closed = (await request(fetch, `${REGISTRY}/x402/leases/${lease.leaseId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${lease.leaseToken}` },
  })) as LeaseCloseResponse;
  console.log(
    `[agent] released after ${closed.usedSeconds}s: used ${formatUsdcExact(Number(closed.usedAtomic))}, ` +
      `charged ${formatUsdcExact(Number(closed.chargedAtomic))}, ` +
      `balance ${formatUsdcExact(Number(closed.balance))}`,
  );
}

/**
 * Sign with a raw private key. `indexesToSign` is what makes fee abstraction
 * work: the agent signs its own transfer and leaves the fee-payer transaction
 * unsigned for the facilitator.
 */
function signer(address: string, sk: Uint8Array): ClientAvmSigner {
  return {
    address,
    async signTransactions(txns, indexesToSign) {
      const wanted = indexesToSign ?? txns.map((_, i) => i);
      return txns.map((bytes, i) =>
        wanted.includes(i) ? algosdk.decodeUnsignedTransaction(bytes).signTxn(sk) : null,
      );
    },
  };
}

type Fetch = typeof globalThis.fetch;

async function postJson(f: Fetch, url: string, init: RequestInit = {}): Promise<unknown> {
  return request(f, url, { method: "POST", ...init });
}

async function request(f: Fetch, url: string, init: RequestInit): Promise<unknown> {
  const res = await f(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

main().catch((err) => {
  console.error("[agent] error:", err.message ?? err);
  process.exit(1);
});
