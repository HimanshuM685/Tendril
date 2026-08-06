import { useEffect, useState } from "react";
import { adminLoginUrl, fetchAdminEnabled } from "../lib/api";

export function Login() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchAdminEnabled()
      .then(setEnabled)
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === null) {
    return (
      <div className="login-page">
        <p className="kicker">Loading…</p>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="login-page">
        <div className="login-card panel">
          <p className="display">Admin</p>
          <p className="error" style={{ marginTop: 24 }}>
            Admin auth not configured on registry. Set ADMIN_EMAILS and Google OAuth vars.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="display">Tendril Admin</p>
        <p className="kicker muted" style={{ marginBottom: 32 }}>
          Google sign-in · allowlist only
        </p>
        <a className="btn" href={adminLoginUrl()}>
          Continue with Google
        </a>
      </div>
    </div>
  );
}
