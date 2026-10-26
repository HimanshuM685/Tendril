import {
  createGasRequest,
  findGasRequestByAddress,
  findUserById,
  findGasRequestByUserId,
  setGasGrantIneligible,
  setWalletGasGrantIneligible,
  type DbGasRequest,
  type DbUser,
} from "./db.js";
import { googleAccountInfo } from "./custodialSign.js";
import { config } from "./config.js";
import { nanoid } from "nanoid";

/** Pure rule: self-fund before any gas request permanently disqualifies the grant. */
export function shouldMarkGasGrantIneligible(
  hasGasRequestRow: boolean,
  algoMicro: number,
  usdcAtomic = 0,
): boolean {
  return !hasGasRequestRow && (algoMicro > 0 || usdcAtomic > 0);
}

/** Google custodial: observe on-chain balance; flip eligibility when self-funded. */
export async function syncGoogleGasGrantEligibility(userId: string, address: string): Promise<void> {
  const existing = await findGasRequestByUserId(userId);
  if (existing) return;

  const { algoMicro, usdcAtomic } = await googleAccountInfo(address);
  if (shouldMarkGasGrantIneligible(false, algoMicro, usdcAtomic)) {
    await setGasGrantIneligible(userId);
  }
}

/** Connected wallet: same rules keyed by address. */
export async function syncWalletGasGrantEligibility(address: string): Promise<void> {
  const existing = await findGasRequestByAddress(address);
  if (existing) return;

  const { algoMicro, usdcAtomic } = await googleAccountInfo(address);
  if (shouldMarkGasGrantIneligible(false, algoMicro, usdcAtomic)) {
    await setWalletGasGrantIneligible(address);
  }
}

/** @deprecated use syncGoogleGasGrantEligibility */
export const syncGasGrantEligibility = syncGoogleGasGrantEligibility;

/** Whether a user may submit a new gas request (API + UI). */
export function canSubmitGasGrant(
  gasGrantEligible: boolean,
  algoMicro: number,
  hasGasRequestRow: boolean,
  usdcAtomic = 0,
): boolean {
  return gasGrantEligible && algoMicro === 0 && usdcAtomic === 0 && !hasGasRequestRow;
}

/**
 * New custodial accounts start with no ALGO. Create their onboarding request
 * during login instead of waiting for the wallet UI to make a second request.
 */
export function shouldCreateCustodialGasRequest(
  isNewAccount: boolean,
  gasGrantEligible: boolean,
  algoMicro: number,
  hasGasRequestRow: boolean,
  usdcAtomic = 0,
): boolean {
  return isNewAccount && canSubmitGasGrant(gasGrantEligible, algoMicro, hasGasRequestRow, usdcAtomic);
}

/**
 * A request may have delivered gas before the process failed during opt-in.
 * The persisted delivery txid is authoritative; balance covers the crash
 * window between chain confirmation and recording that txid.
 */
export function shouldSendGasGrant(
  hasUsdcOptIn: boolean,
  gasDeliveryTxid: string | null,
  algoMicro: number,
  amountMicro: number,
): boolean {
  return !hasUsdcOptIn && !gasDeliveryTxid && algoMicro < amountMicro;
}

/** Ensure a custodial user has its one onboarding request, if eligible. */
export async function ensureCustodialGasRequest(user: DbUser): Promise<DbGasRequest | null> {
  const existing = await findGasRequestByUserId(user.id);
  if (existing) return existing;

  await syncGoogleGasGrantEligibility(user.id, user.address);
  const fresh = await findUserById(user.id);
  if (!fresh) return null;

  const { algoMicro, usdcAtomic } = await googleAccountInfo(fresh.address);
  if (!shouldCreateCustodialGasRequest(true, fresh.gas_grant_eligible, algoMicro, false, usdcAtomic)) {
    return null;
  }

  try {
    return await createGasRequest({
      id: nanoid(),
      userId: fresh.id,
      email: fresh.email,
      name: fresh.name,
      address: fresh.address,
      amountMicro: config.gasGrantMicroAlgos,
    });
  } catch (error) {
    // Concurrent first logins race on the user/address unique indexes.
    if ((error as { code?: string }).code !== "23505") throw error;
    return (await findGasRequestByUserId(fresh.id)) ?? (await findGasRequestByAddress(fresh.address));
  }
}
