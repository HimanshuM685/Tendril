interface Props {
  summary: string;
  details: string;
  busy: boolean;
  onApprove: () => void;
  onCancel: () => void;
}

/** Mandatory approval before any server-side custodial signature. */
export function SignConfirmModal({ summary, details, busy, onApprove, onCancel }: Props) {
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
          <p className="muted small">Your custodial wallet will sign this on the server after you approve.</p>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" type="button" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="button" disabled={busy} onClick={onApprove}>
            {busy ? "Signing…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
