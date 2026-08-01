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
import { creditBalance, creditTopUp } from "./x402/credit.js";
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

await q("DELETE FROM topups WHERE address = $1", [ADDR]);
await q("DELETE FROM credits WHERE address = $1", [ADDR]);

console.log(`ledger isolation ok (${config.network} write invisible to ${other})`);
console.log("restart-safe ok (initDb preserves balances + history)");
process.exit(0);
