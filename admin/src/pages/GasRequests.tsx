import { useCallback, useEffect, useState } from "react";
import type { AdminGasRequest, GasRequestStatus } from "@tendril/shared";
import { useAdminAuth } from "../App";
import {
  acceptGasRequest,
  explorerAddrUrl,
  explorerTxUrl,
  fetchGasRequests,
  rejectGasRequest,
} from "../lib/api";

type Filter = GasRequestStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function fmtAlgo(micro: number) {
  return (micro / 1_000_000).toFixed(2);
}

export function GasRequests() {
  const { token } = useAdminAuth();
  const [filter, setFilter] = useState<Filter>("pending");
  const [rows, setRows] = useState<AdminGasRequest[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    setErr(null);
    fetchGasRequests(token, filter === "all" ? undefined : filter)
      .then(setRows)
      .catch((e: Error) => setErr(e.message));
  }, [token, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function onAccept(id: string) {
    if (!token || !confirm("Send ALGO grant from platform wallet?")) return;
    setBusy(id);
    setErr(null);
    try {
      await acceptGasRequest(token, id);
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onRejectConfirm() {
    if (!token || !rejectId) return;
    setBusy(rejectId);
    setErr(null);
    try {
      await rejectGasRequest(token, rejectId, rejectNote || undefined);
      setRejectId(null);
      setRejectNote("");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <header className="admin-header">
        <h1>Gas requests</h1>
        <p className="kicker muted">One-time ALGO grant per Google account</p>
      </header>

      {err && <p className="error">{err}</p>}

      <div className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`tab${filter === f.id ? " active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>Amount</th>
              <th>Requested</th>
              <th>Status</th>
              <th>Tx</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  No requests
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name ?? "—"}</td>
                <td>{r.email}</td>
                <td className="addr">
                  <a href={explorerAddrUrl(r.address)} target="_blank" rel="noreferrer">
                    {r.address.slice(0, 8)}…{r.address.slice(-6)}
                  </a>
                </td>
                <td>{fmtAlgo(r.amountMicro)} ALGO</td>
                <td className="small">{fmtDate(r.createdAt)}</td>
                <td>{r.status}</td>
                <td>
                  {r.txid ? (
                    <a href={explorerTxUrl(r.txid)} target="_blank" rel="noreferrer" className="small">
                      {r.txid.slice(0, 10)}…
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {r.status === "pending" ? (
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn"
                        disabled={busy === r.id}
                        onClick={() => onAccept(r.id)}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={busy === r.id}
                        onClick={() => setRejectId(r.id)}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="small muted">
                      {r.reviewedBy ? `by ${r.reviewedBy}` : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejectId && (
        <div className="modal-backdrop" role="presentation" onClick={() => setRejectId(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Reject request</h2>
            <p className="small">Optional note (shown to user if exposed later):</p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              maxLength={500}
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setRejectId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={onRejectConfirm}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
