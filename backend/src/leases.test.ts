/**
 * The watchdog's money decision: what happens to a lease that has outrun its
 * funding. Pure — no ledger, no sockets, no Docker.
 *
 *   node -e "process.env.SKIP=1" ; npx tsx src/leases.test.ts
 */
import assert from "node:assert/strict";
import { atomicPerHour } from "@tendril/shared";
import { config } from "./config.js";
import { expiredLeaseAction } from "./leases.js";

const rate = atomicPerHour(1); // 1 USDC/hour — 1 second costs 278 atomic
const NOW = 1_800_000_000_000;
const started = NOW - 3600_000; // ran an hour, so owes ~1 USDC

const lease = (graceUntil: number | null) => ({
  rateAtomicPerHour: rate,
  startedAt: started,
  graceUntil,
});

// Still funded (a top-up landed mid-session): push the window out, don't stop.
{
  const d = expiredLeaseAction(lease(null), 2_000_000, NOW);
  assert.equal(d.action, "extend");
  // ~1 USDC left after the hour owed = ~1 more hour.
  assert.ok(d.action === "extend" && d.expiresAt - NOW > 3_500_000);
}

// Broke: grace first, never a straight kill. GRACE_ATOMIC at this rate is an
// hour, so the renter gets an hour to save their work.
{
  const d = expiredLeaseAction(lease(null), 0, NOW);
  assert.equal(d.action, "grace");
  assert.equal(
    d.action === "grace" ? d.graceUntil - NOW : 0,
    (config.graceAtomic / rate) * 3600 * 1000,
  );
}

// Owing exactly the balance is still broke — grace, not extend.
{
  assert.equal(expiredLeaseAction(lease(null), 1_000_000, NOW).action, "grace");
}

// Grace running and not yet up: do nothing. Re-granting here would keep the
// session alive forever on the platform's money.
{
  assert.equal(expiredLeaseAction(lease(NOW + 60_000), 0, NOW).action, "wait");
}

// Grace up: tear it down.
{
  assert.equal(expiredLeaseAction(lease(NOW - 1), 0, NOW).action, "close");
}

// Topped up *during* grace: back to a funded session, and the caller clears
// graceUntil so a later exhaustion gets its own window.
{
  assert.equal(expiredLeaseAction(lease(NOW + 60_000), 5_000_000, NOW).action, "extend");
}

console.log("leases: ok");
