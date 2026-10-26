/**
 * PIN format, hashing, and lockout. Run via npm test.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { hashPin, isPin, verifyPin } from "./pin.js";
import { PIN_MAX_FAILURES, PIN_WINDOW_MS, pinAfterFailure, pinIsLocked, type PinLockRow } from "./pinLock.js";

test("pin accepts exactly four digits", () => {
  assert.equal(isPin("1234"), true);
  assert.equal(isPin("0000"), true);
});

test("pin rejects letters, spaces, other lengths, and empty", () => {
  for (const bad of ["abcd", "12 4", "123456", "123", "", "12\n4", null, 1234]) {
    assert.equal(isPin(bad), false);
  }
});

test("pin hash does not store the plaintext", async () => {
  const stored = await hashPin("2468");
  assert.equal(stored.includes("2468"), false);
  assert.equal(await verifyPin("2468", stored), true);
  assert.equal(await verifyPin("2469", stored), false);
});

test("five failures lock and success state is a cleared row", () => {
  const now = 1_000_000;
  let row: PinLockRow | null = null;
  for (let i = 0; i < PIN_MAX_FAILURES; i++) row = pinAfterFailure(row, now + i);
  assert.equal(pinIsLocked(row, now + PIN_MAX_FAILURES), true);
  assert.equal(pinIsLocked(null, now), false);
  assert.equal(pinIsLocked(row, now + PIN_WINDOW_MS + PIN_MAX_FAILURES), false);
});
