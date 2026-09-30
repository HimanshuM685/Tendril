import { Router, type NextFunction, type Request, type Response } from "express";
import { nanoid } from "nanoid";
import {
  atomicPerHour,
  formatUsdc,
  fundedSeconds,
  type CreateApiKeyResponse,
  type LeaseCloseResponse,
  type PlatformInfo,
  type RunResponse,
  type SandboxLimits,
  type WalletLoginResponse,
  type WithdrawResponse,
  type ComputeNode,
  type Lease,
  type SandboxAccess,
  type X402RentResponse,
  type X402TopUpResponse,
  type GasRequestInfo,
} from "@tendril/shared";
import { adminRouter } from "./adminRoutes.js";
import {
  asset,
  challenge,
  facilitator,
  fail,
  findPayment,
  markFailed,
  markPending,
  markSettled,
  paymentFacts,
  readPayment,
  requirements,
  sendReceipt,
  type PaymentFacts,
} from "./x402/server.js";
import { requirePayment, type PaidRequest } from "./x402/paywall.js";
import { ROUTES } from "./x402/discovery.js";
import {
  creditBalance,
  creditTopUp,
  debitAllEarnings,
  earningsBalance,
  refundEarnings,
} from "./x402/credit.js";
import {
  addressFromSession,
  isCustodialSessionKind,
  issueLeaseToken,
  issueSession,
  issueWalletNonce,
  leaseIdFromAuthHeader,
  sessionFromAuthHeader,
  verifyWalletNonce,
  type SessionInfo,
} from "./auth.js";
import {
  createApiKey,
  createGasRequest,
  findGasRequestByAddress,
  findGasRequestByUserId,
  findUserById,
  isWalletGasGrantEligible,
  listApiKeys,
  metrics,
  recordWithdrawal,
  revokeApiKey,
  type DbGasRequest,
  walletSummary,
} from "./db.js";
import { hasOptedIn, payContributor, payoutsEnabled } from "./payout.js";
import { getNode, listNodesByOwner, listOnlineNodes, pickBestValueNode } from "./registry.js";
import {
  abandonLease,
  activateLease,
  closeLease,
  createLease,
  getLease,
  heldLease,
  leaseByPayment,
  liveSessions,
  nodeBusy,
  waitForLeaseAccess,
} from "./leases.js";
import { verifyLoginSignature } from "./wallet.js";
import { isNodeConnected } from "./ws.js";
import { config } from "./config.js";
import { hostedCatalog, modalConfigured, sandboxLifetimeMs } from "./hosted.js";
import { providerFor } from "./providers/index.js";
import {
  confirmCustodialSign,
  exportMnemonicForUser,
  googleAccountInfo,
  prepareCustodialSign,
  checkExportRateLimit,
  type PrepareAction,
} from "./custodialSign.js";
import {
  googleCallback,
  googleSessionExchange,
  googleStart,
  isGoogleAuthEnabled,
} from "./googleAuth.js";
import { emailEnabled, emailLogin, emailRegister } from "./emailAuth.js";
import { syncGasGrantEligibility, syncWalletGasGrantEligibility } from "./gasGrant.js";

export const router = Router();

/**
 * Express 4 does not catch a rejected promise from an async handler: the request
 * simply hangs until the client gives up. On a payment route that is the worst
 * possible failure — the wallet has signed, the money may have settled, and the
 * caller sees only "Failed to fetch".
 *
 * So every handler goes through here, and a rejection becomes a 500 the caller
 * can actually see. Wrap new routes too; an unwrapped one silently reintroduces
 * the hang.
 */
type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;

function guard(handler: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

router.get("/health", guard((_req, res) => res.json({ ok: true })));

// What we charge in and where. No exchange rate: prices are USD, the asset is a
// dollar stablecoin, so `pricePerHourUsd * 1e6` is the atomic amount.
router.get("/platform", guard((_req, res) => {
  const info: PlatformInfo = {
    payTo: config.platformPayTo,
    network: config.x402Network,
    asset,
    facilitatorUrl: config.facilitatorUrl,
    minTopUpAtomic: config.minTopUpAtomic,
    maxTopUpAtomic: config.maxTopUpAtomic,
    minWithdrawAtomic: config.minWithdrawAtomic,
    flatMintKeyAtomic: config.flatMintKeyAtomic,
    gasGrantMicroAlgos: config.gasGrantMicroAlgos,
  };
  res.json(info);
}));

// ─────────────────────── wallet login (web users) ───────────────────────
// Signing in reads and spends an existing balance. It is NOT how money gets in.
router.get("/auth/wallet-nonce", guard((req: Request, res: Response) => {
  const address = String(req.query.address ?? "");
  if (!address) return res.status(400).json({ error: "address required" });
  res.json({ nonce: issueWalletNonce(address) });
}));

router.post("/auth/wallet-login", guard(async (req: Request, res: Response) => {
  const { address, payment, nonce } = (req.body ?? {}) as {
    address?: string;
    payment?: string;
    nonce?: string;
  };
  if (!address || !payment || !nonce) {
    return res.status(400).json({ error: "address, payment and nonce required" });
  }
  if (!verifyWalletNonce(nonce, address)) {
    return res.status(401).json({ error: "stale or invalid login challenge" });
  }
  if (!verifyLoginSignature(address, payment, nonce)) {
    return res.status(401).json({ error: "signature did not verify for this address" });
  }
  const body: WalletLoginResponse = {
    token: issueSession(address),
    address,
    balanceAtomic: await creditBalance(address),
  };
  res.json(body);
}));

// ─────────────────────── Google OAuth (custodial login) ───────────────────────
router.get("/auth/google", guard(googleStart));
router.get("/auth/google/callback", guard(googleCallback));
router.post("/auth/google/session", guard(googleSessionExchange));
router.get("/auth/google/enabled", guard((_req, res) => {
  res.json({ enabled: isGoogleAuthEnabled() });
}));

// ─────────────────────── Email/password (custodial login) ───────────────────────
router.get("/auth/email/enabled", guard(emailEnabled));
router.post("/auth/email/register", guard(emailRegister));
router.post("/auth/email/login", guard(emailLogin));

router.get("/auth/google/account", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  await syncGasGrantEligibility(session.userId, session.address);
  const user = await findUserById(session.userId);
  const info = await googleAccountInfo(session.address);
  res.json({
    ...info,
    gasGrantEligible: user?.gas_grant_eligible ?? false,
  });
}));

router.post("/auth/google/prepare", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  try {
    const body = req.body as PrepareAction;
    if (!body?.action) return res.status(400).json({ error: "action required" });
    res.json(await prepareCustodialSign(session.userId, body));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}));

router.post("/auth/google/confirm", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  const { requestId } = (req.body ?? {}) as { requestId?: string };
  if (!requestId) return res.status(400).json({ error: "requestId required" });
  try {
    res.json(await confirmCustodialSign(session.userId, requestId));
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}));

router.post("/auth/google/export-key", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  const { confirmed } = (req.body ?? {}) as { confirmed?: boolean };
  if (!confirmed) return res.status(400).json({ error: "confirmation required" });
  if (!checkExportRateLimit(session.userId)) {
    return res.status(429).json({ error: "export rate limit exceeded — try again later" });
  }
  try {
    res.json({ mnemonic: await exportMnemonicForUser(session.userId) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}));

function toGasRequestInfo(r: DbGasRequest): GasRequestInfo {
  return {
    id: r.id,
    status: r.status,
    amountMicro: r.amount_micro,
    address: r.address,
    txid: r.txid,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    reviewNote: r.review_note,
  };
}

router.get("/auth/google/gas-request", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  const row = await findGasRequestByUserId(session.userId);
  res.json(row ? toGasRequestInfo(row) : null);
}));

router.post("/auth/google/gas-request", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (!requireCustodialSession(session, res)) return;
  const existing =
    (await findGasRequestByUserId(session.userId)) ??
    (await findGasRequestByAddress(session.address));
  if (existing) {
    return res.status(409).json({
      error: "gas already requested",
      request: toGasRequestInfo(existing),
    });
  }

  await syncGasGrantEligibility(session.userId, session.address);
  const user = await findUserById(session.userId);
  if (!user) return res.status(404).json({ error: "user not found" });
  if (!user.gas_grant_eligible) {
    return res.status(403).json({ error: "not eligible for gas grant" });
  }

  const { algoMicro } = await googleAccountInfo(session.address);
  if (algoMicro !== 0) {
    return res.status(409).json({ error: "gas grant requires zero ALGO balance" });
  }

  const row = await createGasRequest({
    id: nanoid(),
    userId: user.id,
    email: user.email,
    name: user.name,
    address: user.address,
    amountMicro: config.gasGrantMicroAlgos,
  });
  res.status(201).json(toGasRequestInfo(row));
}));

// ─────────────────────── wallet on-chain account + gas ───────────────────────

router.get("/auth/wallet/account", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (session.kind !== "session") {
    return res.status(403).json({ error: "wallet account requires wallet sign-in" });
  }
  await syncWalletGasGrantEligibility(session.address);
  const info = await googleAccountInfo(session.address);
  res.json({
    ...info,
    gasGrantEligible: await isWalletGasGrantEligible(session.address),
  });
}));

router.get("/auth/wallet/gas-request", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (session.kind !== "session") {
    return res.status(403).json({ error: "gas requests require wallet sign-in" });
  }
  const row = await findGasRequestByAddress(session.address);
  res.json(row ? toGasRequestInfo(row) : null);
}));

router.post("/auth/wallet/gas-request", guard(async (req: Request, res: Response) => {
  const session = requireSessionInfo(req, res);
  if (!session) return;
  if (session.kind !== "session") {
    return res.status(403).json({ error: "gas requests require wallet sign-in" });
  }

  const existing = await findGasRequestByAddress(session.address);
  if (existing) {
    return res.status(409).json({
      error: "gas already requested",
      request: toGasRequestInfo(existing),
    });
  }

  await syncWalletGasGrantEligibility(session.address);
  if (!(await isWalletGasGrantEligible(session.address))) {
    return res.status(403).json({ error: "not eligible for gas grant" });
  }

  const { algoMicro } = await googleAccountInfo(session.address);
  if (algoMicro !== 0) {
    return res.status(409).json({ error: "gas grant requires zero ALGO balance" });
  }

  const row = await createGasRequest({
    id: nanoid(),
    userId: `wallet:${session.address}`,
    email: session.address,
    name: "Wallet",
    address: session.address,
    amountMicro: config.gasGrantMicroAlgos,
  });
  res.status(201).json(toGasRequestInfo(row));
}));

// ─────────────────────── discovery (free) ───────────────────────
router.get("/explorer", guard((_req, res) => {
  res.json({ nodes: listOnlineNodes(), notebooks: modalConfigured() });
}));

// Public platform metrics — growth series + leaderboards.
router.get("/metrics", guard(async (_req, res) => {
  try {
    res.json(await metrics(liveSessions()));
  } catch (err) {
    res.status(500).json({ error: `metrics failed: ${(err as Error).message}` });
  }
}));

router.get("/nodes", guard((req: Request, res: Response) => {
  const owner = String(req.query.owner ?? "");
  if (!owner) return res.status(400).json({ error: "owner required" });
  res.json({ nodes: listNodesByOwner(owner) });
}));

// ─────────────────────── credit balance (session-gated) ───────────────────────
router.get("/wallet", guard(async (req: Request, res: Response) => {
  const address = requireSession(req, res);
  if (!address) return;
  res.json(await walletSummary(address));
}));

// ═══════════════════════ contributor keys (session-gated) ═══════════════════════
//
// A contributor's whole setup is one of these keys. It is what the agent
// authenticates with, and the wallet that minted it is where the earnings go —
// so running a node needs no Algorand key, no payout address and no registry URL
// in the contributor's environment.

router.get("/keys", guard(async (req: Request, res: Response) => {
  const address = requireSession(req, res);
  if (!address) return;
  res.json({ keys: await listApiKeys(address) });
}));

// Mint a contributor API key. Session + x402: payer must be the signed-in address.
async function mintKey(req: Request, res: Response) {
  const label = String((req.body as { label?: string })?.label ?? "").slice(0, 64);
  const fee = config.flatMintKeyAtomic;

  // 402 first — a bare POST must advertise price + bazaar/challenge metadata.
  // Session is checked after verify so an unauthenticated probe still catalogs.
  const paid = await requirePayment(
    req,
    res,
    "mintkey",
    fee,
    `Mint a contributor API key (${formatUsdc(fee)} on-chain). Earnings pay to the signed-in wallet.`,
    ROUTES.mintkey,
  );
  if (!paid) return;

  const address = requireSession(req, res);
  if (!address) return;

  if (paid.facts.payer !== address) {
    return res.status(403).json({
      error: "payer_mismatch",
      detail: "Payment must come from the signed-in wallet address.",
    });
  }

  const created: CreateApiKeyResponse = await createApiKey(address, label);
  if (!(await paid.settle(res))) return;
  res.json(created);
}

router.post("/x402/keys", guard(mintKey));
router.post("/keys", guard(mintKey));

router.delete("/keys/:id", guard(async (req: Request, res: Response) => {
  const address = requireSession(req, res);
  if (!address) return;
  const ok = await revokeApiKey(address, Number(req.params.id));
  if (!ok) return res.status(404).json({ error: "no such key" });
  res.json({ ok: true });
}));

// ═══════════════════════ POST /withdraw ═══════════════════════
//
// Cash a contributor's earnings out to their own wallet, in one on-chain
// transfer. Leases credit a balance rather than paying per session, so this is
// the only place contributor money moves on-chain.
//
// All-or-nothing and floored at MIN_WITHDRAW_ATOMIC: an ASA transfer costs the
// same whether it moves five dollars or five cents, and a per-lease trickle of
// dust would be worth less than the attention it takes.
router.post("/withdraw", guard(async (req: Request, res: Response) => {
  const address = requireSession(req, res);
  if (!address) return;
  if (!payoutsEnabled()) {
    return res.status(503).json({ error: "withdrawals are not configured on this deployment" });
  }
  // Checked before debiting: an ASA transfer to an address that has not opted in
  // fails outright, and there is no point emptying the balance to find that out.
  if (!(await hasOptedIn(address))) {
    return res
      .status(409)
      .json({ error: `opt ${address} into asset ${config.assetId} before withdrawing` });
  }

  const amountAtomic = await debitAllEarnings(address, config.minWithdrawAtomic);
  if (amountAtomic <= 0) {
    const have = await earningsBalance(address);
    return res.status(400).json({
      error: `minimum withdrawal is ${formatUsdc(config.minWithdrawAtomic)} — you have ${formatUsdc(have)}`,
    });
  }

  try {
    const txid = await payContributor(address, amountAtomic);
    await recordWithdrawal(address, amountAtomic, txid);
    const body: WithdrawResponse = { amountAtomic, txid, earningsAtomic: await earningsBalance(address) };
    console.log(`[withdraw] ${amountAtomic} → ${address} (txid ${txid})`);
    res.json(body);
  } catch (err) {
    // The send failed, so the debit above was wrong — put it back.
    await refundEarnings(address, amountAtomic);
    await recordWithdrawal(address, amountAtomic, null);
    console.error(`[withdraw] failed for ${address}: ${(err as Error).message}`);
    res.status(502).json({ error: `withdrawal failed: ${(err as Error).message}` });
  }
}));

// ═══════════════════════ POST /topup?amount=<atomic> ═══════════════════════
//
// The only way money enters Tendril. No auth: the payment proves who is paying,
// and the credit is keyed to the *sender of the settled transaction* — so a
// fresh address with no history can top up, then sign in later to spend it.
//
// The caller names the amount: 4 USDC, 400, 609, anything between
// MIN_TOPUP_ATOMIC and MAX_TOPUP_ATOMIC. It goes in the URL rather than the body
// because `PaymentRequirements.amount` is a fixed number — "pay what you want"
// cannot be expressed in a 402, so the URL is what makes the challenge concrete.
//
// On settlement: one `topups` row for the payment, and the address's `credits`
// balance goes up by the same amount, in a single transaction.
async function topUp(req: Request, res: Response) {
  // Omitting `?amount=` falls back to a house default, so a caller that just
  // wants some credit does not have to pick a number.
  const raw =
    req.query.amount === undefined ? String(config.defaultTopUpAtomic) : String(req.query.amount);
  if (!/^\d+$/.test(raw)) {
    return res
      .status(400)
      .json({ error: "invalid_amount", detail: "?amount= must be a whole number of atomic units" });
  }
  const amount = Number(raw);
  if (amount < config.minTopUpAtomic) {
    return res
      .status(400)
      .json({ error: "amount_below_minimum", minimum: String(config.minTopUpAtomic) });
  }
  if (amount > config.maxTopUpAtomic) {
    return res
      .status(400)
      .json({ error: "amount_above_maximum", maximum: String(config.maxTopUpAtomic) });
  }

  let payload;
  try {
    payload = readPayment(req);
  } catch {
    return res.status(400).json({ error: "malformed_payment" });
  }

  if (!payload) {
    // The warning is load-bearing: paying from an address the user does not
    // control (an exchange withdrawal, say) creates a balance nobody can spend.
    return challenge(
      req,
      res,
      amount,
      `Credit ${formatUsdc(amount)} to the paying address. Pay from a wallet you control: ` +
        `the balance is keyed to the sender and can only be spent by signing from that address.`,
      undefined,
      ROUTES.topup,
    ).catch((err) => fail(res, err));
  }

  let facts: PaymentFacts;
  try {
    facts = paymentFacts(payload);
  } catch {
    return res.status(400).json({ error: "malformed_payment" });
  }

  // Idempotency: the same payment replayed returns the original receipt and
  // credits nothing twice.
  const seen = await findPayment(facts.intentHash);
  if (seen?.status === "settled") {
    return res.json(await topUpBody(seen.payer, seen.amount_atomic, seen.txid));
  }

  let reqs;
  let verified;
  try {
    // `reqs` is rebuilt from the URL right now, so a payment for the wrong
    // amount, asset or recipient fails here — before anything is submitted.
    reqs = await requirements(amount);
    verified = await facilitator.verify(payload, reqs);
  } catch (err) {
    return fail(res, err);
  }
  if (!verified.isValid) {
    return challenge(
      req,
      res,
      amount,
      "Payment did not verify",
      verified.invalidReason ?? "invalid_payment",
      ROUTES.topup,
    ).catch((err) => fail(res, err));
  }

  await markPending(facts, "topup", amount);
  const settlement = await facilitator.settle(payload, reqs);
  if (!settlement.success) {
    await markFailed(facts.txid);
    return res.status(402).json({ error: "settlement_failed", detail: settlement.errorReason });
  }

  await creditTopUp(facts.payer, amount, facts.txid);
  await markSettled(facts.txid);
  sendReceipt(res, settlement);
  res.json(await topUpBody(facts.payer, amount, facts.txid));
}

router.post("/x402/topup", guard(topUp));
// Short alias, so "just top me up" is one obvious path.
router.post("/topup", guard(topUp));

async function topUpBody(payer: string, credited: number, txid: string): Promise<X402TopUpResponse> {
  return {
    address: payer,
    credited: String(credited),
    balance: String(await creditBalance(payer)),
    asset,
    payment: { txid, network: config.x402Network },
  };
}

// ═══════════════════════ POST /x402/rent?nodeId= ═══════════════════════
//
// Rent a machine. Click, and the meter starts.
//
// The node id is a QUERY parameter (or a body field), never a path segment.
// That is a discovery constraint, not a style choice: the Bazaar keys a catalog
// entry on the resource URL, so `/rent/node_a` and `/rent/node_b` listed as two
// separate endpoints and split this one product's volume across a row per node.
//
// There is no duration to choose and no block to buy. Renting pays one flat
// on-chain gate fee (`FLAT_RENT_ATOMIC`) — that is the x402 payment, and it is
// the only thing that goes on chain up front. From then on the clock simply
// runs, and the seconds actually used are billed once, when the lease closes.
//
// The lease lives exactly as long as the renter's credit can pay for it: the
// watchdog stops it at `expiresAt`, which is credit ÷ rate. Top up and that
// moment moves out. Nobody is disconnected at the end of a block they guessed.
//
// Ordering is the whole design: verify, provision, *then* settle. If the sandbox
// does not come up, the caller gets a 503 and has paid nothing.
async function rent(req: Request, res: Response) {
  // Accepted three ways: `?nodeId=` (canonical), a body field, or the legacy
  // `/rent/:nodeId` path the older clients and docs still use.
  const body = req.body as { nodeId?: unknown } | undefined;
  const nodeId =
    req.params.nodeId ??
    (typeof req.query.nodeId === "string" ? req.query.nodeId : undefined) ??
    (typeof body?.nodeId === "string" ? body.nodeId : undefined);
  const node = nodeId ? getNode(nodeId) : undefined;
  const gateFee = config.flatRentAtomic;
  const rate = node ? atomicPerHour(node.pricePerHourUsd) : undefined;
  const description = node && rate !== undefined
    ? `Open a metered session on ${node.id} (${node.cpuCores} vCPU, ` +
      `${Math.round(node.ramMb / 1024)}GB) for a ${formatUsdc(gateFee)} gate fee. ` +
      `Time is then billed from credit at ${formatUsdc(rate)}/hr for as long as you keep it.`
    : `Open a metered SSH session. Pass nodeId as ?nodeId= (from GET /nodes) or in the JSON body. ` +
      `Gate fee ${formatUsdc(gateFee)}; time then bills from credit.`;

  // 402 first so a Bazaar/agent probe of the catalog URL still gets tags + discovery.
  const paid = await requirePayment(
    req,
    res,
    "rent",
    gateFee,
    description,
    ROUTES.rent,
    async (seen) => {
      const existing = leaseByPayment(seen.txid);
      const access = existing?.access;
      const leasedNode = existing ? getNode(existing.nodeId) : undefined;
      if (!existing || !access || !leasedNode || existing.status !== "active") return false;
      if (nodeId && existing.nodeId !== nodeId) return false;
      res.json(toRentResponse(existing, leasedNode, access, existing.paymentTxid));
      return true;
    },
  );
  if (!paid) return;

  if (!nodeId) {
    return res
      .status(400)
      .json({ error: "node_required", detail: "pass ?nodeId= (or a nodeId body field)" });
  }
  if (!node || rate === undefined) return res.status(404).json({ error: "node_not_found" });

  const surface = readSurface(req);
  if (!surface) {
    return res.status(400).json({ error: "invalid_surface", detail: "surface must be ssh or jupyter" });
  }
  if (node.provider === "modal" || surface === "jupyter") {
    return res.status(400).json({
      error: "surface_unsupported",
      detail: "hosted CPU is not a rentable node; upload a notebook",
    });
  } else if (node.status !== "online" || !isNodeConnected(node.id)) {
    return res.status(409).json({
      error: "node_unavailable",
      detail: isNodeConnected(node.id)
        ? "the machine is offline"
        : "the agent is not connected, so an SSH session cannot be opened",
    });
  }

  const sshPubKey = (req.body as { sshPubKey?: unknown } | undefined)?.sshPubKey ?? null;
  if (sshPubKey !== null && (typeof sshPubKey !== "string" || !isOpenSshPubKey(sshPubKey))) {
    return res.status(400).json({ error: "invalid_ssh_key" });
  }

  // The payer is read off the verified transaction — the only trustworthy identity.
  const renter = paid.facts.payer;

  // A second rent of a machine this payer already holds must hand back the SSH
  // (or Jupyter) details. Charging another gate fee, or returning a bare 409,
  // is how a refresh loses the only copy of the connection.
  const held = heldLease(node.id);
  if (held) {
    if (held.payerAddr === renter && !held.allowOverdraft) {
      const access =
        held.access ?? (await waitForLeaseAccess(held.id, config.sandboxReadyTimeoutMs));
      const current = getLease(held.id);
      if (access && current?.status === "active") {
        res.json(toRentResponse(current, node, access, current.paymentTxid));
        return;
      }
    }
    return res.status(409).json({
      error: "node_busy",
      detail:
        held.payerAddr === renter
          ? "your session on this machine is not ready to connect yet"
          : "this machine is already leased",
    });
  }

  // Checked here, after verify but BEFORE settle: an address with no credit
  // cannot fund a single minute, and taking a gate fee for a session that would
  // be killed on the next watchdog tick is just theft with extra steps.
  const credit = await creditBalance(renter);
  // A negative balance is a debt from a `/x402/run` that overdrew. No new
  // machine until it is cleared — otherwise the hole just gets deeper.
  if (credit < 0) {
    return res.status(402).json({
      error: "credit_exhausted",
      detail:
        `this address owes ${formatUsdc(-credit)} from earlier usage. ` +
        `Top up at least that much before renting again.`,
      creditAtomic: String(credit),
      rateAtomicPerHour: String(rate),
    });
  }
  const funded = fundedSeconds(credit, rate);
  if (funded !== null && funded < config.minLeaseSeconds) {
    return res.status(402).json({
      error: "insufficient_credit",
      detail:
        `${formatUsdc(credit)} funds ${funded}s at ${formatUsdc(rate)}/hr; ` +
        `at least ${config.minLeaseSeconds}s of credit is required to open a session.`,
      creditAtomic: String(credit),
      rateAtomicPerHour: String(rate),
    });
  }

  return provision(res, {
    node,
    rate,
    gateFee,
    fundingAtomic: credit,
    renterAddr: renter,
    payerAddr: renter,
    sshPubKey,
    surface,
    paid,
  });
}

// The canonical, parameter-free endpoint — the one the Bazaar lists.
router.post("/x402/rent", guard(rent));
// Legacy path-parameter aliases. Still fully functional for clients that have
// them hard-coded, and they cannot pollute the catalog any more: their 402
// advertises `/x402/rent` like every other call.
router.post("/rent/:nodeId", guard(rent));
router.post("/x402/rent/:nodeId", guard(rent));

interface ProvisionArgs {
  node: NonNullable<ReturnType<typeof getNode>>;
  /** Metered rate, in atomic units per hour. */
  rate: number;
  /** The on-chain gate fee being settled. */
  gateFee: number;
  /** The payer's credit at open — what the funding window is computed from. */
  fundingAtomic: number;
  renterAddr: string;
  payerAddr: string;
  sshPubKey: string | null;
  surface: "ssh" | "jupyter";
  /** A verified payment, settled only once the sandbox is confirmed up. */
  paid: PaidRequest | null;
}

/**
 * Bring the sandbox up, and only then take the money. A provisioning failure
 * releases the node and returns 503 with nothing settled, so the caller loses
 * nothing. A settlement failure after the container is up costs us one wasted
 * container start — the cheaper of the two mistakes.
 */
async function provision(res: Response, args: ProvisionArgs): Promise<void> {
  const { node, rate, gateFee, fundingAtomic, renterAddr, payerAddr, sshPubKey, surface, paid } = args;

  const lease = createLease({
    nodeId: node.id,
    renterAddr,
    payerAddr,
    payToAddr: node.payToAddr,
    rateAtomicPerHour: rate,
    gateFeeAtomic: gateFee,
    fundingAtomic,
    paymentTxid: paid?.facts.txid ?? null,
    provider: node.provider,
  });

  const limits: SandboxLimits = {
    memory: process.env.DEFAULT_SANDBOX_MEMORY ?? "2g",
    cpus: Math.min(node.cpuCores, node.provider === "modal" ? node.cpuCores : 4),
    gpus: node.gpu ? "all" : "",
  };

  let access;
  try {
    access = await providerFor(node.provider).start({
      leaseId: lease.id,
      node,
      surface,
      image: process.env.DEFAULT_SANDBOX_IMAGE ?? "",
      limits,
      timeoutMs: sandboxLifetimeMs(
        fundingAtomic,
        rate,
        config.graceAtomic,
        config.modalReadyTimeoutMs,
      ),
      // Hosted Jupyter never uses the wallet address as a password.
      sshPassword: node.provider === "modal" || sshPubKey ? null : renterAddr,
      sshPubKey: node.provider === "modal" ? null : sshPubKey,
    });
    if (node.provider === "modal") activateLease(lease.id, access);
  } catch (err) {
    await abandonLease(lease.id);
    res.status(503).json({ error: "provisioning_failed", detail: (err as Error).message });
    return;
  }

  // The sandbox is up, so now take the money. If settlement fails the money
  // never moved, and the sandbox shouldn't stay up either: tear it down and free
  // the node. Abandon rather than close — a close would refund a payment that
  // never happened.
  if (paid && !(await paid.settle(res))) {
    await abandonLease(lease.id);
    return;
  }

  // Nothing is debited here. The session has only just started; what it costs
  // is not known until it ends, and that is the one place it is billed.

  res.json(toRentResponse(lease, node, access, paid?.facts.txid ?? null));
}

/** Rent JSON, including SSH when the sandbox is a contributor machine. */
function toRentResponse(
  lease: Lease,
  node: ComputeNode,
  access: SandboxAccess,
  paymentTxid: string | null,
): X402RentResponse {
  return {
    leaseId: lease.id,
    leaseToken: issueLeaseToken(lease.id),
    node: {
      id: node.id,
      cpu: node.cpuCores,
      memoryGb: Math.round(node.ramMb / 1024),
      gpu: node.gpu,
      pricePerHourUsd: node.pricePerHourUsd,
    },
    ssh: access.kind === "ssh" ? access : null,
    ...(access.kind === "jupyter" ? { jupyter: access } : {}),
    startedAt: new Date(lease.startedAt).toISOString(),
    fundedUntil: Number.isFinite(lease.expiresAt)
      ? new Date(lease.expiresAt).toISOString()
      : "never",
    billing: {
      rateAtomicPerHour: String(lease.rateAtomicPerHour),
      gateFeeAtomic: String(lease.gateFeeAtomic),
      creditAtomic: String(lease.fundingAtomic),
      fundedSeconds: fundedSeconds(lease.fundingAtomic, lease.rateAtomicPerHour),
      asset,
    },
    payment: paymentTxid ? { txid: paymentTxid, network: config.x402Network } : null,
  };
}

/**
 * Stop the meter. Bills the seconds the sandbox was actually up, from credit,
 * and tears it down. Nothing was taken up front, so there is nothing to refund.
 */
async function releaseLease(req: Request, res: Response): Promise<void> {
  const lease = requireLease(req, res);
  if (!lease) return;
  const settled = await closeLease(lease.id, "released");
  const body: LeaseCloseResponse = {
    leaseId: lease.id,
    usedSeconds: settled?.usedSeconds ?? 0,
    usedAtomic: String(settled?.usedAtomic ?? 0),
    chargedAtomic: String(settled?.chargedAtomic ?? 0),
    balance: String(settled?.balance ?? (await creditBalance(lease.payerAddr))),
    asset,
  };
  res.json(body);
}

router.delete("/x402/leases/:id", guard(releaseLease));
router.post("/lease/:id/release", guard(releaseLease));

// ═══════════════════════ POST /x402/run ═══════════════════════
//
// Execute one job for a flat `FLAT_RUN_ATOMIC`. Two ways in, one endpoint:
//
//   with a lease token  -> runs in the sandbox you already rented, and the time
//                          is billed with that lease when you release it.
//   without one         -> **no lease needed.** The backend picks the best-value
//                          idle machine, starts a throwaway sandbox, runs the
//                          code, tears it down, and bills the seconds it took.
//
// The second is the interesting one: "here is some Python, run it somewhere" with
// nothing to rent, choose or release first. Both live at one URL so the Bazaar
// sees a single endpoint.
//
// The job runs BEFORE the payment settles, so a job that never ran is never
// paid for.
const RUN_DESCRIPTION =
  `Run code on a rented Linux machine and get its stdout back. Flat ` +
  `${formatUsdc(config.flatRunAtomic)} per job. POST \`{"payload": "<python>"}\` or ` +
  `\`{"notebook": <ipynb>}\` and, with no lease token, Tendril picks the best-value idle machine, ` +
  `executes it in a throwaway sandbox and bills the seconds it took from your credit. Send a lease ` +
  `token instead to run it inside a machine you already hold.`;

const NOTEBOOK_MAX_BYTES = 1_500_000;

interface JobInput {
  payload?: string;
  notebook?: Record<string, unknown>;
}

async function run(req: Request, res: Response): Promise<void> {
  const job = readJob(req.body);
  if (!job) {
    res.status(400).json({ error: jobError(req.body) });
    return;
  }
  // A lease token in hand means "run it in my machine". No header at all, or a
  // session token, takes the leaseless path — there the payment is the only
  // identity that matters.
  const auth = req.header("authorization");
  if (req.params.id !== undefined || leaseIdFromAuthHeader(auth) !== null) {
    return runInLease(req, res, job);
  }
  // A token that decodes to nothing is refused rather than quietly downgraded:
  // an expired lease token must not silently become a job on some other machine
  // that the caller then gets billed for.
  if (auth && !addressFromSession(auth)) {
    res.status(401).json({ error: "invalid_token", detail: "not a valid lease or session token" });
    return;
  }
  return runAnywhere(req, res, job);
}

/** The classic path: a job inside a sandbox the caller already rented. */
async function runInLease(req: Request, res: Response, job: JobInput): Promise<void> {
  const lease = requireLease(req, res);
  if (!lease) return;
  if (lease.status !== "active") {
    res.status(409).json({ error: "lease not active" });
    return;
  }
  if (job.notebook && lease.provider !== "modal") {
    res.status(400).json({
      error: "notebook_unsupported",
      detail: "contributor sandboxes run Python source; notebooks run on hosted CPU",
    });
    return;
  }

  const paid = await requirePayment(req, res, "run", config.flatRunAtomic, RUN_DESCRIPTION, ROUTES.run);
  if (!paid) return;

  const jobId = nanoid(10);
  let result;
  try {
    result = await providerFor(lease.provider).exec({
      leaseId: lease.id,
      nodeId: lease.nodeId,
      jobId,
      timeoutMs: config.runTimeoutMs,
      payload: job.payload,
      notebook: job.notebook,
    });
  } catch (err) {
    // Nothing ran, so nothing settles.
    const message = (err as Error).message || "execution failed";
    res.status(502).json({ error: message, detail: message });
    return;
  }
  if (!(await paid.settle(res))) return;

  const body: RunResponse = {
    jobId,
    ok: result.ok,
    result: result.result,
    ...(result.notebook ? { notebook: result.notebook, artifacts: result.artifacts ?? [] } : {}),
  };
  res.json(body);
}

/**
 * No lease, no node to pick, nothing to release: throw code at Tendril and get
 * its output back.
 *
 * Internally it is still a lease — that is what a running container *is* — but
 * one that is created, used and closed inside this single request, so the caller
 * never sees it. The billing is the ordinary lease billing: seconds the sandbox
 * was up, at that node's rate, charged once at the end.
 *
 * Two rules make this safe to hand to strangers:
 *   - credit must be **positive** to start. The gate fee is on-chain, but the
 *     execution comes out of credit, and an address with none would be running
 *     compute nobody has paid for.
 *   - the charge at the end **may overdraw**. A job is never killed part-way to
 *     protect a balance, so a run can end owing more than was there. That debt
 *     then blocks renting until it is cleared.
 */
async function runAnywhere(req: Request, res: Response, job: JobInput): Promise<void> {
  // The 402 comes first, before any check that could fail for reasons the caller
  // cannot see: an agent that has never called this endpoint must always be able
  // to ask what it costs, even at a moment when every machine happens to be busy.
  const paid = await requirePayment(req, res, "run", config.flatRunAtomic, RUN_DESCRIPTION, ROUTES.run);
  if (!paid) return;

  // Everything below is after verify and before settle, so each of these bails
  // out with the caller having paid nothing.
  const payer = paid.facts.payer;
  const credit = await creditBalance(payer);
  if (credit <= 0) {
    res.status(402).json({
      error: "insufficient_credit",
      detail:
        credit < 0
          ? `this address owes ${formatUsdc(-credit)}; top up before running anything else.`
          : "top up first — execution time is billed from credit.",
      creditAtomic: String(credit),
    });
    return;
  }

  // Notebooks never share a contributor sandbox. They run on hosted CPU even
  // while a peer is online and winning the rent pool. Bail before settle.
  if (job.notebook && !modalConfigured()) {
    res.status(503).json({
      error: "provisioning_failed",
      detail: "hosted compute is not configured",
    });
    return;
  }
  const node = job.notebook
    ? pickNotebookHost()
    : pickBestValueNode((id) => isNodeConnected(id) && !nodeBusy(id));
  if (!node) {
    res.status(503).json({
      error: "no_node_available",
      detail: job.notebook ? "hosted CPU is busy" : "every machine is busy or offline",
    });
    return;
  }

  const rate = atomicPerHour(node.pricePerHourUsd);
  const funded = job.notebook ? fundedSeconds(credit, rate) : null;
  if (job.notebook && !funded) {
    res.status(402).json({
      error: "insufficient_credit",
      detail: "credit does not cover one second at the notebook rate. Top up, then upload again.",
      creditAtomic: String(credit),
    });
    return;
  }
  const budgetMs = job.notebook ? Math.min(config.runTimeoutMs, funded! * 1000) : config.runTimeoutMs;
  const lease = createLease({
    nodeId: node.id,
    renterAddr: payer,
    payerAddr: payer,
    payToAddr: node.payToAddr,
    rateAtomicPerHour: rate,
    gateFeeAtomic: config.flatRunAtomic,
    fundingAtomic: credit,
    paymentTxid: paid.facts.txid,
    allowOverdraft: !job.notebook,
    provider: node.provider,
  });

  try {
    const access = await providerFor(node.provider).start({
      leaseId: lease.id,
      node,
      surface: "exec",
      image: process.env.DEFAULT_SANDBOX_IMAGE ?? "",
      limits: {
        memory: process.env.DEFAULT_SANDBOX_MEMORY ?? "2g",
        cpus: Math.min(node.cpuCores, node.provider === "modal" ? node.cpuCores : 4),
        gpus: node.gpu ? "all" : "",
      },
      timeoutMs: config.modalReadyTimeoutMs + budgetMs,
      // One-shot sandboxes are not logged into. Never the wallet address.
      sshPassword: node.provider === "modal" ? null : nanoid(32),
      sshPubKey: null,
    });
    if (node.provider === "modal") activateLease(lease.id, access);
  } catch (err) {
    await abandonLease(lease.id);
    res.status(503).json({ error: "provisioning_failed", detail: (err as Error).message });
    return;
  }

  const jobId = nanoid(10);
  let result;
  try {
    result = await providerFor(node.provider).exec({
      leaseId: lease.id,
      nodeId: node.id,
      jobId,
      timeoutMs: budgetMs,
      payload: job.payload,
      notebook: job.notebook,
    });
  } catch (err) {
    const settled = await closeLease(lease.id, "run-stopped");
    const message = (err as Error).message || "notebook execution failed";
    const left = settled?.balance ?? (await creditBalance(payer));
    const exhausted = !!job.notebook && left <= 0;
    res.status(exhausted ? 402 : 502).json({
      error: exhausted ? "credit_exhausted" : message,
      detail: exhausted
        ? "run stopped when prepaid credit ran out. Charged for the seconds used."
        : message,
      ...(settled
        ? {
            execution: {
              nodeId: node.id,
              seconds: settled.usedSeconds,
              costAtomic: String(settled.chargedAtomic),
              balance: String(settled.balance),
            },
          }
        : {}),
    });
    return;
  }

  if (!(await paid.settle(res))) {
    await abandonLease(lease.id);
    return;
  }

  // Tear down and bill the seconds it took. This is the only debit.
  const settled = await closeLease(lease.id, "run-complete");
  const body: RunResponse = {
    jobId,
    ok: result.ok,
    result: result.result,
    ...(result.notebook ? { notebook: result.notebook, artifacts: result.artifacts ?? [] } : {}),
    execution: {
      nodeId: node.id,
      seconds: settled?.usedSeconds ?? 0,
      costAtomic: String(settled?.usedAtomic ?? 0),
      balance: String(settled?.balance ?? (await creditBalance(payer))),
    },
  };
  res.json(body);
}

// Canonical. Lease token optional — with it you run in your own machine, without
// it Tendril finds one for you.
router.post("/x402/run", guard(run));
// Legacy alias — lease-only, and `:id` must still match the token, as it always did.
router.post("/lease/:id/run", guard(run));

router.get("/lease/:id", guard((req: Request, res: Response) => {
  const lease = requireLease(req, res);
  if (!lease) return;
  res.json({ lease });
}));

// ─────────────────────────── helpers ───────────────────────────

/** Smallest hosted SKU. Not a pool node — only notebook upload uses it. */
function pickNotebookHost(): ComputeNode | null {
  const node = hostedCatalog().find((n) => n.id === "hosted-cpu-2");
  if (!node || nodeBusy(node.id)) return null;
  return node;
}

function readSurface(req: Request): "ssh" | "jupyter" | null {
  const q = req.query.surface;
  const body = (req.body as { surface?: unknown } | undefined)?.surface;
  const raw = typeof q === "string" ? q : typeof body === "string" ? body : "ssh";
  return raw === "ssh" || raw === "jupyter" ? raw : null;
}

function readJob(body: unknown): JobInput | null {
  const b = body as { payload?: unknown; notebook?: unknown } | null;
  const hasPayload = typeof b?.payload === "string";
  const notebook = b?.notebook;
  const hasNotebook = notebook !== undefined && notebook !== null;
  if (hasPayload === hasNotebook) return null;
  if (hasNotebook) {
    if (typeof notebook !== "object" || Array.isArray(notebook)) return null;
    if (JSON.stringify(notebook).length > NOTEBOOK_MAX_BYTES) return null;
    return { notebook: notebook as Record<string, unknown> };
  }
  return { payload: b?.payload as string };
}

function jobError(body: unknown): string {
  const b = body as { payload?: unknown; notebook?: unknown } | null;
  const hasPayload = typeof b?.payload === "string";
  const notebook = b?.notebook;
  const hasNotebook = notebook !== undefined && notebook !== null;
  if (hasPayload && hasNotebook) return "pass payload or notebook, not both";
  if (hasNotebook && (typeof notebook !== "object" || Array.isArray(notebook))) {
    return "notebook must be a JSON object";
  }
  if (hasNotebook && JSON.stringify(notebook).length > NOTEBOOK_MAX_BYTES) return "notebook_too_large";
  return "payload (string) or notebook (object) required";
}

/** The session address (from `Authorization: Bearer <session>`), or 401. */
function requireSession(req: Request, res: Response): string | null {
  const info = requireSessionInfo(req, res);
  return info?.address ?? null;
}

/** Wallet or custodial session — both can use /wallet and /keys. */
function requireSessionInfo(req: Request, res: Response) {
  const info = sessionFromAuthHeader(req.header("authorization"));
  if (!info) {
    res.status(401).json({ error: "sign in first" });
    return null;
  }
  return info;
}

function requireCustodialSession(
  session: SessionInfo,
  res: Response,
): session is SessionInfo & { userId: string } {
  if (!isCustodialSessionKind(session.kind) || !session.userId) {
    res.status(403).json({ error: "custodial account sign-in required" });
    return false;
  }
  return true;
}

/**
 * The lease this request is for, from the bearer lease token. On the routes that
 * still carry an `:id` the two must agree; on the parameter-free ones the token
 * is the only source, which is no weaker — the token was always the thing being
 * checked, and the path segment only ever had to match it.
 */
function requireLease(req: Request, res: Response) {
  const tokenLeaseId = leaseIdFromAuthHeader(req.header("authorization"));
  if (!tokenLeaseId || (req.params.id !== undefined && tokenLeaseId !== req.params.id)) {
    res.status(401).json({ error: "invalid or missing lease token" });
    return null;
  }
  const lease = getLease(tokenLeaseId);
  if (!lease) {
    res.status(404).json({ error: "lease not found" });
    return null;
  }
  return lease;
}

/** An OpenSSH public key line, as it appears in `authorized_keys`. */
const SSH_PUBKEY =
  /^(ssh-(rsa|ed25519|dss)|ecdsa-sha2-nistp(256|384|521)|sk-(ssh-ed25519|ecdsa-sha2-nistp256)@openssh\.com) +[A-Za-z0-9+/]+={0,3}( +\S+)?$/;

function isOpenSshPubKey(value: string): boolean {
  return SSH_PUBKEY.test(value.trim());
}

router.use("/admin", adminRouter);