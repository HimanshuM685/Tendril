import {
  findGasRequestByAddress,
  findGasRequestByUserId,
  setGasGrantIneligible,
  setWalletGasGrantIneligible,
} from "./db.js";
import { googleAccountInfo } from "./custodialSign.js";

/** Pure rule: self-fund before any gas request permanently disqualifies the grant. */
export function shouldMarkGasGrantIneligible(
  hasGasRequestRow: boolean,
  algoMicro: number,
): boolean {
  return !hasGasRequestRow && algoMicro > 0;
}

/** Google custodial: observe on-chain balance; flip eligibility when self-funded. */
export async function syncGoogleGasGrantEligibility(userId: string, address: string): Promise<void> {
  const existing = await findGasRequestByUserId(userId);
  if (existing) return;

  const { algoMicro } = await googleAccountInfo(address);
  if (shouldMarkGasGrantIneligible(false, algoMicro)) {
    await setGasGrantIneligible(userId);
  }
}

/** Connected wallet: same rules keyed by address. */
export async function syncWalletGasGrantEligibility(address: string): Promise<void> {
  const existing = await findGasRequestByAddress(address);
  if (existing) return;

  const { algoMicro } = await googleAccountInfo(address);
  if (shouldMarkGasGrantIneligible(false, algoMicro)) {
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
): boolean {
  return gasGrantEligible && algoMicro === 0 && !hasGasRequestRow;
}
