import { createHash } from "node:crypto";

export type SignStatus = "pending" | "consumed" | "expired";

export interface SignRow {
  id: string;
  userId: string;
  action: string;
  payloadJson: string;
  payloadHash: string;
  summary: string;
  details: string;
  status: SignStatus;
  expiresAt: number;
  consumedAt: number | null;
  createdAt: number;
  clientRequestId: string | null;
}

/** Stable JSON so a stored intent hashes the same way after a restart. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`).join(",")}}`;
}

export function payloadHash(payloadJson: string): string {
  return createHash("sha256").update(payloadJson).digest("hex");
}

export type TakeResult =
  | { ok: true }
  | { ok: false; reason: "missing" | "forbidden" | "expired" | "consumed" };

/** Whether this row may be consumed by `userId` at `now`. Does not mutate. */
export function canTake(row: SignRow | undefined, userId: string, now: number): TakeResult {
  if (!row) return { ok: false, reason: "missing" };
  if (row.userId !== userId) return { ok: false, reason: "forbidden" };
  if (row.status === "consumed") return { ok: false, reason: "consumed" };
  if (row.status === "expired" || row.expiresAt <= now) return { ok: false, reason: "expired" };
  if (row.status !== "pending") return { ok: false, reason: "consumed" };
  if (payloadHash(row.payloadJson) !== row.payloadHash) return { ok: false, reason: "missing" };
  return { ok: true };
}

/**
 * In-memory twin of the SQL consume (`status = pending AND expires_at > now`).
 * One check-and-set, so a second caller loses.
 */
export class MemorySignLedger {
  readonly rows = new Map<string, SignRow>();

  put(row: SignRow): void {
    this.rows.set(row.id, { ...row });
  }

  consume(id: string, userId: string, now: number): SignRow | null {
    const row = this.rows.get(id);
    const verdict = canTake(row, userId, now);
    if (!verdict.ok || !row) return null;
    const next = { ...row, status: "consumed" as const, consumedAt: now };
    this.rows.set(id, next);
    return next;
  }
}
