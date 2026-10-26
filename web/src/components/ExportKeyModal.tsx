import { useEffect, useState } from "react";

interface Props {
  authType: "google" | "email";
  /** Set when Google just re-checked this account. */
  exportGrant?: string | null;
  onClose: () => void;
  onExport: (proof: { password?: string; exportGrant?: string }) => Promise<string>;
  onVerifyGoogle?: () => Promise<void>;
}

export function ExportKeyModal({ authType, exportGrant, onClose, onExport, onVerifyGoogle }: Props) {
  const [step, setStep] = useState<"warn" | "show">(exportGrant ? "warn" : "warn");
  const [password, setPassword] = useState("");
  const [ack, setAck] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Google re-auth completes in the popup and updates exportGrant asynchronously.
  // Clear the redirect state so "Show phrase" becomes clickable after success.
  useEffect(() => {
    if (exportGrant) setBusy(false);
  }, [exportGrant]);

  async function doExport() {
    setBusy(true);
    setErr(null);
    try {
      const proof = authType === "email" ? { password } : { exportGrant: exportGrant ?? "" };
      setMnemonic(await onExport(proof));
      setStep("show");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verifyGoogle() {
    if (!onVerifyGoogle) return;
    setBusy(true);
    setErr(null);
    try {
      await onVerifyGoogle();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  function close() {
    setMnemonic("");
    setPassword("");
    setAck(false);
    onClose();
  }

  const emailReady = ack && password.length > 0;
  const googleReady = !!exportGrant;

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-label="Export private key"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// EXPORT KEY</span>
          <button className="modal-close" aria-label="Close" onClick={close}>
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
              <label className="muted small">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />{" "}
                I understand anyone with this phrase controls the wallet
              </label>
              {authType === "email" ? (
                <label className="muted small" htmlFor="export-password">
                  Account password
                  <input
                    id="export-password"
                    className="modal-input"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              ) : googleReady ? (
                <p className="muted small">Google account verified. You can show the phrase now.</p>
              ) : (
                <p className="muted small">
                  Sign in with Google again. The phrase stays hidden until that check succeeds.
                </p>
              )}
              {err && <p className="modal-err">{err}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" type="button" onClick={close}>
                Cancel
              </button>
              {authType === "google" && !googleReady ? (
                <button className="btn" type="button" disabled={busy || !ack} onClick={() => void verifyGoogle()}>
                  {busy ? "Redirecting…" : "Verify with Google"}
                </button>
              ) : (
                <button
                  className="btn"
                  type="button"
                  disabled={busy || (authType === "email" ? !emailReady : !googleReady)}
                  onClick={() => void doExport()}
                >
                  {busy ? "Loading…" : "Show phrase"}
                </button>
              )}
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
              <button className="btn" type="button" onClick={close}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
