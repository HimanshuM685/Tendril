import { Router, type Request, type Response } from "express";
import type { AdminDashboard, AdminGasRequest, AdminSessionResponse, AdminSettings } from "@tendril/shared";
import { adminFromAuthHeader } from "./auth.js";
import {
  adminGoogleCallback,
  adminGoogleStart,
  adminSessionExchange,
  isAdminAuthEnabled,
} from "./adminAuth.js";
import { config } from "./config.js";
import {
  countGasRequestsByStatus,
  countGoogleUsers,
  findGasRequestById,
  listGasRequests,
  listGoogleUsers,
  metrics,
  resolveGasRequest,
  isEmailAuthEnabled,
  setEmailAuthEnabled,
  type DbGasRequest,
  type GasRequestStatus,
} from "./db.js";
import { liveSessions } from "./leases.js";
import { payoutsEnabled, platformBalances, sendAlgo } from "./payout.js";

export const adminRouter = Router();

type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;

function guard(handler: Handler) {
  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

function requireAdmin(req: Request, res: Response) {
  const admin = adminFromAuthHeader(req.header("authorization"));
  if (!admin) {
    res.status(401).json({ error: "admin sign-in required" });
    return null;
  }
  return admin;
}

function toAdminGasRequest(r: DbGasRequest): AdminGasRequest {
  return {
    id: r.id,
    userId: r.user_id,
    email: r.email,
    name: r.name,
    address: r.address,
    amountMicro: r.amount_micro,
    status: r.status,
    txid: r.txid,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    reviewNote: r.review_note,
    createdAt: r.created_at,
  };
}

adminRouter.get("/auth/google", guard(adminGoogleStart));
adminRouter.get("/auth/google/callback", guard(adminGoogleCallback));
adminRouter.post("/auth/session", guard(adminSessionExchange));
adminRouter.get("/auth/enabled", guard((_req, res) => {
  res.json({ enabled: isAdminAuthEnabled() });
}));

adminRouter.get("/dashboard", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const treasury = await platformBalances();
  const body: AdminDashboard = {
    pendingGasRequests: await countGasRequestsByStatus("pending"),
    totalGoogleUsers: await countGoogleUsers(),
    treasury: {
      address: treasury.address,
      algoMicro: treasury.algoMicro,
      usdcAtomic: treasury.usdcAtomic,
      usdcOptedIn: treasury.usdcOptedIn,
    },
    metrics: await metrics(liveSessions()),
  };
  res.json(body);
}));

adminRouter.get("/gas-requests", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const status = req.query.status as GasRequestStatus | undefined;
  const rows = await listGasRequests(
    status && ["pending", "accepted", "rejected"].includes(status) ? status : undefined,
  );
  res.json({ requests: rows.map(toAdminGasRequest) });
}));

adminRouter.post("/gas-requests/:id/accept", guard(async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  if (!payoutsEnabled()) {
    return res.status(503).json({ error: "PLATFORM_PRIVATE_KEY not configured" });
  }

  const row = await findGasRequestById(req.params.id);
  if (!row) return res.status(404).json({ error: "request not found" });
  if (row.status !== "pending") {
    return res.status(409).json({ error: `request already ${row.status}` });
  }

  const treasury = await platformBalances();
  if (treasury.algoMicro < row.amount_micro + 10_000) {
    return res.status(502).json({
      error: "platform wallet has insufficient ALGO for this grant",
    });
  }

  try {
    const txid = await sendAlgo(row.address, row.amount_micro);
    const updated = await resolveGasRequest(row.id, "accepted", admin.email, { txid });
    if (!updated) return res.status(409).json({ error: "request already resolved" });
    res.json({ request: toAdminGasRequest(updated) });
  } catch (e) {
    res.status(502).json({ error: `payment failed: ${(e as Error).message}` });
  }
}));

adminRouter.post("/gas-requests/:id/reject", guard(async (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const note = String((req.body as { note?: string })?.note ?? "").slice(0, 500);
  const updated = await resolveGasRequest(req.params.id, "rejected", admin.email, { note });
  if (!updated) {
    const row = await findGasRequestById(req.params.id);
    if (!row) return res.status(404).json({ error: "request not found" });
    return res.status(409).json({ error: `request already ${row.status}` });
  }
  res.json({ request: toAdminGasRequest(updated) });
}));

adminRouter.get("/users", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const offset = Math.max(0, Number(req.query.offset ?? 0));
  const users = await listGoogleUsers(limit, offset);
  res.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      address: u.address,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    })),
    total: await countGoogleUsers(),
  });
}));

adminRouter.get("/treasury", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const b = await platformBalances();
  res.json({
    address: b.address,
    algoMicro: b.algoMicro,
    usdcAtomic: b.usdcAtomic,
    usdcOptedIn: b.usdcOptedIn,
    gasGrantMicroAlgos: config.gasGrantMicroAlgos,
  });
}));

adminRouter.get("/settings", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const body: AdminSettings = {
    emailAuthEnabled: await isEmailAuthEnabled(),
  };
  res.json(body);
}));

adminRouter.patch("/settings", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { emailAuthEnabled } = (req.body ?? {}) as { emailAuthEnabled?: boolean };
  if (typeof emailAuthEnabled !== "boolean") {
    return res.status(400).json({ error: "emailAuthEnabled boolean required" });
  }
  await setEmailAuthEnabled(emailAuthEnabled);
  const body: AdminSettings = { emailAuthEnabled };
  res.json(body);
}));

// Some proxies block PATCH — POST alias for the same update.
adminRouter.post("/settings", guard(async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { emailAuthEnabled } = (req.body ?? {}) as { emailAuthEnabled?: boolean };
  if (typeof emailAuthEnabled !== "boolean") {
    return res.status(400).json({ error: "emailAuthEnabled boolean required" });
  }
  await setEmailAuthEnabled(emailAuthEnabled);
  const body: AdminSettings = { emailAuthEnabled };
  res.json(body);
}));
