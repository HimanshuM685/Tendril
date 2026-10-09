/**
 * Self-check for per-network ledger isolation.
 * Run: ALGORAND_NETWORK=testnet npx tsx backend/src/db.test.ts
 *
 * Needs a reachable DATABASE_URL. It writes a probe row into the running
 * network's schema and deletes it again; it never touches the other network's.
 *
 * What this guards: testnet play money being readable as a mainnet balance.
 * The isolation lives in one `search_path` on the connection rather than in a
 * filter on each query, so the thing that can silently break it is that setting
 * failing to apply — after which every query quietly falls through to `public`
 * and the two networks share one ledger. That is what is asserted here.
 */
import assert from "node:assert/strict";
import { initDb, q } from "./db.js";
import {
  chargeUsage,
  creditBalance,
  creditEarnings,
  creditTopUp,
  debitAllEarnings,
  earningsBalance,
  refundEarnings,
} from "./x402/credit.js";
import { config } from "./config.js";

const other = config.network === "testnet" ? "mainnet" : "testnet";
const ADDR = "SELFCHECKADDRESSSELFCHECKADDRESSSELFCHECKADDRESSSELFCHECK";
const txid = `selfcheck-${config.network}-${Date.now()}`;

await initDb();

// The connection must resolve to this network's schema, not `public`.
const [{ s }] = await q<{ s: string }>("SELECT current_schema() AS s");
assert.equal(s, config.network, `search_path did not apply — resolving to "${s}"`);

// Both schemas must exist as separate objects, or "isolation" is one table.
const schemas = await q<{ nspname: string }>(
  "SELECT nspname FROM pg_namespace WHERE nspname IN ('testnet','mainnet')",
);
assert.equal(schemas.length, 2, "expected both testnet and mainnet schemas to exist");

const before = await creditBalance(ADDR);
const otherBefore = await q<{ n: string }>(
  `SELECT COALESCE(SUM(amount_atomic),0)::text AS n FROM "${other}".credits WHERE address = $1`,
  [ADDR],
);

await creditTopUp(ADDR, 4321, txid);
assert.equal(await creditBalance(ADDR), before + 4321, "credit did not land in this network");

// The same address on the other network must be untouched by that write.
const otherAfter = await q<{ n: string }>(
  `SELECT COALESCE(SUM(amount_atomic),0)::text AS n FROM "${other}".credits WHERE address = $1`,
  [ADDR],
);
assert.equal(
  otherAfter[0].n,
  otherBefore[0].n,
  `crediting ${config.network} changed the ${other} balance — the ledgers are not isolated`,
);

// Replaying a settled top-up must not credit twice (the topups PK carries this).
await creditTopUp(ADDR, 4321, txid);
assert.equal(await creditBalance(ADDR), before + 4321, "replayed top-up credited twice");

// Restarting the backend must never cost anyone their balance. `initDb` runs on
// every boot, so every statement in it has to be CREATE ... IF NOT EXISTS — one
// DROP or TRUNCATE slipped in there would wipe real customer money on the next
// deploy, and nothing else in the system would notice.
await initDb();
await initDb();
assert.equal(
  await creditBalance(ADDR),
  before + 4321,
  "a balance did not survive re-running initDb — startup is destroying data",
);
const [{ n }] = await q<{ n: string }>(
  "SELECT count(*)::text AS n FROM topups WHERE address = $1",
  [ADDR],
);
assert.equal(n, "1", "top-up history did not survive re-running initDb");

// ── the overdraft rule ──
// A metered SSH session is clamped to the balance (watchdog overrun and the
// grace window are the platform's problem). A one-shot /x402/run is not: it
// cannot be stopped part-way, so it bills what it took and the balance goes
// negative. Getting these two the wrong way round either hands out free compute
// or kills someone's session to save a fraction of a cent.
const balanceNow = await creditBalance(ADDR); // 4321 from above

const clamped = await chargeUsage({
  address: ADDR,
  leaseId: `selfcheck-clamp-${Date.now()}`,
  payToAddr: "PAYTO",
  usedAtomic: balanceNow + 5000,
  usedSeconds: 60,
});
assert.equal(clamped.charged, balanceNow, "a lease charge was not clamped to the balance");
assert.equal(clamped.balance, 0, "clamped charge left a non-zero balance");

await creditTopUp(ADDR, 1000, `${txid}-overdraft`);
const overdrawn = await chargeUsage({
  address: ADDR,
  leaseId: `selfcheck-overdraft-${Date.now()}`,
  payToAddr: "PAYTO",
  usedAtomic: 1600,
  usedSeconds: 60,
  allowOverdraft: true,
});
assert.equal(overdrawn.charged, 1600, "an overdraft run was clamped — it must bill in full");
assert.equal(overdrawn.balance, -600, "balance did not go negative on an overdraft run");

// ── the earnings ledger ──
// A lease credits a withdrawable balance instead of sending on-chain, so two
// things have to hold: the same lease can never credit twice (a release racing
// the watchdog would otherwise pay a contributor double), and a withdrawal
// below the floor must take nothing at all rather than a partial amount.
const earnLease = `selfcheck-earn-${Date.now()}`;
const earned = await creditEarnings(ADDR, earnLease, 3_000_000);
assert.equal(earned, 3_000_000, "earnings were not credited");
assert.equal(
  await creditEarnings(ADDR, earnLease, 3_000_000),
  3_000_000,
  "the same lease credited earnings twice",
);

assert.equal(
  await debitAllEarnings(ADDR, 5_000_000),
  0,
  "a withdrawal under the minimum took money anyway",
);
assert.equal(await earningsBalance(ADDR), 3_000_000, "a refused withdrawal moved the balance");

await creditEarnings(ADDR, `${earnLease}-b`, 2_500_000);
assert.equal(
  await debitAllEarnings(ADDR, 5_000_000),
  5_500_000,
  "a withdrawal over the minimum did not take the whole balance",
);
assert.equal(await earningsBalance(ADDR), 0, "withdrawal left earnings behind");

// A failed on-chain send must give it all back.
await refundEarnings(ADDR, 5_500_000);
assert.equal(await earningsBalance(ADDR), 5_500_000, "a refunded withdrawal was lost");

await q("DELETE FROM charges WHERE address = $1", [ADDR]);
await q("DELETE FROM topups WHERE address = $1", [ADDR]);
await q("DELETE FROM credits WHERE address = $1", [ADDR]);
await q("DELETE FROM payouts WHERE to_addr = $1", [ADDR]);
await q("DELETE FROM earnings WHERE address = $1", [ADDR]);

console.log(`ledger isolation ok (${config.network} write invisible to ${other})`);
console.log("restart-safe ok (initDb preserves balances + history)");
console.log("overdraft ok (lease clamps, one-shot run goes negative)");
console.log("earnings ok (credited once per lease, withdrawal floor holds, refund restores)");
process.exit(0);
