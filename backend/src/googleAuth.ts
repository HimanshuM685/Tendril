import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import {
  issueGoogleExchangeCode,
  issueGoogleExportState,
  issueGoogleSession,
  verifyGoogleExchangeCode,
  verifyGoogleExportState,
} from "./auth.js";
import { config, googleAuthEnabled } from "./config.js";
import { generateCustodialAccount } from "./custodialWallet.js";
import { ensureCustodialGasRequest } from "./gasGrant.js";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleSub,
  findUserById,
  linkGoogleSub,
  touchUserLogin,
} from "./db.js";
import { bindExportGrant, createExportChallenge } from "./securityDb.js";
import { creditBalance } from "./x402/credit.js";
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

/** Google authorize URL that must be the same account as `userId`. */
export async function googleReauthUrl(userId: string): Promise<string> {
  const state = issueGoogleExportState(userId);
  await createExportChallenge(userId, state, Date.now() + 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: config.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "login",
    state,
  });
  return `${GOOGLE_AUTH}?${params}`;
}

async function googleProfile(code: string): Promise<{ sub: string; email: string; name?: string }> {
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
  const profile = (await profileRes.json()) as { sub?: string; email?: string; name?: string };
  if (!profile.sub || !profile.email) throw new Error("incomplete Google profile");
  return { sub: profile.sub, email: profile.email, name: profile.name };
}

export async function googleCallback(req: Request, res: Response) {
  if (!googleAuthEnabled()) return disabled(req, res);
  const code = String(req.query.code ?? "");
  const err = String(req.query.error ?? "");
  const state = String(req.query.state ?? "");
  if (err) {
    return res.redirect(`${config.webOrigin}/auth/google?error=${encodeURIComponent(err)}`);
  }
  if (!code) {
    return res.redirect(`${config.webOrigin}/auth/google?error=missing_code`);
  }

  try {
    const profile = await googleProfile(code);

    if (state) {
      const exportState = verifyGoogleExportState(state);
      if (!exportState) {
        return res.redirect(`${config.webOrigin}/auth/google?error=invalid_state`);
      }
      const owner = await findUserById(exportState.userId);
      if (!owner?.google_sub || owner.google_sub !== profile.sub) {
        return res.redirect(`${config.webOrigin}/auth/google?error=google_mismatch`);
      }
      const grant = nanoid();
      const bound = await bindExportGrant(state, grant, Date.now() + 2 * 60 * 1000);
      if (!bound) {
        return res.redirect(`${config.webOrigin}/auth/google?error=invalid_state`);
      }
      return res.redirect(
        `${config.webOrigin}/auth/google?exportGrant=${encodeURIComponent(grant)}`,
      );
    }

    let user = await findUserByGoogleSub(profile.sub);
    if (!user) {
      const existingByEmail = await findUserByEmail(profile.email);
      if (existingByEmail) {
        // Google has verified same email: reuse existing custodial wallet instead
        // of creating a second wallet for one person.
        user = await linkGoogleSub(existingByEmail.id, profile.sub, profile.name ?? existingByEmail.name);
        if (!user) throw new Error("could not link Google account");
      } else {
        const { address, encryptedMnemonic } = generateCustodialAccount();
        user = await createUser({
          id: nanoid(),
          googleSub: profile.sub,
          email: profile.email,
          name: profile.name ?? null,
          address,
          encryptedMnemonic,
        });
        // Signup only: create one pending admin request. Admin acceptance owns
        // both ALGO delivery and the custodial USDC opt-in.
        await ensureCustodialGasRequest(user);
      }
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
    token: issueGoogleSession(user.id, user.address, user.email, user.auth_epoch ?? 0),
    address: user.address,
    email: user.email,
    name: user.name,
    balanceAtomic: await creditBalance(user.address),
    authType: "google",
    pinSet: !!user.pin_hash,
  };
  res.json(body);
}

export function isGoogleAuthEnabled(): boolean {
  return googleAuthEnabled();
}
