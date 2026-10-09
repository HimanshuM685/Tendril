import assert from "node:assert/strict";
import { createLease, activateLease, confirmLeasePayment, closeLease, abandonLease, nodeBusy, leaseEffects } from "./leases.js";

const original = { ...leaseEffects };
const charges = new Map<string, number>();
let debits = 0, payouts = 0, destroys = 0;
leaseEffects.charge = async (args) => {
  if (!charges.has(args.leaseId)) { charges.set(args.leaseId, args.usedAtomic); debits++; }
  return { charged: charges.get(args.leaseId)!, balance: 1000000 };
};
leaseEffects.payout = async () => { payouts++; };
const newLease = () => createLease({ nodeId: `node-${Math.random()}`, provider: "contributor", payerAddr: "payer", renterAddr: "payer",
  payToAddr: "owner", rateAtomicPerHour: 3600, fundingAtomic: 1000000, gateFeeAtomic: 10000, paymentTxid: "tx" });
try {
  const lease = newLease();
  activateLease(lease.id, null); confirmLeasePayment(lease.id);
  lease.startedAt = Date.now() - 10000;
  let ack!: () => void;
  leaseEffects.destroy = async () => { destroys++; await new Promise<void>((resolve) => { ack = resolve; }); };
  const first = closeLease(lease.id, "released"), second = closeLease(lease.id, "watchdog");
  assert.equal(first, second);
  const endedAt = lease.endedAt;
  assert.equal(lease.status, "stopping"); assert.equal(nodeBusy(lease.nodeId), true);
  await new Promise((r) => setTimeout(r, 25));
  assert.equal(debits, 0); ack();
  const result = await first;
  assert.equal(lease.endedAt, endedAt);
  assert.equal(result?.usedSeconds, 10); assert.equal(debits, 1); assert.equal(payouts, 1); assert.equal(destroys, 1);
  assert.equal(nodeBusy(lease.nodeId), false);
  assert.equal(await closeLease(lease.id, "retry"), result);

  const retry = newLease(); activateLease(retry.id, null); confirmLeasePayment(retry.id);
  retry.startedAt = Date.now() - 10000;
  let failed = true;
  leaseEffects.destroy = async () => { if (failed) throw new Error("relay unavailable"); };
  await assert.rejects(closeLease(retry.id, "released"));
  const frozen = retry.endedAt;
  assert.equal(nodeBusy(retry.nodeId), true); assert.equal(debits, 1);
  failed = false;
  let earningsFail = true;
  leaseEffects.payout = async () => { if (earningsFail) throw new Error("ledger transient"); payouts++; };
  await assert.rejects(closeLease(retry.id, "retry"));
  assert.equal(debits, 2); assert.equal(nodeBusy(retry.nodeId), true);
  earningsFail = false;
  await closeLease(retry.id, "retry-payout");
  assert.equal(debits, 2); assert.equal(payouts, 2); assert.equal(retry.endedAt, frozen);

  const starting = newLease();
  await abandonLease(starting.id);
  assert.equal(charges.has(starting.id), false); assert.equal(nodeBusy(starting.nodeId), false);
  const unsettled = newLease(); activateLease(unsettled.id, null);
  await closeLease(unsettled.id, "disconnect-before-settlement");
  assert.equal(charges.has(unsettled.id), false);
  const blocked = newLease(); blocked.payoutBlocked = true;
  activateLease(blocked.id, null); confirmLeasePayment(blocked.id);
  blocked.startedAt = Date.now() - 10000;
  await closeLease(blocked.id, "released");
  assert.equal(charges.has(blocked.id), true); assert.equal(payouts, 2);
  console.log("lease lifecycle: frozen billing, reservation, cleanup/payout retry and races ok");
} finally { Object.assign(leaseEffects, original); }
