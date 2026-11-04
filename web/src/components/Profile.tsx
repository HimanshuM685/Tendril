import { useEffect, useState } from "react";
import type { Session } from "../App";
import { fetchMe, patchMe } from "../api";

interface Props {
  session: Session | null;
  onName: (name: string) => void;
  onConnect: () => void;
}

export function Profile({ session, onName, onConnect }: Props) {
  const [name, setName] = useState(session?.name ?? "");
  const [sshPubKey, setSshPubKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!session);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const google = session?.authType === "google";

  useEffect(() => {
    if (!session) return;
    let alive = true;
    setLoading(true);
    fetchMe(session.token)
      .then((me) => {
        if (!alive) return;
        setName(me.name ?? "");
        setSshPubKey(me.sshPubKey ?? "");
        setSavedKey(me.sshPubKey);
        if (me.name) onName(me.name);
      })
      .catch((err) => {
        if (alive) setError((err as Error).message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [session?.token]);

  async function save(patch: { name?: string; sshPubKey?: string | null }) {
    if (!session) return;
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const me = await patchMe(session.token, patch);
      setName(me.name ?? "");
      setSshPubKey(me.sshPubKey ?? "");
      setSavedKey(me.sshPubKey);
      if (me.name) onName(me.name);
      setSaved(patch.sshPubKey === null ? "Public key removed." : "Saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result.trim() : "";
      setSshPubKey(text);
    };
    reader.readAsText(file);
  }

  if (!session) {
    return (
      <div className="explore-dashboard">
        <h1 className="explore-greeting">Profile</h1>
        <p className="explore-subtitle">Sign in to set your name and SSH public key.</p>
        <button type="button" className="btn" onClick={onConnect}>
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div className="explore-dashboard">
      <h1 className="explore-greeting">Profile</h1>
      <p className="explore-subtitle">
        SSH uses this public key. Paste a line from <code>id_ed25519.pub</code>, or pick that file.
        The private key stays on your machine.
      </p>

      {error && (
        <div className="error" style={{ margin: "16px 0" }}>
          <span>{error}</span>
          <button className="error-dismiss" aria-label="Dismiss error" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}
      {saved && <p className="muted small">{saved}</p>}

      {loading ? (
        <p className="muted">Loading profile…</p>
      ) : (
        <form
          className="explore-card"
          style={{ maxWidth: 640, gap: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            void save(
              google
                ? { sshPubKey: sshPubKey.trim() || null }
                : { name: name.trim(), sshPubKey: sshPubKey.trim() || null },
            );
          }}
        >
          <label className="email-field">
            <span className="muted small">Name</span>
            <input
              type="text"
              autoComplete="name"
              maxLength={80}
              required={!google}
              readOnly={google}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {google && <span className="muted small">Comes from your Google account.</span>}
          </label>

          <label className="email-field">
            <span className="muted small">SSH public key</span>
            <textarea
              rows={4}
              spellCheck={false}
              placeholder="ssh-ed25519 AAAA… you@host"
              value={sshPubKey}
              onChange={(e) => setSshPubKey(e.target.value)}
            />
          </label>

          <label className="email-field">
            <span className="muted small">Or upload a .pub file</span>
            <input
              type="file"
              accept=".pub,text/plain"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <div className="ca-buttons">
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            {savedKey && (
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => void save({ sshPubKey: null })}
              >
                Remove public key
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
