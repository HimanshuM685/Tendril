import { nanoid } from "nanoid";
import type { Request, Response } from "express";
import { issueEmailSession } from "./auth.js";
import { generateCustodialAccount } from "./custodialWallet.js";
import {
  createEmailUser,
  findUserByEmail,
  findUserById,
  isEmailAuthEnabled,
  touchUserLogin,
} from "./db.js";
import { hashPassword, verifyPassword } from "./password.js";
import { creditBalance } from "./x402/credit.js";
import type { EmailSessionResponse } from "@tendril/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LEN = 8;
const MAX_NAME_LEN = 100;

function disabled(_req: Request, res: Response) {
  res.status(503).json({ error: "Email sign-in is disabled" });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function emailEnabled(_req: Request, res: Response) {
  res.json({ enabled: await isEmailAuthEnabled() });
}

export async function emailRegister(req: Request, res: Response) {
  if (!(await isEmailAuthEnabled())) return disabled(req, res);

  const { email: rawEmail, password, name: rawName } = (req.body ?? {}) as {
    email?: string;
    password?: string;
    name?: string;
  };
  if (!rawEmail || !password || !rawName?.trim()) {
    return res.status(400).json({ error: "name, email and password required" });
  }

  const name = rawName.trim().slice(0, MAX_NAME_LEN);
  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "invalid email" });
  }
  if (password.length < MIN_PASSWORD_LEN) {
    return res.status(400).json({ error: `password must be at least ${MIN_PASSWORD_LEN} characters` });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "email already registered" });
  }

  const { address, encryptedMnemonic } = generateCustodialAccount();
  const user = await createEmailUser({
    id: nanoid(),
    email,
    name,
    passwordHash: await hashPassword(password),
    address,
    encryptedMnemonic,
  });

  const body: EmailSessionResponse = {
    token: issueEmailSession(user.id, user.address, user.email),
    address: user.address,
    email: user.email,
    name: user.name,
    balanceAtomic: await creditBalance(user.address),
    authType: "email",
  };
  res.status(201).json(body);
}

export async function emailLogin(req: Request, res: Response) {
  if (!(await isEmailAuthEnabled())) return disabled(req, res);

  const { email: rawEmail, password } = (req.body ?? {}) as {
    email?: string;
    password?: string;
  };
  if (!rawEmail || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const email = normalizeEmail(rawEmail);
  const user = await findUserByEmail(email);
  if (!user?.password_hash) {
    return res.status(401).json({ error: "invalid email or password" });
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  await touchUserLogin(user.id);
  const fresh = (await findUserById(user.id))!;

  const body: EmailSessionResponse = {
    token: issueEmailSession(fresh.id, fresh.address, fresh.email),
    address: fresh.address,
    email: fresh.email,
    name: fresh.name,
    balanceAtomic: await creditBalance(fresh.address),
    authType: "email",
  };
  res.json(body);
}
