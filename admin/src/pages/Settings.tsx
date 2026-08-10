import { useEffect, useState } from "react";
import { useAdminAuth } from "../App";
import type { AdminSettings } from "@tendril/shared";
import { fetchAdminSettings, updateAdminSettings } from "../lib/api";

export function Settings() {
  const { token } = useAdminAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminSettings(token)
      .then(setSettings)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  async function toggleEmailAuth() {
    if (!token || !settings) return;
    setBusy(true);
    setErr(null);
    try {
      const next = !settings.emailAuthEnabled;
      setSettings(await updateAdminSettings(token, { emailAuthEnabled: next }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (err && !settings) return <p className="error">{err}</p>;
  if (!settings) return <p className="kicker">Loading settings…</p>;

  return (
    <>
      <header className="admin-header">
        <h1>Settings</h1>
        <p className="kicker muted">Platform auth options</p>
      </header>

      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p className="kicker">Email + password sign-in</p>
            <p className="small muted" style={{ marginTop: 8 }}>
              When enabled, users can sign up and log in with email and password (no verification).
              Each account gets a custodial Algorand wallet, same as Google sign-in.
            </p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.emailAuthEnabled}
              disabled={busy}
              onChange={() => void toggleEmailAuth()}
            />
            <span className="kicker">{settings.emailAuthEnabled ? "On" : "Off"}</span>
          </label>
        </div>
        {err && <p className="error" style={{ marginTop: 16 }}>{err}</p>}
      </div>
    </>
  );
}
