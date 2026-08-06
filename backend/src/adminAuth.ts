import type { Request, Response } from "express";
import {
  issueAdminExchangeCode,
  issueAdminSession,
  verifyAdminExchangeCode,
} from "./auth.js";
import { adminAuthEnabled, config, isAdminEmail } from "./config.js";
import type { AdminSessionResponse } from "@tendril/shared";

const usedExchangeJtis = new Set<string>();

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

function disabled(_req: Request, res: Response) {
  res.status(503).json({ error: "Admin sign-in is not configured on this deployment" });
}

export function adminGoogleStart(_req: Request, res: Response) {
  if (!adminAuthEnabled()) return disabled(_req, res);
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.adminGoogleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`${GOOGLE_AUTH}?${params}`);
}

export async function adminGoogleCallback(req: Request, res: Response) {
  if (!adminAuthEnabled()) return disabled(req, res);
  const code = String(req.query.code ?? "");
  const err = String(req.query.error ?? "");
  if (err) {
    return res.redirect(`${config.adminWebOrigin}/auth/google?error=${encodeURIComponent(err)}`);
  }
  if (!code) {
    return res.redirect(`${config.adminWebOrigin}/auth/google?error=missing_code`);
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.adminGoogleRedirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) throw new Error("no access token");

    const profileRes = await fetch(GOOGLE_USERINFO, {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error("userinfo failed");
    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
    };
    if (!profile.sub || !profile.email) throw new Error("incomplete Google profile");

    if (!isAdminEmail(profile.email)) {
      return res.redirect(
        `${config.adminWebOrigin}/auth/google?error=${encodeURIComponent("not authorized")}`,
      );
    }

    const exchangeCode = issueAdminExchangeCode(profile.email, profile.sub, profile.name);
    res.redirect(`${config.adminWebOrigin}/auth/google?code=${encodeURIComponent(exchangeCode)}`);
  } catch (e) {
    const msg = (e as Error).message;
    res.redirect(`${config.adminWebOrigin}/auth/google?error=${encodeURIComponent(msg)}`);
  }
}

export async function adminSessionExchange(req: Request, res: Response) {
  if (!adminAuthEnabled()) return disabled(req, res);
  const { code } = (req.body ?? {}) as { code?: string };
  if (!code) return res.status(400).json({ error: "code required" });

  const parsed = verifyAdminExchangeCode(code);
  if (!parsed) return res.status(401).json({ error: "invalid or expired code" });
  if (usedExchangeJtis.has(parsed.jti)) {
    return res.status(401).json({ error: "code already used" });
  }
  usedExchangeJtis.add(parsed.jti);
  if (usedExchangeJtis.size > 10_000) usedExchangeJtis.clear();

  if (!isAdminEmail(parsed.email)) {
    return res.status(403).json({ error: "not authorized" });
  }

  const body: AdminSessionResponse = {
    token: issueAdminSession(parsed.email, parsed.sub, parsed.name),
    email: parsed.email,
    name: parsed.name,
  };
  res.json(body);
}

export function isAdminAuthEnabled(): boolean {
  return adminAuthEnabled();
}
