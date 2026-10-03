import { useEffect, useState } from "react";
import { useAdminAuth } from "../App";
import { explorerAddrUrl, fetchTreasury } from "../lib/api";

interface TreasuryData {
  address: string;
  algoMicro: number;
  usdcAtomic: number;
  usdcOptedIn: boolean;
  gasGrantMicroAlgos: number;
}

function fmtAlgo(micro: number) {
  return (micro / 1_000_000).toFixed(6);
}

function fmtUsdc(atomic: number) {
  return (atomic / 1_000_000).toFixed(2);
}

export function Treasury() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<TreasuryData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchTreasury(token)
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, [token]);

  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="kicker">Loading treasury…</p>;

  return (
    <>
      <header className="admin-header">
        <h1>Treasury</h1>
        <p className="kicker muted">Platform wallet balances</p>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <p className="kicker muted">ALGO</p>
          <p className="value">{fmtAlgo(data.algoMicro)}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">USDC</p>
          <p className="value">{fmtUsdc(data.usdcAtomic)}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">USDC opted in</p>
          <p className="value">{data.usdcOptedIn ? "yes" : "no"}</p>
        </div>
        <div className="stat">
          <p className="kicker muted">Gas grant size</p>
          <p className="value">{fmtAlgo(data.gasGrantMicroAlgos)} ALGO</p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <p className="kicker">Platform address</p>
        <p className="addr" style={{ marginTop: 8 }}>
          <a href={explorerAddrUrl(data.address)} target="_blank" rel="noreferrer">
            {data.address}
          </a>
        </p>
        <p className="small muted" style={{ marginTop: 16 }}>
          Holds user top-ups (USDC), contributor withdrawals, and gas grants (ALGO). Keep ALGO
          balance above pending gas requests × grant size + fees.
        </p>
      </div>
    </>
  );
}
