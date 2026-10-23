import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import {
  issueGoogleExchangeCode,
  issueGoogleSession,
  verifyGoogleExchangeCode,
} from "./auth.js";
import { config, googleAuthEnabled } from "./config.js";
import { generateCustodialAccount } from "./custodialWallet.js";
import {
  createUser,
  findUserByGoogleSub,
  findUserById,
  touchUserLogin,
} from "./db.js";
import { creditBalance } from "./x402/credit.js";
import { onboardGoogleUser } from "./onboarding.js";
import type { GoogleSessionResponse } from "@tendril/shared";

const usedExchangeJtis = new Set<string>();

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";

function disabled(_req: Request, res: Response) {
  res.status(503).json({ error: "Google sign-in is not configured on this deployment" });
}

export function googleStart(_req: Request, res: Response) {
  if (!googleAuthEnabled()) return disabled(_req, res);
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`${GOOGLE_AUTH}?${params}`);
}

export async function googleCallback(req: Request, res: Response) {
  if (!googleAuthEnabled()) return disabled(req, res);
  const code = String(req.query.code ?? "");
  const err = String(req.query.error ?? "");
  if (err) {
    return res.redirect(`${config.webOrigin}/auth/google?error=${encodeURIComponent(err)}`);
  }
  if (!code) {
    return res.redirect(`${config.webOrigin}/auth/google?error=missing_code`);
  }

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: config.googleRedirectUri,
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

    let user = await findUserByGoogleSub(profile.sub);
    if (!user) {
      const { address, encryptedMnemonic } = generateCustodialAccount();
      user = await createUser({
        id: nanoid(),
        googleSub: profile.sub,
        email: profile.email,
        name: profile.name ?? null,
        address,
        encryptedMnemonic,
      });
      // Signup only: fund gas + opt into USDC in the background (two on-chain
      // confirmations would otherwise stall the redirect).
      const created = user;
      void onboardGoogleUser(created).catch((e) =>
        console.error(`[onboarding] ${created.address}: ${(e as Error).message}`));
    } else {
      await touchUserLogin(user.id);
    }

    const exchangeCode = issueGoogleExchangeCode(user.id);
    res.redirect(`${config.webOrigin}/auth/google?code=${encodeURIComponent(exchangeCode)}`);
  } catch (e) {
    const msg = (e as Error).message;
    res.redirect(`${config.webOrigin}/auth/google?error=${encodeURIComponent(msg)}`);
  }
}

export async function googleSessionExchange(req: Request, res: Response) {
  if (!googleAuthEnabled()) return disabled(req, res);
  const { code } = (req.body ?? {}) as { code?: string };
  if (!code) return res.status(400).json({ error: "code required" });

  const parsed = verifyGoogleExchangeCode(code);
  if (!parsed) return res.status(401).json({ error: "invalid or expired code" });
  if (usedExchangeJtis.has(parsed.jti)) {
    return res.status(401).json({ error: "code already used" });
  }
  usedExchangeJtis.add(parsed.jti);
  // Prevent unbounded growth in long-running processes.
  if (usedExchangeJtis.size > 10_000) usedExchangeJtis.clear();

  const user = await findUserById(parsed.userId);
  if (!user) return res.status(404).json({ error: "user not found" });

  const body: GoogleSessionResponse = {
    token: issueGoogleSession(user.id, user.address, user.email),
    address: user.address,
    email: user.email,
    name: user.name,
    balanceAtomic: await creditBalance(user.address),
    authType: "google",
  };
  res.json(body);
}

export function isGoogleAuthEnabled(): boolean {
  return googleAuthEnabled();
}
