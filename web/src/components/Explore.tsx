import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExplorerNode, X402RentResponse, WalletSummary } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import { type ActiveLease, fetchExplorer, rentNode, releaseLease, toActiveLease } from "../api";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import { NotebookSection } from "./NotebookSection";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { Session } from "../App";
import { isCustodialSession } from "../lib/session";
import { writeClipboard } from "../clipboard";

interface Props {
  session: Session | null;
  activeAddress: string | null;
  wallet: WalletSummary | null;
  signTransactions: SignTransactions;
  balanceAtomic: number;
  lease: ActiveLease | null;
  onLeased: (lease: ActiveLease | null) => void;
  onOpenTopUp?: () => void;
  onOpenConnectWallet?: () => void;
  onWalletChanged?: () => void;
}

function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function fmtDuration(seconds: number): string {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

export function Explore({
  session,
  activeAddress,
  wallet,
  signTransactions,
  balanceAtomic,
  lease,
  onLeased,
  onOpenTopUp,
  onOpenConnectWallet,
  onWalletChanged,
}: Props) {
  const navigate = useNavigate();
  const { runCustodialAction } = useCustodialSign();
  const [nodes, setNodes] = useState<ExplorerNode[]>([]);
  const [notebooks, setNotebooks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renting, setRenting] = useState<string | null>(null);
  const [stage, setStage] = useState<PayStage | "confirming" | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState<string | null>(null);
  const [releaseBusy, setReleaseBusy] = useState(false);
  const hardwareRef = useRef<HTMLDivElement>(null);

  const isCustodial = isCustodialSession(session);

  // Clock tick for active lease countdown
  useEffect(() => {
    if (!lease) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lease]);

  // Poll explorer nodes
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchExplorer()
        .then(({ nodes: next, notebooks: canRun }) => {
          if (!alive) return;
          setNodes(next);
          setNotebooks(canRun);
          setError(null);
        })
        .catch((err) => {
          if (!alive) return;
          setError((err as Error).message);
        })
        .finally(() => alive && setLoading(false));

    load();
    const timer = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  async function rent(nodeId: string, rateUsd: number, surface?: "ssh" | "jupyter") {
    if (!activeAddress) {
      if (onOpenConnectWallet) {
        onOpenConnectWallet();
      } else {
        setError("Please connect your Algorand wallet first to rent a machine.");
      }
      return;
    }
    if (isCustodial && !session) {
      setError("Please sign in to rent.");
      return;
    }
    setRenting(nodeId);
    setStage(null);
    setError(null);
    try {
      let res: X402RentResponse;
      if (isCustodial && session) {
        setStage("confirming");
        res = (await runCustodialAction(session.token, {
          action: "rent",
          nodeId,
          ...(surface ? { surface } : {}),
        })) as X402RentResponse;
      } else {
        res = await rentNode(
          session?.token ?? null,
          activeAddress,
          signTransactions,
          nodeId,
          setStage,
          surface,
        );
      }
      const targetNode = nodes.find((n) => n.id === nodeId);
      onLeased(toActiveLease(res, targetNode?.label ?? nodeId));
      onWalletChanged?.();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setError((e as Error).message);
    } finally {
      setRenting(null);
      setStage(null);
    }
  }

  async function handleRelease() {
    if (!lease) return;
    setReleaseBusy(true);
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
      onLeased(null);
      onWalletChanged?.();
    } catch (e) {
      setError(`Release error: ${(e as Error).message}`);
    } finally {
      setReleaseBusy(false);
    }
  }

  function copy(val: string) {
    void writeClipboard(val).then((ok) => {
      if (!ok) return;
      setCopied(val);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  // Greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userGreetingName = session?.name || (activeAddress ? `${activeAddress.slice(0, 6)}…${activeAddress.slice(-4)}` : "");

  // Real stats (no dummy data)
  const creditBalance = wallet ? (wallet.balanceAtomic / 1_000_000).toFixed(2) : "0.00";
  const onlineNodesCount = nodes.length;
  const meteredRuntime = wallet?.stats?.totalLeaseSeconds
    ? fmtDuration(wallet.stats.totalLeaseSeconds)
    : "0s";
  const contributorEarnings = wallet?.earningsAtomic
    ? (wallet.earningsAtomic / 1_000_000).toFixed(2)
    : "0.00";

  // Active lease timer
  const leaseRemainingMs = lease ? Math.max(0, lease.expiresAt - now) : 0;
  const recentCharges = wallet?.charges ?? [];

  return (
    <div className="explore-dashboard">
      {/* Header Greeting Row */}
      <div className="explore-header-row">
        <div>
          <h1 className="explore-greeting">
            {userGreetingName ? `${timeGreeting}, ${userGreetingName}!` : "Compute Marketplace"}
          </h1>
          <p className="explore-subtitle">
            Here's your live compute fleet and balance at a glance.
          </p>
        </div>
        {!activeAddress && (
          <button
            type="button"
            className="explore-connect-btn"
            onClick={onOpenConnectWallet}
          >
            Connect Wallet
          </button>
        )}
      </div>

      {error && (
        <div className="error" style={{ marginBottom: "20px" }}>
          <span>{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="explore-stats-grid">
        <div className="explore-stat-card">
          <div className="stat-card-label">Credit Balance</div>
          <div className="stat-card-value">{creditBalance}</div>
          <div className="stat-card-sub">USDC available</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Online Nodes</div>
          <div className="stat-card-value">{onlineNodesCount}</div>
          <div className="stat-card-sub">
            {onlineNodesCount === 1 ? "1 node online" : `${onlineNodesCount} nodes online`}
          </div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Metered Runtime</div>
          <div className="stat-card-value">{meteredRuntime}</div>
          <div className="stat-card-sub text-green">Billed to exact second</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Contributor Earnings</div>
          <div className="stat-card-value">{contributorEarnings}</div>
          <div className="stat-card-sub">USDC ready to withdraw</div>
        </div>
      </div>

      {/* Compute Actions Bar with Vector SVG Icons */}
      <div className="compute-actions-bar">
        <span className="ca-title">Compute Actions</span>
        <div className="ca-buttons">
          <button
            type="button"
            className="ca-btn ca-btn-ghost"
            onClick={() => document.getElementById("run-notebook")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="ca-btn-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </span>
            <span>Run notebook</span>
          </button>

          <button
            type="button"
            className="ca-btn ca-btn-ghost"
            onClick={() => hardwareRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="ca-btn-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <span>Explore Nodes</span>
          </button>

          <button
            type="button"
            className="ca-btn ca-btn-ghost"
            onClick={() => navigate("/contribute")}
          >
            <span className="ca-btn-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </span>
            <span>Mint Contributor Key</span>
          </button>

          {!activeAddress ? (
            <button
              type="button"
              className="ca-btn ca-btn-primary"
              onClick={onOpenConnectWallet}
            >
              <span>Connect Wallet</span>
            </button>
          ) : (
            <button
              type="button"
              className="ca-btn ca-btn-primary"
              onClick={onOpenTopUp}
            >
              <span>+ Top Up USDC</span>
            </button>
          )}
        </div>
      </div>

      <NotebookSection
        session={session}
        activeAddress={activeAddress}
        signTransactions={signTransactions}
        notebooks={notebooks}
        checking={loading && nodes.length === 0}
        onOpenConnectWallet={onOpenConnectWallet}
        onWalletChanged={onWalletChanged}
      />

      {/* Main 2-Column Section */}
      <div className="explore-columns-grid">
        {/* Left Column: Active & Recent Leases */}
        <div className="explore-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Active &amp; Recent Leases</h3>
              <p className="card-head-sub">
                {lease ? "1 active metered session" : "0 active sessions"}
              </p>
            </div>
            <button
              type="button"
              className="card-head-link"
              onClick={() => navigate("/dashboard#history")}
            >
              View all leases &rarr;
            </button>
          </div>

          <div className="leases-list">
            {/* Real Active Lease if currently leased */}
            {lease && (
              <div className="lease-item active-lease-highlight">
                <div className="lease-item-dot">
                  <span className="dot-pulse"></span>
                </div>
                <div className="lease-item-info">
                  <div className="lease-item-title">{lease.label}</div>
                  <div className="lease-item-meta">
                    <span>{formatUsdc(lease.rateAtomicPerHour)}/hr</span>
                  </div>
                  {lease.access.kind === "jupyter" ? (
                    <div className="lease-ssh">
                      <a className="btn-tiny" href={lease.access.url} target="_blank" rel="noreferrer">
                        Open notebook
                      </a>
                    </div>
                  ) : (
                    <div className="lease-ssh">
                      <div className="lease-ssh-line">
                        <span className="lease-ssh-label">ssh</span>
                        <code className="lease-ssh-value">{lease.access.command}</code>
                        <button type="button" className="btn-tiny" onClick={() => copy(lease.access.kind === "ssh" ? lease.access.command : "")}>
                          {copied === lease.access.command ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="lease-ssh-line">
                        <span className="lease-ssh-label">user</span>
                        <code className="lease-ssh-value">{lease.access.username}</code>
                      </div>
                      {lease.access.password ? (
                        <div className="lease-ssh-line">
                          <span className="lease-ssh-label">password</span>
                          <code className="lease-ssh-value">{lease.access.password}</code>
                          <button type="button" className="btn-tiny" onClick={() => copy(lease.access.kind === "ssh" ? lease.access.password ?? "" : "")}>
                            {copied === lease.access.password ? "Copied" : "Copy"}
                          </button>
                        </div>
                      ) : (
                        <p className="lease-ssh-note">Use the SSH key you supplied when renting.</p>
                      )}
                    </div>
                  )}
                  <div className="lease-expanded-controls">
                    <span className="lease-timer-pill">
                      Time left: {fmtCountdown(leaseRemainingMs)}
                    </span>
                    {lease.access.kind === "jupyter" ? (
                      <a className="btn-tiny" href={lease.access.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : null}
                    <button
                      type="button"
                      className="btn-tiny btn-danger-tiny"
                      disabled={releaseBusy}
                      onClick={handleRelease}
                    >
                      {releaseBusy ? "Releasing…" : "Release"}
                    </button>
                  </div>
                </div>
                <div className="lease-item-badge">
                  <span className="pill-badge pill-running">Running</span>
                </div>
              </div>
            )}

            {/* Real charges from wallet history */}
            {recentCharges.length > 0 &&
              recentCharges.slice(0, 5).map((c) => (
                <div className="lease-item" key={c.id}>
                  <div className="lease-item-info pl-dot">
                    <div className="lease-item-title">
                      Compute Lease &middot; {fmtDuration(c.seconds)}
                    </div>
                    <div className="lease-item-meta">
                      {c.payToAddr ? `Node ${c.payToAddr.slice(0, 6)}…` : "Registry Sandbox"} &middot;{" "}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="lease-item-badge">
                    <span className="pill-badge pill-cost">
                      {formatUsdc(c.amountAtomic)}
                    </span>
                  </div>
                </div>
              ))}

            {/* Clean empty state when no active lease and no history */}
            {!lease && recentCharges.length === 0 && (
              <div className="lease-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
                  <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
                <p className="empty-title">No active leases or recent sessions</p>
                <p className="empty-sub">
                  Rent a machine from the pool, or upload a notebook in the section above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Hardware Pool */}
        <div className="explore-card" ref={hardwareRef}>
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Live Hardware Pool</h3>
              <p className="card-head-sub">Scored by (cores + RAM/4) / price</p>
            </div>
            <span className="card-head-sub">
              {nodes.length} {nodes.length === 1 ? "node" : "nodes"} online
            </span>
          </div>

          <div className="hardware-list">
            {loading && nodes.length === 0 ? (
              <p className="muted small" style={{ padding: "20px 0" }}>
                Scanning registry for active contributor nodes…
              </p>
            ) : nodes.length > 0 ? (
              nodes.map((n) => {
                const isAvailable = n.status === "online";
                return (
                  <div className="hardware-item" key={n.id}>
                    <div className="hw-icon-box">
                      {n.gpu ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e8810" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="6" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e8810" strokeWidth="2">
                          <rect width="16" height="16" x="4" y="4" rx="2" />
                          <rect width="6" height="6" x="9" y="9" rx="1" />
                          <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
                        </svg>
                      )}
                    </div>
                    <div className="hw-info">
                      <div className="hw-title">
                        {n.gpu ? `${n.gpu} · ${n.label}` : `${n.label}`}
                      </div>
                      <div className="hw-meta">
                        {n.cpuCores} Cores &middot; {(n.ramMb / 1024).toFixed(0)}GB RAM &middot; ${n.pricePerHourUsd}/hr
                      </div>
                    </div>
                    <div className="hw-action">
                      {isAvailable ? (
                        <button
                          type="button"
                          className="hw-pill-btn pill-available"
                          disabled={renting === n.id}
                          onClick={() => rent(n.id, n.pricePerHourUsd)}
                        >
                          {renting === n.id ? stage || "Starting…" : "Available"}
                        </button>
                      ) : (
                        <span className="pill-badge pill-inuse">In Use</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="lease-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
                <p className="empty-title">No contributor nodes currently online</p>
                <p className="empty-sub">
                  Start the contributor agent daemon on your PC or server to share compute and join the network.
                </p>
                <button
                  type="button"
                  className="btn small"
                  onClick={() => navigate("/contribute")}
                  style={{ marginTop: "12px" }}
                >
                  Contribute Compute &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
