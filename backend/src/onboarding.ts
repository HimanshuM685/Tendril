import { nanoid } from "nanoid";
import { config } from "./config.js";
import { optInUsdc } from "./custodialSign.js";
import { createGasRequest, resolveGasRequest, type DbUser } from "./db.js";
import { hasOptedIn, payoutsEnabled, platformBalances, sendAlgo } from "./payout.js";

/**
 * First Google sign-in: send the gas grant and opt the new custodial wallet into
 * USDC, so the user can top up without asking an admin.
 *
 * The grant is recorded as an ordinary gas request, so it shows in the admin
 * dashboard and the unique address index stops a second, manual one. If the
 * transfer can't go out, the request stays pending for an admin to approve.
 */
export async function onboardGoogleUser(user: DbUser): Promise<void> {
  if (!config.signupGasGrant || !payoutsEnabled()) {
    console.log(`[onboarding] ${user.address}: auto gas disabled; manual request flow applies`);
    return;
  }
  const amount = config.gasGrantMicroAlgos;
  const row = await createGasRequest({
    id: nanoid(), userId: user.id, email: user.email, name: user.name, address: user.address, amountMicro: amount,
  });
  if ((await platformBalances()).algoMicro < amount + 10_000) {
    console.warn(`[onboarding] ${user.address}: treasury low on ALGO; grant left pending for admin`);
    return;
  }
  const grant = await sendAlgo(user.address, amount);
  await resolveGasRequest(row.id, "accepted", "auto-signup", { txid: grant });
  console.log(`[onboarding] ${user.address}: gas ${amount} µALGO tx ${grant}`);

  if (await hasOptedIn(user.address)) return;
  const optIn = await optInUsdc(user);
  console.log(`[onboarding] ${user.address}: USDC opt-in tx ${optIn}`);
}
