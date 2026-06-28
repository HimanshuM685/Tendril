import { useEffect, useState } from "react";
import type { ExplorerNode } from "@tendril/shared";
import { formatAlgo, usdToMicroAlgos } from "@tendril/shared";
import { type ActiveLease, fetchExplorer, fetchPlatform, rentNode } from "../api";
import type { Session } from "../App";

interface Props {
  session: Session | null;
  balanceMicroAlgos: number;
  onLeased: (lease: ActiveLease) => void;
}

export function Explore({ session, balanceMicroAlgos, onLeased }: Props) {
  const [nodes, setNodes] = useState<ExplorerNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [renting, setRenting] = useState<string | null>(null);
  const [algoUsdPrice, setAlgoUsdPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchPlatform()
      .then((p) => setAlgoUsdPrice(p.algoUsdPrice))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchExplorer()
        .then((n) => alive && setNodes(n))
        .catch((e) => alive && setError(e.message));
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  /** Per-hour rate in microALGO. */
  const rateMicro = (usdPerHour: number) =>
    algoUsdPrice ? usdToMicroAlgos(usdPerHour, algoUsdPrice) : null;

  const priceLabel = (usdPerHour: number) => {
    const r = rateMicro(usdPerHour);
    return r ? `~${formatAlgo(r)}/hr` : `$${usdPerHour}/hr`;
  };

  /** Minutes the current balance buys at this node's hourly rate. */
  const minutesLabel = (usdPerHour: number) => {
    const r = rateMicro(usdPerHour);
    if (!r || !session) return null;
    return `≈ ${Math.floor((balanceMicroAlgos / r) * 60)} min on your balance`;
  };

  async function rent(node: ExplorerNode) {
    if (!session) return;
    if (balanceMicroAlgos <= 0) {
      setError("Insufficient balance — top up your wallet first.");
      return;
    }
    setRenting(node.id);
    setError(null);
    try {
      const lease = await rentNode(session.token, node.id);
      onLeased({ ...lease, nodeId: node.id, label: node.label });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRenting(null);
    }
  }

  return (
    <div>
      <p className="muted">
        Live nodes from <code>GET /explorer</code> (free). Rent one to get a sandboxed SSH
        session — billed by the hour from your prepaid ALGO balance, charged when you release.
      </p>
      {error && <div className="error">{error}</div>}
      {!session && (
        <p className="muted">Connect your wallet and sign in to load a balance and rent.</p>
      )}
      {nodes.length === 0 && <p className="muted">No nodes online. Start a contributor agent.</p>}
      <div className="grid">
        {nodes.map((n) => (
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
            <div className="price">{priceLabel(n.pricePerHourUsd)}</div>
            {minutesLabel(n.pricePerHourUsd) && (
              <div className="muted small">{minutesLabel(n.pricePerHourUsd)}</div>
            )}
            <button
              className="btn"
              disabled={!session || renting === n.id}
              title={session ? "" : "Sign in to rent"}
              onClick={() => rent(n)}
            >
              {renting === n.id ? "Starting…" : "Rent"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
