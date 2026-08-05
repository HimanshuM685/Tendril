import { useEffect, useState } from "react";
import type { ExplorerNode, X402RentResponse } from "@tendril/shared";
import { atomicPerHour, formatUsdc, fundedSeconds } from "@tendril/shared";
import { type ActiveLease, fetchExplorer, rentNode, toActiveLease } from "../api";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { Session } from "../App";

interface Props {
  session: Session | null;
  /** Connected wallet or custodial address — rent pays from here. */
  activeAddress: string | null;
  signTransactions: SignTransactions;
  balanceAtomic: number;
  onLeased: (lease: ActiveLease) => void;
}

export function Explore({
  session,
  activeAddress,
  signTransactions,
  balanceAtomic,
  onLeased,
}: Props) {
  const { runCustodialAction } = useCustodialSign();
  const [nodes, setNodes] = useState<ExplorerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renting, setRenting] = useState<string | null>(null);
  const [stage, setStage] = useState<PayStage | "confirming" | null>(null);
  const isGoogle = session?.authType === "google";

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

  /**
   * How long the current credit balance funds this node. This is the only limit
   * on a session — there is no block to pick, and topping up moves it out.
   */
  const runtimeFor = (usdPerHour: number) => fundedSeconds(balanceAtomic, atomicPerHour(usdPerHour));

  async function rent(node: ExplorerNode) {
    if (!activeAddress) {
      setError(isGoogle ? "Sign in to rent." : "Connect a wallet to rent.");
      return;
    }
    if (isGoogle && !session) {
      setError("Sign in to rent.");
      return;
    }
    setRenting(node.id);
    setStage(null);
    setError(null);
    try {
      let res: X402RentResponse;
      if (isGoogle && session) {
        setStage("confirming");
        res = (await runCustodialAction(session.token, {
          action: "rent",
          nodeId: node.id,
        })) as X402RentResponse;
      } else {
        res = await rentNode(
          session?.token ?? null,
          activeAddress,
          signTransactions,
          node.id,
          setStage,
        );
      }
      onLeased(toActiveLease(res, node.label));
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    } finally {
      setRenting(null);
      setStage(null);
    }
  }

  /** "2h 15m" / "45m" / "30s" — how long the credit lasts, at a glance. */
  function formatDuration(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }

  const STAGE_LABEL: Record<string, string> = {
    signing: "Approve in wallet…",
    settling: "Settling + starting sandbox…",
    confirming: "Confirm in dialog…",
  };

  const connectHint = isGoogle
    ? !session && "Sign in with Google to rent."
    : !activeAddress && "Connect your wallet to rent.";

  return (
    <div>
      <p className="muted">
        Live nodes from <code>GET /explorer</code> (free). Renting pays a 0.01 USDC gate fee
        on-chain, then the meter runs by the second and is billed from your credit when you
        release. No fixed block — the session lasts as long as your credit covers it.
      </p>
      {error && <div className="error">{error}</div>}
      {connectHint && <p className="muted">{connectHint}</p>}

      {loading && nodes.length === 0 && <p className="muted">Scanning for nodes…</p>}
      {!loading && nodes.length === 0 && (
        <p className="muted">No nodes online. Start a contributor agent.</p>
      )}
      <div className="grid">
        {nodes.map((n) => {
          const rate = atomicPerHour(n.pricePerHourUsd);
          const runtime = runtimeFor(n.pricePerHourUsd);
          const canRent = !!activeAddress && (!isGoogle || !!session);
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
              <div className="price">{formatUsdc(rate)}/hr</div>
              <div className="muted small">
                0.01 USDC gate fee · billed by the second from credit
              </div>
              <div className="muted small">
                {runtime === null
                  ? "Free node — runs until you release it."
                  : `Your credit funds ${formatDuration(runtime)}.`}
              </div>
              <button
                className="btn"
                disabled={!canRent || renting !== null}
                title={canRent ? "" : connectHint ?? "Sign in to rent"}
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
