import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

// Contributor agents authenticate with an API key, not a key pair — see
// `ownerOfApiKey` in db.ts. Everything here is the renter/browser side.

export type SessionKind = "session" | "google-session" | "email-session" | "admin-session";

export function isCustodialSessionKind(kind: SessionKind): boolean {
  return kind === "google-session" || kind === "email-session";
}

export interface SessionInfo {
  address: string;
  kind: SessionKind;
  userId?: string;
  email?: string;
}

export interface AdminInfo {
  email: string;
  sub: string;
  name?: string | null;
}

// ─────────────────────────── lease tokens ───────────────────────────
// /rent returns a lease-scoped JWT. /run, /release and GET /lease/:id require
// it. The settled ALGO payment is what authorizes minting the token in the first place.

export function issueLeaseToken(leaseId: string): string {
  return jwt.sign({ leaseId }, config.jwtSecret, { expiresIn: "24h" });
}

export function verifyLeaseToken(token: string): { leaseId: string } | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { leaseId: string };
    return payload.leaseId ? { leaseId: payload.leaseId } : null;
  } catch {
    return null;
  }
}

/** Express helper: extract a verified leaseId from the Authorization header. */
export function leaseIdFromAuthHeader(header?: string): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const payload = verifyLeaseToken(header.slice("Bearer ".length));
  return payload?.leaseId ?? null;
}

// ─────────────────────── wallet login + session tokens ───────────────────────
// No x402. A user proves control of their address by signing a short-lived
// login nonce (set as the note of a 0-ALGO self-txn). On success we mint a
// session JWT carrying their address; spending the prepaid balance (rent,
// top-up, wallet read) requires that token, so nobody can spend someone else's.

/** Issue a login nonce bound to `address` (the client signs it as a txn note). */
export function issueWalletNonce(address: string): string {
  return jwt.sign({ address, kind: "login" }, config.jwtSecret, { expiresIn: "5m" });
}

/** Verify a login nonce belongs to `address`. */
export function verifyWalletNonce(nonce: string, address: string): boolean {
  try {
    const p = jwt.verify(nonce, config.jwtSecret) as { address?: string; kind?: string };
    return p.kind === "login" && p.address === address;
  } catch {
    return false;
  }
}

/** Mint a session token identifying the logged-in wallet address. */
export function issueSession(address: string): string {
  return jwt.sign({ address, kind: "session" }, config.jwtSecret, { expiresIn: "7d" });
}

/** Mint a session token for a Google custodial user. */
export function issueGoogleSession(userId: string, address: string, email: string): string {
  return jwt.sign({ userId, address, email, kind: "google-session" }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

/** Mint a session token for an email/password custodial user. */
export function issueEmailSession(userId: string, address: string, email: string): string {
  return jwt.sign({ userId, address, email, kind: "email-session" }, config.jwtSecret, {
    expiresIn: "7d",
  });
}

/** Short-lived one-time code exchanged by the web app for a session JWT. */
export function issueGoogleExchangeCode(userId: string): string {
  const jti = randomUUID();
  return jwt.sign({ userId, kind: "google-exchange", jti }, config.jwtSecret, { expiresIn: "60s" });
}

export function verifyGoogleExchangeCode(code: string): { userId: string; jti: string } | null {
  try {
    const p = jwt.verify(code, config.jwtSecret) as {
      userId?: string;
      kind?: string;
      jti?: string;
    };
    if (p.kind !== "google-exchange" || !p.userId || !p.jti) return null;
    return { userId: p.userId, jti: p.jti };
  } catch {
    return null;
  }
}

/** Parse and verify a browser session JWT (wallet or Google). */
export function sessionFromAuthHeader(header?: string): SessionInfo | null {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const p = jwt.verify(header.slice("Bearer ".length), config.jwtSecret) as {
      address?: string;
      kind?: string;
      userId?: string;
      email?: string;
    };
    if (p.kind === "session" && p.address) {
      return { address: p.address, kind: "session" };
    }
    if (p.kind === "google-session" && p.address && p.userId) {
      return { address: p.address, kind: "google-session", userId: p.userId, email: p.email };
    }
    if (p.kind === "email-session" && p.address && p.userId) {
      return { address: p.address, kind: "email-session", userId: p.userId, email: p.email };
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract a verified address from an `Authorization: Bearer <session>` header. */
export function addressFromSession(header?: string): string | null {
  return sessionFromAuthHeader(header)?.address ?? null;
}

// ─────────────────────── admin session tokens ───────────────────────

export function issueAdminSession(email: string, sub: string, name?: string | null): string {
  return jwt.sign({ email, sub, name, kind: "admin-session" }, config.jwtSecret, {
    expiresIn: "12h",
  });
}

export function issueAdminExchangeCode(email: string, sub: string, name?: string | null): string {
  const jti = randomUUID();
  return jwt.sign({ email, sub, name, kind: "admin-exchange", jti }, config.jwtSecret, {
    expiresIn: "60s",
  });
}

export function verifyAdminExchangeCode(
  code: string,
): { email: string; sub: string; name?: string | null; jti: string } | null {
  try {
    const p = jwt.verify(code, config.jwtSecret) as {
      email?: string;
      sub?: string;
      name?: string | null;
      kind?: string;
      jti?: string;
    };
    if (p.kind !== "admin-exchange" || !p.email || !p.sub || !p.jti) return null;
    return { email: p.email, sub: p.sub, name: p.name, jti: p.jti };
  } catch {
    return null;
  }
}

export function adminFromAuthHeader(header?: string): AdminInfo | null {
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const p = jwt.verify(header.slice("Bearer ".length), config.jwtSecret) as {
      email?: string;
      sub?: string;
      name?: string | null;
      kind?: string;
    };
    if (p.kind !== "admin-session" || !p.email || !p.sub) return null;
    return { email: p.email, sub: p.sub, name: p.name };
  } catch {
    return null;
  }
}
