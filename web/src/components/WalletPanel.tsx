import type { WalletSummary } from "@tendril/shared";
import { formatAlgo, formatAlgoExact } from "@tendril/shared";
import { TopUpControl } from "./TopUpControl";

type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

interface Props {
  wallet: WalletSummary | null;
  address: string;
  token: string;
  signTransactions: SignTransactions;
  onChanged: () => void;
  onError: (msg: string) => void;
}

/** Prepaid balance + a top-up control + deposit/spend history. */
export function WalletPanel({ wallet, address, token, signTransactions, onChanged, onError }: Props) {
  const balance = wallet?.balanceMicroAlgos ?? 0;

  return (
    <section className="wallet-panel">
      <div className="wallet-balance">
        <span className="muted small">Prepaid balance</span>
        <strong className="balance" title={formatAlgoExact(balance)}>{formatAlgo(balance)}</strong>
      </div>

      <TopUpControl
        address={address}
        token={token}
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
                    +{formatAlgoExact(t.amountMicroAlgos)}{" "}
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
                    −{formatAlgoExact(c.amountMicroAlgos)}{" "}
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
