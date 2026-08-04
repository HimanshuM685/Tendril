/**
 * Self-check for the active-users-on-compute series.
 * Run: npx tsx backend/src/metrics.test.ts
 *
 * No DB needed — the function under test is pure.
 *
 * What this guards: the chart used to plot each address's *first ever* lease,
 * cumulatively, so it could only rise and never showed who was actually on
 * compute. The properties that keep it honest are that it comes back down when
 * a session ends, that one user holding two sandboxes counts once, and that a
 * live session (no end) still lands on the series.
 */
import assert from "node:assert/strict";
import { activeUsersByChange } from "./db.js";

const A = "AAAA";
const B = "BBBB";

// Empty in, empty out — a platform with no history has no series, not a zero point.
assert.deepEqual(activeUsersByChange([]), [], "an empty platform produced points");

// One closed session: up at the start, back to zero at the end.
assert.deepEqual(
  activeUsersByChange([{ address: A, start: 100, end: 200 }]),
  [
    { t: 100, count: 1 },
    { t: 200, count: 0 },
  ],
  "a closed session did not return to zero",
);

// Two users overlapping: 1 → 2 → 1 → 0.
assert.deepEqual(
  activeUsersByChange([
    { address: A, start: 100, end: 300 },
    { address: B, start: 200, end: 400 },
  ]),
  [
    { t: 100, count: 1 },
    { t: 200, count: 2 },
    { t: 300, count: 1 },
    { t: 400, count: 0 },
  ],
  "overlapping users were not counted concurrently",
);

// The same user on two sandboxes at once is ONE active user, and stays counted
// until the second one ends.
assert.deepEqual(
  activeUsersByChange([
    { address: A, start: 100, end: 300 },
    { address: A, start: 150, end: 400 },
  ]),
  [
    { t: 100, count: 1 },
    { t: 400, count: 0 },
  ],
  "one user with two leases was counted twice",
);

// Back-to-back leases by one user must not blink to 0 at the handoff instant.
assert.deepEqual(
  activeUsersByChange([
    { address: A, start: 100, end: 200 },
    { address: A, start: 200, end: 300 },
  ]),
  [
    { t: 100, count: 1 },
    { t: 300, count: 0 },
  ],
  "a same-instant lease handoff dipped to zero",
);

// A running session (end null) keeps the series up at the end — this is the
// case the DB alone cannot see, since a charge row only exists after close.
assert.deepEqual(
  activeUsersByChange([
    { address: A, start: 100, end: 200 },
    { address: B, start: 300, end: null },
  ]),
  [
    { t: 100, count: 1 },
    { t: 200, count: 0 },
    { t: 300, count: 1 },
  ],
  "a live session did not show on the series",
);

// Unrelated users starting at the same instant collapse to one point, not two.
const simultaneous = activeUsersByChange([
  { address: A, start: 500, end: 900 },
  { address: B, start: 500, end: 900 },
]);
assert.deepEqual(
  simultaneous,
  [
    { t: 500, count: 2 },
    { t: 900, count: 0 },
  ],
  "simultaneous changes did not collapse into one point",
);

console.log("metrics self-check passed");
