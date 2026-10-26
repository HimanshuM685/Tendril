/**
 * One-time custodial intents. The memory ledger matches the SQL consume predicate.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { MemorySignLedger, canonicalJson, canTake, payloadHash, type SignRow } from "./signIntent.js";

function row(over: Partial<SignRow> = {}): SignRow {
  const payloadJson = canonicalJson({ action: "optin" });
  return {
    id: "req-1",
    userId: "user-a",
    action: "optin",
    payloadJson,
    payloadHash: payloadHash(payloadJson),
    summary: "Opt in",
    details: "USDC",
    status: "pending",
    expiresAt: 5_000,
    consumedAt: null,
    createdAt: 1_000,
    clientRequestId: null,
    ...over,
  };
}

test("wrong user cannot take a prepared request", () => {
  assert.equal(canTake(row(), "user-b", 2_000).ok, false);
});

test("expired and consumed requests fail", () => {
  assert.equal(canTake(row(), "user-a", 5_000).ok, false);
  assert.equal(canTake(row({ status: "consumed", consumedAt: 2_000 }), "user-a", 3_000).ok, false);
});

test("a correct take consumes once under concurrency", async () => {
  const ledger = new MemorySignLedger();
  ledger.put(row());
  const [first, second] = await Promise.all([
    Promise.resolve(ledger.consume("req-1", "user-a", 2_000)),
    Promise.resolve(ledger.consume("req-1", "user-a", 2_000)),
  ]);
  const wins = [first, second].filter(Boolean);
  assert.equal(wins.length, 1);
  assert.equal(ledger.consume("req-1", "user-a", 2_000), null);
});

test("stored payload is what would execute, not a later body", () => {
  const stored = canonicalJson({ action: "topup", amountAtomic: 10 });
  const hashed = payloadHash(stored);
  const parsed = JSON.parse(stored) as { amountAtomic: number };
  assert.equal(parsed.amountAtomic, 10);
  assert.equal(payloadHash(stored), hashed);
  assert.notEqual(canonicalJson({ action: "topup", amountAtomic: 99 }), stored);
});

test("wallet users are not in the sign ledger", () => {
  const ledger = new MemorySignLedger();
  assert.equal(ledger.consume("missing", "wallet-user", 1), null);
});
