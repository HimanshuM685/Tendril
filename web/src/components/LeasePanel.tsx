import { useEffect, useState } from "react";
import type { LeaseStatus } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import { type ActiveLease, fetchLease, releaseLease } from "../api";
import { writeClipboard } from "../clipboard";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { Session } from "../App";
import { isCustodialSession } from "../lib/session";

interface Props {
  lease: ActiveLease;
  session?: Session | null;
  onRelease: () => void;
}

/** mm:ss under an hour, h:mm:ss above — a long balance shouldn't read "125:33". */
function fmtCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function LeasePanel({ lease, session, onRelease }: Props) {
  const { runCustodialAction } = useCustodialSign();
  const [now, setNow] = useState(Date.now());
  const [expiresAt, setExpiresAt] = useState(lease.expiresAt);
  const [graceUntil, setGraceUntil] = useState<number | null>(null);
  const [status, setStatus] = useState<LeaseStatus>("active");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const isCustodial = isCustodialSession(session);

  const ended = status === "ended" || status === "failed";

  // Tick the clock locally for a smooth countdown.
  useEffect(() => {
    if (ended) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ended]);

  // Poll the server so projected "time left" tracks the balance, and we notice
  // when the wallet runs dry (status flips to "ended"). Stops once the lease is
  // over and pauses while the tab is hidden.
  useEffect(() => {
    if (ended) return;
    let alive = true;
    const poll = () =>
      fetchLease(lease.leaseId, lease.leaseToken)
        .then((l) => {
          if (!alive) return;
          setExpiresAt(l.expiresAt);
          setGraceUntil(l.graceUntil);
          setStatus(l.status);
        })
        .catch(() => {});
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer) return;
      poll();
      timer = setInterval(poll, 4000);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lease.leaseId, lease.leaseToken, ended]);

  // Out of credit but not cut off yet: the server hands over a short grace
  // window to save work in. Count that down instead of a stuck zero, and say so.
  const inGrace = graceUntil !== null && graceUntil > now;
  const remainingMs = Math.max(0, (inGrace ? graceUntil : expiresAt) - now);

  function copy(label: string, value: string) {
    void writeClipboard(value).then((ok) => {
      if (!ok) return; // don't claim "Copied!" if the copy actually failed
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
    });
  }

  // Escape closes the confirm — releasing is destructive, so make backing out easy.
  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setConfirming(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirming]);

  async function release() {
    setConfirming(false);
    setBusy(true);
    setError(null);
    try {
      if (isCustodial && session) {
        await runCustodialAction(session.token, {
          action: "release",
          leaseId: lease.leaseId,
          leaseToken: lease.leaseToken,
        });
      } else {
        await releaseLease(lease.leaseId, lease.leaseToken);
      }
      onRelease();
    } catch (e) {
      if ((e as Error).message === "cancelled") return;
      // Keep the panel open — the sandbox may still be live and billing.
      setError(`Release failed — ${(e as Error).message}. Try again.`);
    } finally {
      setBusy(false);
    }
  }

  const jupyter = lease.access.kind === "jupyter" ? lease.access : null;
  const ssh = lease.access.kind === "ssh" ? lease.access : null;

  return (
    <div className="lease-panel">
      <div className="lease-head">
        <div>
          <strong>Active session</strong> on <code>{lease.label}</code>
          <div className="muted small">
            lease {lease.leaseId} · {formatUsdc(lease.rateAtomicPerHour)}/hr · metering now ·{" "}
            {formatUsdc(Number(lease.billing.gateFeeAtomic))} gate fee paid
          </div>
        </div>
        <div
          className="timer"
          data-expiring={inGrace || remainingMs < 60_000}
          title={
            inGrace
              ? "out of credit — save your work, the sandbox is destroyed when this hits zero"
              : "time left at current balance"
          }
        >
          {fmtCountdown(remainingMs)}
          {inGrace && <span className="small"> out of credit — save your work</span>}
        </div>
        <div className="lease-actions">
          <button className="btn ghost" disabled={busy || ended} onClick={() => setConfirming(true)}>
            {busy ? "Releasing…" : "Release"}
          </button>
        </div>
      </div>

      {confirming && (
        <div className="modal-backdrop" onClick={() => setConfirming(false)}>
          <div
            className="modal"
            role="alertdialog"
            aria-label="Confirm release"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <span>// END LEASE</span>
              <button className="modal-close" aria-label="Close" onClick={() => setConfirming(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                End lease and destroy sandbox <code>{lease.label}</code>?
              </p>
              <p className="muted small">
                The sandbox and everything in it is destroyed — anything not pushed or copied out
                is gone. You're charged for the time used so far and the unused remainder of your
                prepaid block comes back as credit. This can't be undone.
              </p>
            </div>
            <div className="modal-actions">
              {/* Cancel takes focus so a stray Enter can't destroy the session. */}
              <button className="btn ghost" autoFocus onClick={() => setConfirming(false)}>
                Keep running
              </button>
              <button className="btn" onClick={release}>
                End lease
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {!ended ? (
        jupyter ? (
          <div className="ssh-access">
            <p className="muted small">JupyterLab is running on this lease. The link is a per-lease token, not your wallet.</p>
            <div className="ssh-row">
              <a className="btn" href={jupyter.url} target="_blank" rel="noreferrer">
                Open notebook
              </a>
            </div>
            <p className="muted small">
              Billed by the second from your credit when you release. The countdown is when your
              credit runs out at this rate — top up and it moves out.
            </p>
          </div>
        ) : ssh ? (
        <div className="ssh-access">
          <p className="muted small">
            {ssh.authMethod === "publickey"
              ? "Connect over SSH — your key is already authorized:"
              : "Connect over SSH — your wallet address is the password:"}
          </p>
          <div className="ssh-row">
            <code className="ssh-code">{ssh.command}</code>
            <button className="btn ghost" onClick={() => copy("cmd", ssh.command)}>
              {copied === "cmd" ? "Copied!" : "Copy"}
            </button>
          </div>
          {ssh.password && (
            <div className="ssh-row">
              <span className="muted small">password</span>
              <code className="ssh-code">{ssh.password}</code>
              <button className="btn ghost" onClick={() => copy("pw", ssh.password ?? "")}>
                {copied === "pw" ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          <p className="muted small">
            Billed by the second from your credit when you release. The countdown is when your
            credit runs out at this rate — top up and it moves out.
          </p>
        </div>
        ) : null
      ) : (
        <div className="ssh-access">
          <p className="muted">
            Session ended — you released it or your credit ran out. The time used has been
            billed and the sandbox destroyed.
          </p>
          <button className="btn ghost" onClick={onRelease}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
