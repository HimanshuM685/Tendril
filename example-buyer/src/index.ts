/**
 * Tendril autonomous consumer agent (prepaid wallet model).
 *
 * A headless "training agent" that, with zero human clicks:
 *   1. signs in with its wallet (proves address control to the registry),
 *   2. tops up its prepaid ALGO balance if it's running low,
 *   3. discovers live compute via the free GET /explorer endpoint,
 *   4. picks the cheapest node meeting its RAM requirement and rents it
 *      (no per-rent payment — the registry meters time against the balance),
 *   5. streams a training script into the sandbox via /run,
 *   6. releases the lease and reports the balance drawn down.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import algosdk from "algosdk";

// Local .env first, then monorepo-root .env as fallback.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv();
loadEnv({ path: resolve(repoRoot, ".env") });
import {
  formatAlgoExact,
  type ExplorerNode,
  type PaymentRequired,
  type PlatformInfo,
  type RunResponse,
  type TopUpResponse,
  type SandboxAccess,
  type WalletLoginResponse,
  type WalletNonceResponse,
  type WalletSummary,
} from "@tendril/shared";

const REGISTRY = process.env.REGISTRY_URL ?? "http://localhost:4000";
const ALGOD_URL = process.env.ALGOD_TESTNET_URL ?? "https://testnet-api.algonode.cloud";
const MIN_RAM_MB = Number(process.env.AGENT_MIN_RAM_MB ?? 1024);
const LEASE_MINUTES = Number(process.env.AGENT_LEASE_MINUTES ?? 1);
const TOPUP_ALGO = Number(process.env.AGENT_TOPUP_ALGO ?? 0.5); // ALGO to deposit when low
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
      "AVM_PRIVATE_KEY is required (funded testnet account with ALGO). Generate one with: npm run keygen",
    );
  }

  const sk = new Uint8Array(Buffer.from(PRIVATE_KEY, "base64"));
  const address = algosdk.encodeAddress(sk.slice(32));
  const algod = new algosdk.Algodv2("", ALGOD_URL, "");
  console.log(`[agent] wallet: ${address}`);

  const platform = (await (await fetch(`${REGISTRY}/platform`)).json()) as PlatformInfo;

  // 1. Sign in: sign the login nonce as the note of a 0-ALGO self-payment.
  const { nonce } = (await (
    await fetch(`${REGISTRY}/auth/wallet-nonce?address=${address}`)
  ).json()) as WalletNonceResponse;
  const sp = await algod.getTransactionParams().do();
  const loginTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: address,
    receiver: address,
    amount: 0n,
    note: new TextEncoder().encode(nonce),
    suggestedParams: sp,
  });
  const login = (await postJson(`${REGISTRY}/auth/wallet-login`, {
    address,
    nonce,
    payment: Buffer.from(loginTxn.signTxn(sk)).toString("base64"),
  })) as WalletLoginResponse;
  const auth = { authorization: `Bearer ${login.token}` };
  console.log(`[agent] signed in; balance ${formatAlgoExact(login.balanceMicroAlgos)}`);

  // 2. Top up if the balance is low — over x402, with no human in the loop.
  if (login.balanceMicroAlgos < TOPUP_ALGO * 1e6) {
    console.log(`[agent] topping up ${TOPUP_ALGO} ALGO → ${platform.payTo} ...`);

    // 2a. Ask for the bill: expect HTTP 402 + a payment challenge.
    const challengeRes = await fetch(`${REGISTRY}/wallet/topup`, {
      method: "POST",
      headers: { "content-type": "application/json", ...auth },
      body: JSON.stringify({ amountMicroAlgos: Math.round(TOPUP_ALGO * 1e6) }),
    });
    if (challengeRes.status !== 402) {
      throw new Error(`expected 402 challenge, got ${challengeRes.status}`);
    }
    const { accepts } = (await challengeRes.json()) as PaymentRequired;
    const option = accepts[0];
    console.log(`[agent] 402: pay ${formatAlgoExact(Number(option.amount))} to ${option.payTo}`);

    // 2b. Pay it: sign exactly what the challenge asked for and retry.
    const sp2 = await algod.getTransactionParams().do();
    const topTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: option.payTo,
      amount: BigInt(option.amount),
      suggestedParams: sp2,
    });
    const top = (await postJson(`${REGISTRY}/wallet/topup`, undefined, {
      ...auth,
      "x-payment": Buffer.from(topTxn.signTxn(sk)).toString("base64"),
    })) as TopUpResponse;
    console.log(`[agent] paid ${top.txid}; balance now ${formatAlgoExact(top.balanceMicroAlgos)}`);
  }

  // 3. Discover.
  const { nodes } = (await (await fetch(`${REGISTRY}/explorer`)).json()) as { nodes: ExplorerNode[] };
  console.log(`[agent] ${nodes.length} live node(s) found`);

  // 4. Choose: cheapest node meeting the RAM requirement, then rent it.
  const node = nodes
    .filter((n) => n.ramMb >= MIN_RAM_MB)
    .sort((a, b) => a.pricePerHourUsd - b.pricePerHourUsd)[0];
  if (!node) throw new Error(`no online node with >= ${MIN_RAM_MB}MB RAM`);
  console.log(`[agent] picked ${node.label} (${node.id}) @ $${node.pricePerHourUsd}/hr — renting ...`);

  const lease = (await postJson(`${REGISTRY}/rent/${node.id}`, {}, auth)) as {
    leaseId: string;
    access: SandboxAccess;
    leaseToken: string;
    rateMicroAlgosPerHour: number;
  };
  console.log(
    `[agent] lease ${lease.leaseId} active at ${formatAlgoExact(lease.rateMicroAlgosPerHour)}/hr; ` +
      `ssh ${lease.access.command}`,
  );

  // 5. Run the training job inside the rented sandbox.
  const before = await balanceOf(auth);
  console.log(`[agent] running training script (metering ~${LEASE_MINUTES} min) ...`);
  const run = (await postJson(
    `${REGISTRY}/lease/${lease.leaseId}/run`,
    { payload: TRAINING_SCRIPT },
    { authorization: `Bearer ${lease.leaseToken}` },
  )) as RunResponse;
  console.log("──────── remote job output ────────");
  console.log(run.result);
  console.log("───────────────────────────────────");

  // 6. Release.
  await postJson(`${REGISTRY}/lease/${lease.leaseId}/release`, {}, {
    authorization: `Bearer ${lease.leaseToken}`,
  });
  const after = await balanceOf(auth);
  console.log(`[agent] released. balance ${formatAlgoExact(after)} (drew ~${formatAlgoExact(Math.max(0, before - after))})`);
}

async function balanceOf(auth: Record<string, string>): Promise<number> {
  const w = (await (await fetch(`${REGISTRY}/wallet`, { headers: auth })).json()) as WalletSummary;
  return w.balanceMicroAlgos;
}

async function postJson(
  url: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

main().catch((err) => {
  console.error("[agent] error:", err.message ?? err);
  process.exit(1);
});
