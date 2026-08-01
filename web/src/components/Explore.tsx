import { useEffect, useState } from "react";
import type { ExplorerNode } from "@tendril/shared";
import { atomicPerHour, formatUsdc, proratedCost } from "@tendril/shared";
import { type ActiveLease, fetchExplorer, rentNode, toActiveLease } from "../api";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";

interface Props {
  session: Session | null;
  /** The connected wallet — rent pays from here, with or without a session. */
  activeAddress: string | null;
  signTransactions: SignTransactions;
  balanceAtomic: number;
  onLeased: (lease: ActiveLease) => void;
}

/** Prepaid blocks. Each is a multiple of the server's 60s granularity. */
const DURATIONS = [
  { label: "15 min", seconds: 900 },
  { label: "1 hour", seconds: 3600 },
  { label: "4 hours", seconds: 14_400 },
];

export function Explore({
  session,
  activeAddress,
  signTransactions,
  balanceAtomic,
  onLeased,
}: Props) {
  const [nodes, setNodes] = useState<ExplorerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renting, setRenting] = useState<string | null>(null);
  const [stage, setStage] = useState<PayStage | null>(null);
  const [seconds, setSeconds] = useState(DURATIONS[1].seconds);

  // Poll the node list, pausing while the tab is hidden — same pattern as the
  // balance poll in App. A stale "can't reach backend" error clears itself on
  // the next successful load.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchExplorer()
        .then((n) => {
          if (!alive) return;
          setNodes(n);
          setError((prev) => (prev && /explorer failed/.test(prev) ? null : prev));
        })
        .catch((e) => alive && setError((e as Error).message))
        .finally(() => alive && setLoading(false));
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer) return;
      load();
      timer = setInterval(load, 4000);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  /** Full price of the selected block on this node, in atomic units. */
  const quoteFor = (usdPerHour: number) => proratedCost(atomicPerHour(usdPerHour), seconds);

  /**
   * What the wallet will actually be asked to pay. Credit only applies with a
   * session — unauthenticated rents are floored server-side, so promising a
   * free rent here would be a lie the 402 immediately contradicts.
   */
  const owedFor = (usdPerHour: number) => {
    const quote = quoteFor(usdPerHour);
    return session ? Math.max(0, quote - balanceAtomic) : quote;
  };

  async function rent(node: ExplorerNode) {
    if (!activeAddress) {
      setError("Connect a wallet to rent.");
      return;
    }
    setRenting(node.id);
    setStage(null);
    setError(null);
    try {
      const res = await rentNode(
        session?.token ?? null,
        activeAddress,
        signTransactions,
        node.id,
        seconds,
        setStage,
      );
      onLeased(toActiveLease(res, node.label));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRenting(null);
      setStage(null);
    }
  }

  const STAGE_LABEL: Record<PayStage, string> = {
    signing: "Approve in wallet…",
    settling: "Settling + starting sandbox…",
  };

  return (
    <div>
      <p className="muted">
        Live nodes from <code>GET /explorer</code> (free). Renting buys a prepaid block of SSH
        time over x402 — unused time comes back as credit when you release.
      </p>
      {error && <div className="error">{error}</div>}
      {!activeAddress && <p className="muted">Connect your wallet to rent.</p>}
      {activeAddress && !session && (
        <p className="muted small">
          Signed out — you can still rent, but existing credit only applies once you sign in.
        </p>
      )}

      <div className="topup" role="group" aria-label="Lease duration">
        <span className="muted small">Block</span>
        {DURATIONS.map((d) => (
          <button
            key={d.seconds}
            className={`btn ghost${seconds === d.seconds ? " active" : ""}`}
            onClick={() => setSeconds(d.seconds)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading && nodes.length === 0 && <p className="muted">Scanning for nodes…</p>}
      {!loading && nodes.length === 0 && (
        <p className="muted">No nodes online. Start a contributor agent.</p>
      )}
      <div className="grid">
        {nodes.map((n) => {
          const quote = quoteFor(n.pricePerHourUsd);
          const owed = owedFor(n.pricePerHourUsd);
          return (
            <div className="card" key={n.id}>
              <div className="card-head">
                <strong>{n.label}</strong>
                <span className="badge online">online</span>
              </div>
              <ul className="specs">
                <li>{n.cpuCores} vCPU</li>
                <li>{(n.ramMb / 1024).toFixed(1)} GB RAM</li>
                <li>{n.gpu ?? "no GPU"}</li>
              </ul>
              <div className="price">{formatUsdc(quote)}</div>
              <div className="muted small">
                {owed === 0 ? (
                  <>covered by credit · no signature</>
                ) : owed < quote ? (
                  <>
                    {formatUsdc(quote - owed)} from credit · pay {formatUsdc(owed)}
                  </>
                ) : (
                  <>${n.pricePerHourUsd}/hr</>
                )}
              </div>
              <button
                className="btn"
                disabled={!activeAddress || renting !== null}
                title={activeAddress ? "" : "Connect a wallet to rent"}
                onClick={() => rent(n)}
              >
                {renting === n.id ? (stage ? STAGE_LABEL[stage] : "Starting…") : "Rent"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
