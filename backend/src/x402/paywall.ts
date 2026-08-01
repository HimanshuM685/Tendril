/**
 * "Pay this much to execute" — the reusable half of an x402 endpoint.
 *
 * Every payable route in Tendril has the same shape, and it is deliberately not
 * a middleware: a middleware settles around the handler, which would take the
 * caller's money before we know the work succeeded. Instead the handler drives
 * it in two explicit halves, with the work in between:
 *
 *   const paid = await requirePayment(req, res, "run", price, "…");
 *   if (!paid) return;                  // 402/400/409 already sent
 *   ...do the work; bail out freely, nothing has settled...
 *   if (!(await paid.settle(res))) return;   // 402 already sent
 *   res.json(body);
 *
 * Until `settle()` is called nothing has gone on chain, so any failure between
 * the two halves costs the caller nothing.
 */
import type { Request, Response } from "express";
import {
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
  type PaymentRoute,
} from "./server.js";
import type { RouteDiscovery } from "./discovery.js";

/** A verified-but-unsettled payment, waiting on the work it paid for. */
export interface PaidRequest {
  /** Who is paying and what the transaction is — read off the transaction itself. */
  facts: PaymentFacts;
  /** What they are paying, in atomic units. */
  amountAtomic: number;
  /**
   * Submit the payment now that the work is done. Sends the 402 itself and
   * returns false if settlement fails, so the caller only has to `return`.
   */
  settle(res: Response): Promise<boolean>;
}

/**
 * Demand `priceAtomic` for this request. Returns null when the caller still has
 * to pay (or got something wrong) — the response has already been sent in that
 * case, so the handler just returns.
 *
 * Nothing is submitted here: `verify()` only simulates the group.
 */
export async function requirePayment(
  req: Request,
  res: Response,
  route: PaymentRoute,
  priceAtomic: number,
  description: string,
  discovery?: RouteDiscovery,
): Promise<PaidRequest | null> {
  let payload;
  try {
    payload = readPayment(req);
  } catch {
    res.status(400).json({ error: "malformed_payment" });
    return null;
  }

  if (!payload) {
    await challenge(req, res, priceAtomic, description, undefined, discovery).catch((err) =>
      fail(res, err),
    );
    return null;
  }

  let facts: PaymentFacts;
  try {
    facts = paymentFacts(payload);
  } catch {
    res.status(400).json({ error: "malformed_payment" });
    return null;
  }

  // A settled payment buys its work once. Replaying it would be a second lease
  // or a second job execution on somebody else's money.
  const seen = await findPayment(facts.intentHash);
  if (seen?.status === "settled") {
    res.status(409).json({ error: "payment_already_used", txid: seen.txid });
    return null;
  }

  let reqs;
  let verified;
  try {
    // Requirements are rebuilt right now, so a payment for the wrong amount,
    // asset or recipient fails here — before anything is submitted.
    reqs = await requirements(priceAtomic);
    verified = await facilitator.verify(payload, reqs);
  } catch (err) {
    fail(res, err);
    return null;
  }
  if (!verified.isValid) {
    await challenge(
      req,
      res,
      priceAtomic,
      description,
      verified.invalidReason ?? "invalid_payment",
      discovery,
    ).catch((err) => fail(res, err));
    return null;
  }

  return {
    facts,
    amountAtomic: priceAtomic,
    async settle(response: Response): Promise<boolean> {
      // The pending row goes in first: a crash between submit and commit then
      // leaves a marker naming the txid, rather than money on chain that
      // nothing in the database knows about.
      await markPending(facts, route, priceAtomic);
      const settlement = await facilitator.settle(payload, reqs);
      if (!settlement.success) {
        await markFailed(facts.txid);
        response
          .status(402)
          .json({ error: "settlement_failed", detail: settlement.errorReason });
        return false;
      }
      await markSettled(facts.txid);
      sendReceipt(response, settlement);
      return true;
    },
  };
}
