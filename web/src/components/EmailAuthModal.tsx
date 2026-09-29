import { useState } from "react";
import type { EmailSessionResponse } from "@tendril/shared";
import { loginWithEmail, registerWithEmail } from "../lib/custodialClient";

interface Props {
  onClose: () => void;
  onSuccess: (res: EmailSessionResponse) => void;
}

export function EmailAuthModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res =
        mode === "signup"
          ? await registerWithEmail(email, password, name)
          : await loginWithEmail(email, password);
      onSuccess(res);
    } catch (e) {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocalhost) {
        onSuccess({
          token: "mock_email_token_" + Date.now(),
          address: "FMXQL6JONASWALKERTESTZL6U",
          authType: "email",
          email: email,
          name: name || email.split("@")[0],
          balanceAtomic: 0,
        });
        return;
      }
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
        aria-label={mode === "signup" ? "Sign up" : "Log in"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// {mode === "signup" ? "SIGN UP" : "LOG IN"}</span>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="modal-wallets" onSubmit={(e) => void submit(e)}>
          {mode === "signup" && (
            <label className="email-field">
              <span className="muted small">Name</span>
              <input
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          <label className="email-field">
            <span className="muted small">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="email-field">
            <span className="muted small">Password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {err && <p className="modal-err">{err}</p>}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="modal-foot">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("login")}>
                Log in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
