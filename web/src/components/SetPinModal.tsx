import { useState } from "react";

interface Props {
  busy: boolean;
  error: string | null;
  onSave: (pin: string) => void;
}

/** Shown once, on the next visit, when a social account has no transaction PIN. */
export function SetPinModal({ busy, error, onSave }: Props) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const match = /^\d{4}$/.test(pin) && pin === again;

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label="Set transaction PIN" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>// SET PIN</span>
        </div>
        <div className="modal-body">
          <p>
            Your PIN is not set. Choose a <strong>4-digit PIN</strong> for future transactions.
          </p>
          <p className="muted small">
            Approve will ask for this PIN. It is not your email password, and wallet sign-in does not use it.
          </p>
          <label className="muted small" htmlFor="new-pin">
            PIN
            <input
              id="new-pin"
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
          <label className="muted small" htmlFor="new-pin-again">
            Repeat PIN
            <input
              id="new-pin-again"
              className="modal-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={again}
              disabled={busy}
              onChange={(e) => setAgain(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </label>
          {pin.length === 4 && again.length === 4 && pin !== again && (
            <p className="modal-err">Those PINs do not match.</p>
          )}
          {error && <p className="modal-err">{error}</p>}
        </div>
        <div className="modal-actions">
          <button className="btn" type="button" disabled={busy || !match} onClick={() => onSave(pin)}>
            {busy ? "Saving…" : "Save PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
