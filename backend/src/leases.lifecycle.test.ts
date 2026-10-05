import assert from "node:assert/strict";
import { test } from "node:test";
import { JOB_RESULT_MAX_BYTES } from "@tendril/shared";
import { activateLease, createLease, getLease, getRunResult, setLeaseStatus, setRunResult } from "./leases.js";

function lease() {
  return createLease({ nodeId: "test-node", renterAddr: "test-payer", payerAddr: "test-payer", payToAddr: "test-owner",
    rateAtomicPerHour: 1_000_000, gateFeeAtomic: 10_000, fundingAtomic: 1_000_000, paymentTxid: null, provider: "contributor" });
}
const access = { kind: "ssh", host: "", port: 0, username: "root", authMethod: "publickey", password: null, command: "" } as const;

test("activation is idempotent and cannot revive cancelled or failed jobs", () => {
  const l = lease();
  assert.equal(activateLease(l.id, access), true);
  l.startedAt = 123;
  assert.equal(activateLease(l.id, access), true);
  assert.equal(l.startedAt, 123);
  for (const status of ["ended", "failed"] as const) {
    setLeaseStatus(l.id, status);
    assert.equal(activateLease(l.id, access), false);
    assert.equal(l.status, status);
  }
});

test("completed job cache bounds retained results and rejects oversized frames", () => {
  const ids: string[] = [];
  for (let i = 0; i < 33; i++) {
    const l = lease();
    setLeaseStatus(l.id, "ended");
    setRunResult(l.id, { ok: true, result: String(i) });
    ids.push(l.id);
  }
  assert.equal(getRunResult(ids[0]), undefined);
  assert.equal(getLease(ids[0]), undefined);
  assert.equal(getRunResult(ids.at(-1)!)?.result, "32");
  const l = lease();
  setLeaseStatus(l.id, "ended");
  setRunResult(l.id, { ok: true, result: "x".repeat(JOB_RESULT_MAX_BYTES + 1) });
  assert.equal(getRunResult(l.id)?.ok, false);
  assert.match(getRunResult(l.id)!.error!, /transport limit/);
});
