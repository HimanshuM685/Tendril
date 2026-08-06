import { useEffect, useState } from "react";
import type { AdminDashboard } from "@tendril/shared";
import { useAdminAuth } from "../App";
import { fetchDashboard } from "../lib/api";

function fmtAlgo(micro: number) {
  return (micro / 1_000_000).toFixed(4);
}

function fmtUsdc(atomic: number) {
  return (atomic / 1_000_000).toFixed(2);
}

export function Dashboard() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token)
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="kicker">Loading dashboard…</p>;

  const m = data.metrics;

  return (
    <>
      <header className="admin-header">
        <h1>Dashboard</h1>
        <p className="kicker muted">Platform snapshot</p>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <p className="kicker muted">Pending gas</p>
          <p className="value">{data.pendingGasRequests}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Google users</p>
          <p className="value">{data.totalGoogleUsers}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Treasury ALGO</p>
          <p className="value">{fmtAlgo(data.treasury.algoMicro)}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Treasury USDC</p>
          <p className="value">{fmtUsdc(data.treasury.usdcAtomic)}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Active renters</p>
          <p className="value">{m.totalActive}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Paying users</p>
          <p className="value">{m.totalUsers}</p>
        </div>
      </div>
    </>
  );
}
