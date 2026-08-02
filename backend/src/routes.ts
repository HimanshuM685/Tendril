import { Router, type NextFunction, type Request, type Response } from "express";
import { nanoid } from "nanoid";
import {
  atomicPerHour,
  formatUsdc,
  fundedSeconds,
  type LeaseCloseResponse,
  type PlatformInfo,
  type RunRequest,
  type RunResponse,
  type SandboxLimits,
  type WalletLoginResponse,
  type X402RentResponse,
  type X402TopUpResponse,
} from "@tendril/shared";
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
import { creditBalance, creditTopUp } from "./x402/credit.js";
import {
  addressFromSession,
  issueLeaseToken,
  issueNonce,
  issueSession,
  issueWalletNonce,
  leaseIdFromAuthHeader,
  verifyWalletNonce,
} from "./auth.js";
import { metrics, walletSummary } from "./db.js";
import { getNode, listNodesByOwner, listOnlineNodes } from "./registry.js";
import { abandonLease, closeLease, createLease, getLease, nodeBusy } from "./leases.js";
import { verifyLoginSignature } from "./wallet.js";
import { isNodeConnected, runJob, startContainer } from "./ws.js";
import { config } from "./config.js";

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
  };
  res.json(info);
}));

// ─────────────────────── contributor agent auth (WS hello) ───────────────────────
router.get("/auth/nonce", guard((req: Request, res: Response) => {
  const address = String(req.query.address ?? "");
  if (!address) return res.status(400).json({ error: "address required" });
  res.json({ nonce: issueNonce(address) });
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

// ─────────────────────── discovery (free) ───────────────────────
router.get("/explorer", guard((_req, res) => {
  res.json({ nodes: listOnlineNodes() });
}));

// Public platform metrics — growth series + leaderboards.
router.get("/metrics", guard(async (_req, res) => {
  try {
    res.json(await metrics());
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
  if (!nodeId) {
    return res
      .status(400)
      .json({ error: "node_required", detail: "pass ?nodeId= (or a nodeId body field)" });
  }

  const node = getNode(nodeId);
  if (!node) return res.status(404).json({ error: "node_not_found" });
  if (node.status !== "online" || !isNodeConnected(node.id)) {
    return res.status(409).json({ error: "node_unavailable" });
  }

  const sshPubKey = (req.body as { sshPubKey?: unknown } | undefined)?.sshPubKey ?? null;
  if (sshPubKey !== null && (typeof sshPubKey !== "string" || !isOpenSshPubKey(sshPubKey))) {
    return res.status(400).json({ error: "invalid_ssh_key" });
  }

  const rate = atomicPerHour(node.pricePerHourUsd);
  const gateFee = config.flatRentAtomic;

  const paid = await requirePayment(
    req,
    res,
    "rent",
    gateFee,
    `Open a metered session on ${node.id} (${node.cpuCores} vCPU, ` +
      `${Math.round(node.ramMb / 1024)}GB) for a ${formatUsdc(gateFee)} gate fee. ` +
      `Time is then billed from credit at ${formatUsdc(rate)}/hr for as long as you keep it.`,
    ROUTES.rent,
  );
  if (!paid) return; // 402/400/409 already sent

  if (nodeBusy(node.id)) return res.status(409).json({ error: "node_busy" });

  // The payer is read off the settled transaction — the only trustworthy identity.
  const renter = paid.facts.payer;

  // Checked here, after verify but BEFORE settle: an address with no credit
  // cannot fund a single minute, and taking a gate fee for a session that would
  // be killed on the next watchdog tick is just theft with extra steps.
  const credit = await creditBalance(renter);
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
  const { node, rate, gateFee, fundingAtomic, renterAddr, payerAddr, sshPubKey, paid } = args;

  const lease = createLease({
    nodeId: node.id,
    renterAddr,
    payerAddr,
    payToAddr: node.payToAddr,
    rateAtomicPerHour: rate,
    gateFeeAtomic: gateFee,
    fundingAtomic,
    paymentTxid: paid?.facts.txid ?? null,
  });

  const limits: SandboxLimits = {
    memory: process.env.DEFAULT_SANDBOX_MEMORY ?? "2g",
    cpus: Math.min(node.cpuCores, 4),
    gpus: node.gpu ? "all" : "",
  };

  let access;
  try {
    access = await startContainer({
      nodeId: node.id,
      leaseId: lease.id,
      image: process.env.DEFAULT_SANDBOX_IMAGE ?? "",
      limits,
      // A key beats a password, and is the only option without a session:
      // there is no wallet address to use as one.
      sshPassword: sshPubKey ? null : renterAddr,
      sshPubKey,
    });
  } catch (err) {
    abandonLease(lease.id);
    res.status(503).json({ error: "provisioning_failed", detail: (err as Error).message });
    return;
  }

  // The sandbox is up, so now take the money. If settlement fails the money
  // never moved, and the sandbox shouldn't stay up either: tear it down and free
  // the node. Abandon rather than close — a close would refund a payment that
  // never happened.
  if (paid && !(await paid.settle(res))) {
    abandonLease(lease.id);
    return;
  }

  // Nothing is debited here. The session has only just started; what it costs
  // is not known until it ends, and that is the one place it is billed.

  const body: X402RentResponse = {
    leaseId: lease.id,
    leaseToken: issueLeaseToken(lease.id),
    node: {
      id: node.id,
      cpu: node.cpuCores,
      memoryGb: Math.round(node.ramMb / 1024),
      gpu: node.gpu,
      pricePerHourUsd: node.pricePerHourUsd,
    },
    ssh: access,
    startedAt: new Date(lease.startedAt).toISOString(),
    fundedUntil: Number.isFinite(lease.expiresAt)
      ? new Date(lease.expiresAt).toISOString()
      : "never",
    billing: {
      rateAtomicPerHour: String(rate),
      gateFeeAtomic: String(gateFee),
      creditAtomic: String(fundingAtomic),
      fundedSeconds: fundedSeconds(fundingAtomic, rate),
      asset,
    },
    payment: paid ? { txid: paid.facts.txid, network: config.x402Network } : null,
  };
  res.json(body);
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

// ─────────────────────── lease-token-gated: run / status ───────────────────────
// Pay a flat `FLAT_RUN_ATOMIC` to execute one job, then the ordinary flow: ship
// the payload to the contributor over the websocket and return what it printed.
// The job runs BEFORE the payment settles, so a job that never ran is never paid
// for.
//
// The lease is named by the bearer lease token, so the path needs no parameter
// at all — which is also what keeps every job in one Bazaar catalog entry
// instead of one per lease id ever run.
async function runOnLease(req: Request, res: Response): Promise<void> {
  const lease = requireLease(req, res);
  if (!lease) return;
  if (lease.status !== "active") {
    res.status(409).json({ error: "lease not active" });
    return;
  }
  const payload = (req.body as RunRequest)?.payload;
  if (typeof payload !== "string") {
    res.status(400).json({ error: "payload (string) required" });
    return;
  }

  const paid = await requirePayment(
    req,
    res,
    "run",
    config.flatRunAtomic,
    `Execute one job in your rented sandbox — a flat ${formatUsdc(config.flatRunAtomic)} per job. ` +
      `Send the code as \`payload\`; you get its stdout back. The lease is taken from your ` +
      `\`Authorization: Bearer <leaseToken>\` header, and the job runs before the payment settles.`,
    ROUTES.run,
  );
  if (!paid) return;

  const jobId = nanoid(10);
  let result;
  try {
    result = await runJob(lease.nodeId, lease.id, jobId, payload);
  } catch (err) {
    // Nothing ran, so nothing settles.
    res.status(502).json({ error: (err as Error).message });
    return;
  }
  if (!(await paid.settle(res))) return;

  const body: RunResponse = { jobId, ok: result.ok, result: result.result };
  res.json(body);
}

// Canonical; the lease comes from the token.
router.post("/x402/run", guard(runOnLease));
// Legacy alias — the `:id` must still match the token, as it always did.
router.post("/lease/:id/run", guard(runOnLease));

router.get("/lease/:id", guard((req: Request, res: Response) => {
  const lease = requireLease(req, res);
  if (!lease) return;
  res.json({ lease });
}));

// ─────────────────────────── helpers ───────────────────────────

/** The session address (from `Authorization: Bearer <session>`), or 401. */
function requireSession(req: Request, res: Response): string | null {
  const address = addressFromSession(req.header("authorization"));
  if (!address) {
    res.status(401).json({ error: "sign in with your wallet first" });
    return null;
  }
  return address;
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