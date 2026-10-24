import { useState } from "react";

interface Props {
  summary: string;
  details: string;
  busy: boolean;
  onApprove: (pin: string) => void;
  onCancel: () => void;
}

/** Mandatory approval plus the 4-digit PIN before a custodial signature. */
export function SignConfirmModal({ summary, details, busy, onApprove, onCancel }: Props) {
  const [pin, setPin] = useState("");
  const ready = /^\d{4}$/.test(pin);

  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-label="Confirm transaction"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// CONFIRM</span>
          <button
            className="modal-close"
            aria-label="Close"
            disabled={busy}
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            <strong>{summary}</strong>
          </p>
          <p className="muted small">{details}</p>
          <p className="muted small">Enter your 4-digit PIN. The custodial wallet signs only after it matches.</p>
          <label className="muted small" htmlFor="tx-pin">
            Transaction PIN
            <input
              id="tx-pin"
              className="modal-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={pin}
              disabled={busy}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="button" disabled={busy || !ready} onClick={() => onApprove(pin)}>
            {busy ? "Signing…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
