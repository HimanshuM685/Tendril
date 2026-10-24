import { hashPassword, verifyPassword } from "./password.js";

const PIN_RE = /^\d{4}$/;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failures = new Map<string, number[]>();

export function isPin(pin: unknown): pin is string {
  return typeof pin === "string" && PIN_RE.test(pin);
}

export function hashPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

export function verifyPin(pin: string, stored: string): Promise<boolean> {
  return verifyPassword(pin, stored);
}

function recentFailures(userId: string): number[] {
  const now = Date.now();
  const kept = (failures.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(userId, kept);
  return kept;
}

/** Five wrong PINs in 15 minutes locks confirm. */
export function pinLocked(userId: string): boolean {
  return recentFailures(userId).length >= MAX_FAILURES;
}

export function recordPinFailure(userId: string): void {
  const kept = recentFailures(userId);
  kept.push(Date.now());
  failures.set(userId, kept);
}

export function clearPinFailures(userId: string): void {
  failures.delete(userId);
}
