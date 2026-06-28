import { useEffect, useState } from "react";
import type { LeaseStatus } from "@tendril/shared";
import { type ActiveLease, fetchLease, releaseLease } from "../api";

interface Props {
  lease: ActiveLease;
  onRelease: () => void;
}

export function LeasePanel({ lease, onRelease }: Props) {
  const [now, setNow] = useState(Date.now());
  const [expiresAt, setExpiresAt] = useState(lease.expiresAt);
  const [status, setStatus] = useState<LeaseStatus>("active");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Tick the clock locally for a smooth countdown.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll the server so projected "time left" tracks the balance, and we notice
  // when the wallet runs dry (status flips to "ended").
  useEffect(() => {
    let alive = true;
    const poll = () =>
      fetchLease(lease.leaseId, lease.leaseToken)
        .then((l) => {
          if (!alive) return;
          setExpiresAt(l.expiresAt);
          setStatus(l.status);
        })
        .catch(() => {});
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [lease.leaseId, lease.leaseToken]);

  const remainingMs = Math.max(0, expiresAt - now);
  const mm = Math.floor(remainingMs / 60_000);
  const ss = Math.floor((remainingMs % 60_000) / 1000);
  const ended = status === "ended" || status === "failed";

  function copy(label: string, value: string) {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  async function release() {
    setBusy(true);
    try {
      await releaseLease(lease.leaseId, lease.leaseToken);
      onRelease();
    } finally {
      setBusy(false);
    }
  }

  const { command, password } = lease.access;

  return (
    <div className="lease-panel">
      <div className="lease-head">
        <div>
          <strong>Active session</strong> on <code>{lease.label}</code>
          <div className="muted small">
            lease {lease.leaseId} · {(lease.rateMicroAlgosPerHour / 1e6).toFixed(4)} ALGO/hr
          </div>
        </div>
        <div className="timer" data-expiring={remainingMs < 60_000} title="time left at current balance">
          {mm}:{ss.toString().padStart(2, "0")}
        </div>
        <div className="lease-actions">
          <button className="btn ghost" disabled={busy} onClick={release}>
            Release
          </button>
        </div>
      </div>
      {!ended ? (
        <div className="ssh-access">
          <p className="muted small">Connect over SSH — your wallet address is the password:</p>
          <div className="ssh-row">
            <code className="ssh-code">{command}</code>
            <button className="btn ghost" onClick={() => copy("cmd", command)}>
              {copied === "cmd" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="ssh-row">
            <span className="muted small">password</span>
            <code className="ssh-code">{password}</code>
            <button className="btn ghost" onClick={() => copy("pw", password)}>
              {copied === "pw" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="muted small">
            Billed by the hour, prorated — you're charged for the exact time used when you release.
          </p>
        </div>
      ) : (
        <div className="muted">
          Lease ended — your balance ran out or you released it, and the sandbox was destroyed.
        </div>
      )}
    </div>
  );
}
