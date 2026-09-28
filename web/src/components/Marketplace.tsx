import type { WalletSummary } from "@tendril/shared";
import type { Session } from "../App";
import type { ActiveLease } from "../api";
import type { SignTransactions } from "../lib/x402Client";
import { Explore } from "./Explore";
import { Contribute } from "./Contribute";

interface Props {
  tab: "explore" | "contribute";
  session: Session | null;
  wallet: WalletSummary | null;
  activeAddress: string | null;
  signTransactions: unknown;
  onWalletChanged: () => void;
  onError: (e: string | null) => void;
  lease: ActiveLease | null;
  onLeased: (l: ActiveLease | null) => void;
  onOpenTopUp?: () => void;
  onOpenConnectWallet?: () => void;
}

/** The rentable marketplace — backs both /explore and /contribute. */
export function Marketplace({
  tab,
  session,
  wallet,
  activeAddress,
  signTransactions,
  onWalletChanged,
  onError,
  lease,
  onLeased,
  onOpenTopUp,
  onOpenConnectWallet,
}: Props) {
  if (tab === "explore") {
    return (
      <Explore
        session={session}
        activeAddress={activeAddress}
        wallet={wallet}
        signTransactions={signTransactions as SignTransactions}
        balanceAtomic={wallet?.balanceAtomic ?? 0}
        lease={lease}
        onLeased={onLeased}
        onOpenTopUp={onOpenTopUp}
        onOpenConnectWallet={onOpenConnectWallet}
      />
    );
  }

  return (
    <Contribute
      address={activeAddress}
      session={session}
      wallet={wallet}
      signTransactions={signTransactions as SignTransactions}
      onWalletChanged={onWalletChanged}
      onError={onError}
      onOpenTopUp={onOpenTopUp}
    />
  );
}
