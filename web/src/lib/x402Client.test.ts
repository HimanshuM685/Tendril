/**
 * Self-check for the wallet signing queue.
 * Run: npx tsx web/src/lib/x402Client.test.ts
 *
 * Pera and Defly reject a second signing request while one is open
 * ("Confirmation Failed(4100)"). The queue exists so that can't happen, and the
 * failure mode it prevents only shows up under concurrency — so test it under
 * concurrency.
 *
 * `serialize` is re-implemented here rather than imported: x402Client.ts pulls in
 * `@x402/avm` and browser-only configuration, neither of which loads in Node. This
 * file and that one must stay in step — the assertions below are the contract.
 */
import assert from "node:assert/strict";

type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

let walletQueue: Promise<unknown> = Promise.resolve();
const WALLET_PROMPT_TIMEOUT_MS = 180_000;

function serializeSigner(sign: SignTransactions): SignTransactions {
  return (txns, indexesToSign) => {
    const previous = walletQueue;
    const run = (async () => {
      await waitForSlot(previous);
      return sign(txns, indexesToSign);
    })();
    walletQueue = run.catch(() => undefined);
    return run;
  };
}

/**
 * Resolve once the request ahead settles, or after the timeout — whichever comes
 * first. The timer is cleared on the normal path, so a session of signatures
 * doesn't accumulate one live three-minute timer per signature.
 */
function waitForSlot(previous: Promise<unknown>): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, WALLET_PROMPT_TIMEOUT_MS);
    void previous
      .catch(() => undefined)
      .then(() => {
        clearTimeout(timer);
        resolve();
      });
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // ── overlapping calls never run at the same time ──
  let open = 0;
  let maxOpen = 0;
  const order: number[] = [];

  const wallet = serializeSigner(async (txns) => {
    open += 1;
    maxOpen = Math.max(maxOpen, open);
    order.push(txns[0][0]);
    await sleep(20); // the wallet modal being open
    open -= 1;
    return [txns[0]];
  });

  // Fire three at once, as two components racing would.
  await Promise.all([
    wallet([Uint8Array.of(1)]),
    wallet([Uint8Array.of(2)]),
    wallet([Uint8Array.of(3)]),
  ]);

  assert.equal(maxOpen, 1, "two signing requests were open at once — a wallet would reject this");
  assert.deepEqual(order, [1, 2, 3], "queued signs should run in the order they were requested");

  // ── a rejection must hand the wallet on, not wedge the queue ──
  let ran = false;
  const flaky = serializeSigner(async (txns) => {
    if (txns[0][0] === 9) throw new Error("user rejected");
    ran = true;
    return [txns[0]];
  });

  await assert.rejects(() => flaky([Uint8Array.of(9)]), /user rejected/);
  await flaky([Uint8Array.of(10)]);
  assert.ok(ran, "a rejected sign must not block the next one");

  // ── the queue survives a rejection with nothing awaiting it ──
  const orphan = serializeSigner(async (txns) => {
    if (txns[0][0] === 11) throw new Error("dismissed");
    return [txns[0]];
  });
  orphan([Uint8Array.of(11)]).catch(() => undefined);
  await orphan([Uint8Array.of(12)]); // resolves rather than hanging

  // ── the bug this actually shipped with ──
  // The queue lived inside the payment path, so sign-in — which signs a
  // transaction through the SAME wallet by a different route — could run
  // concurrently with a payment and trip 4100. One wrapped signer, shared by
  // every caller, is what closes that.
  let liveNow = 0;
  let peak = 0;
  const shared = serializeSigner(async (txns) => {
    liveNow += 1;
    peak = Math.max(peak, liveNow);
    await sleep(15);
    liveNow -= 1;
    return [txns[0]];
  });

  const signIn = () => shared([Uint8Array.of(100)]); // App.signIn()
  const payment = () => shared([Uint8Array.of(101)]); // payingFetch()
  await Promise.all([signIn(), payment(), payment()]);
  assert.equal(peak, 1, "sign-in and a payment reached the wallet at the same time");

  console.log("wallet queue ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
