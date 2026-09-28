import type { SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";
import { TopUpControl } from "./TopUpControl";

interface Props {
  address: string | null;
  session: Session | null;
  signTransactions: SignTransactions;
  onClose: () => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}

export function TopUpModal({
  address,
  session,
  signTransactions,
  onClose,
  onChanged,
  onError,
}: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Top Up USDC" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Top Up Prepaid Compute</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px" }}>
          <p>
            Deposit USDC to fund your sandboxed SSH leases and one-shot agent runs.
            Charges are prorated to the exact second.
          </p>
          {address ? (
            <div style={{ marginTop: "16px" }}>
              <TopUpControl
                address={address}
                session={session}
                signTransactions={signTransactions}
                onChanged={() => {
                  onChanged();
                }}
                onError={onError}
              />
            </div>
          ) : (
            <p className="muted small" style={{ marginTop: "12px" }}>
              Please connect your Algorand wallet first to deposit USDC.
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
