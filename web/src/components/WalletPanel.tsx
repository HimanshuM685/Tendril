import type { WalletSummary } from "@tendril/shared";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";
import { TopUpControl } from "./TopUpControl";
import type { SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";

interface Props {
  wallet: WalletSummary | null;
  address: string;
  session?: Session | null;
  signTransactions: SignTransactions;
  onChanged: () => void;
  onError: (msg: string) => void;
}

/** Prepaid balance + a top-up control + deposit/spend history. */
export function WalletPanel({
  wallet,
  address,
  session,
  signTransactions,
  onChanged,
  onError,
}: Props) {
  const balance = wallet?.balanceAtomic ?? 0;

  return (
    <section className="wallet-panel">
      <div className="wallet-balance">
        <span className="muted small">Prepaid balance</span>
        <strong className="balance" title={formatUsdcExact(balance)}>{formatUsdc(balance)}</strong>
      </div>

      <TopUpControl
        address={address}
        session={session}
        signTransactions={signTransactions}
        onChanged={onChanged}
        onError={onError}
      />

      {wallet && (wallet.topups.length > 0 || wallet.charges.length > 0) && (
        <details className="history">
          <summary className="muted small">History</summary>
          <div className="history-grid">
            <div>
              <span className="muted small">Top-ups</span>
              <ul>
                {wallet.topups.slice(0, 8).map((t) => (
                  <li key={t.txid}>
                    +{formatUsdcExact(t.amountAtomic)}{" "}
                    <span className="muted small">{new Date(t.createdAt).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="muted small">Usage</span>
              <ul>
                {wallet.charges.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    −{formatUsdcExact(c.amountAtomic)}{" "}
                    <span className="muted small">
                      {c.seconds}s
                      {c.payToAddr && (
                        <> · → {c.payToAddr.slice(0, 6)}…{c.payToAddr.slice(-4)}</>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}
    </section>
  );
}
