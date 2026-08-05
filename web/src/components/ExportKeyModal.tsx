import { useState } from "react";

interface Props {
  onClose: () => void;
  onExport: () => Promise<string>;
}

export function ExportKeyModal({ onClose, onExport }: Props) {
  const [step, setStep] = useState<"warn" | "show">("warn");
  const [mnemonic, setMnemonic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doExport() {
    setBusy(true);
    setErr(null);
    try {
      setMnemonic(await onExport());
      setStep("show");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-label="Export private key"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// EXPORT KEY</span>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {step === "warn" ? (
          <>
            <div className="modal-body">
              <p>
                This reveals your <strong>25-word recovery phrase</strong>. Anyone with it controls
                your wallet and funds.
              </p>
              <p className="muted small">Store it offline. Never share it or paste it into chat.</p>
              {err && <p className="modal-err">{err}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="btn" type="button" disabled={busy} onClick={doExport}>
                {busy ? "Loading…" : "I understand — show phrase"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body">
              <p className="muted small">Copy now — this dialog is the only place we show it.</p>
              <textarea
                className="modal-input export-mnemonic"
                readOnly
                rows={4}
                value={mnemonic}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="modal-actions">
              <button className="btn" type="button" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
