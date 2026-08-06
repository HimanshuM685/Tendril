import { findGasRequestByUserId, setGasGrantIneligible } from "./db.js";
import { googleAccountInfo } from "./custodialSign.js";

/** Pure rule: self-fund before any gas request permanently disqualifies the grant. */
export function shouldMarkGasGrantIneligible(
  hasGasRequestRow: boolean,
  algoMicro: number,
): boolean {
  return !hasGasRequestRow && algoMicro > 0;
}

/** Observe on-chain balance; flip eligibility when user funded themselves. */
export async function syncGasGrantEligibility(userId: string, address: string): Promise<void> {
  const existing = await findGasRequestByUserId(userId);
  if (existing) return;

  const { algoMicro } = await googleAccountInfo(address);
  if (shouldMarkGasGrantIneligible(false, algoMicro)) {
    await setGasGrantIneligible(userId);
  }
}

/** Whether a user may submit a new gas request (API + UI). */
export function canSubmitGasGrant(
  gasGrantEligible: boolean,
  algoMicro: number,
  hasGasRequestRow: boolean,
): boolean {
  return gasGrantEligible && algoMicro === 0 && !hasGasRequestRow;
}
