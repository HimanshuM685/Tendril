/** Durable PIN lockout decisions. The database stores the row; this is the policy. */

export const PIN_WINDOW_MS = 15 * 60 * 1000;
export const PIN_MAX_FAILURES = 5;

export interface PinLockRow {
  windowStartedAt: number;
  failureCount: number;
  lockedUntil: number | null;
}

export function pinIsLocked(row: PinLockRow | null, now: number): boolean {
  if (!row?.lockedUntil) return false;
  return row.lockedUntil > now;
}

/** Next row after a wrong PIN. A lock that has expired starts a fresh window. */
export function pinAfterFailure(row: PinLockRow | null, now: number): PinLockRow {
  const stale = !row || now - row.windowStartedAt >= PIN_WINDOW_MS || (row.lockedUntil !== null && row.lockedUntil <= now);
  const base: PinLockRow = stale
    ? { windowStartedAt: now, failureCount: 0, lockedUntil: null }
    : row!;
  const failureCount = base.failureCount + 1;
  return {
    windowStartedAt: base.windowStartedAt,
    failureCount,
    lockedUntil: failureCount >= PIN_MAX_FAILURES ? now + PIN_WINDOW_MS : null,
  };
}
