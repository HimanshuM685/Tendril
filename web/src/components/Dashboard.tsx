import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { WalletStats, WalletSummary } from "@tendril/shared";
import { formatUsdcExact } from "@tendril/shared";
import { BalanceChart } from "./BalanceChart";
import { LeasePanel } from "./LeasePanel";
import { TopUpControl } from "./TopUpControl";
import { explorerAddrUrl, explorerTxUrl, type ActiveLease } from "../api";
import type { SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";

interface Props {
  session: Session | null;
  wallet: WalletSummary | null;
  address: string | null;
  signedIn: boolean;
  signTransactions: SignTransactions;
  onWalletChanged: () => void;
  onError: (msg: string) => void;
  lease: ActiveLease | null;
  onLeaseEnded: () => void;
  onOpenTopUp?: () => void;
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

function short(addr: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function resolveStats(w: WalletSummary): WalletStats {
  if (w.stats) return w.stats;
  const sum = <T,>(arr: T[], pick: (x: T) => number) => arr.reduce((a, x) => a + pick(x), 0);
  return {
    totalSpentAtomic: sum(w.charges, (c) => c.amountAtomic),
    totalToppedUpAtomic: sum(w.topups, (t) => t.amountAtomic),
    totalLeaseSeconds: sum(w.charges, (c) => c.seconds),
    leaseCount: w.charges.length,
    totalEarnedAtomic: sum(w.payouts ?? [], (p) => p.amountAtomic),
    payoutCount: (w.payouts ?? []).length,
  };
}

export function Dashboard({
  session,
  wallet,
  address,
  signedIn,
  signTransactions,
  onWalletChanged,
  onError,
  lease,
  onLeaseEnded,
  onOpenTopUp,
}: Props) {
  const { hash } = useLocation();
  const loaded = !!wallet;

  useEffect(() => {
    if (hash && loaded) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash, loaded]);

  const stats = wallet ? resolveStats(wallet) : null;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userGreetingName = session?.name || (address ? `${address.slice(0, 6)}…` : "");

  const creditBalance = wallet ? (wallet.balanceAtomic / 1_000_000).toFixed(2) : "0.00";
  const totalSpent = stats ? (stats.totalSpentAtomic / 1_000_000).toFixed(2) : "0.00";
  const meteredRuntime = stats?.totalLeaseSeconds ? fmtDuration(stats.totalLeaseSeconds) : "0s";
  const leasesCount = stats?.leaseCount ?? 0;

  return (
    <div className="explore-dashboard dashboard-page">
      {/* Header Row */}
      <div className="explore-header-row">
        <div>
          <h1 className="explore-greeting">
            {userGreetingName ? `${timeGreeting}, ${userGreetingName}!` : "Account Dashboard"}
          </h1>
          <p className="explore-subtitle">
            Prepaid credit, usage analytics, and on-chain transaction history.
          </p>
        </div>
      </div>

      {address && (
        <div className="dash-addr-pill">
          <span className="muted small">Connected: </span>
          <a className="ext-link" href={explorerAddrUrl(address)} target="_blank" rel="noreferrer">
            {address}
          </a>
        </div>
      )}

      {/* Top 4 Stat Cards (No dummy data) */}
      <div className="explore-stats-grid dashboard-stats-grid">
        <div className="explore-stat-card">
          <div className="stat-card-label">Credit Balance</div>
          <div className="stat-card-value">{creditBalance}</div>
          <div className="stat-card-sub">USDC available</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Total Spent</div>
          <div className="stat-card-value">{totalSpent}</div>
          <div className="stat-card-sub">Lifetime compute spend</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Metered Runtime</div>
          <div className="stat-card-value">{meteredRuntime}</div>
          <div className="stat-card-sub text-green">Billed to exact second</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Leases Taken</div>
          <div className="stat-card-value">{leasesCount}</div>
          <div className="stat-card-sub">Closed sessions</div>
        </div>
      </div>

      {/* Actions Bar with Vector SVG Icons */}
      <div className="compute-actions-bar dashboard-actions-bar">
        <span className="ca-title">Account Actions</span>
        <div className="ca-buttons">
          {address && (
            <a
              href={explorerAddrUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="ca-btn ca-btn-ghost"
            >
              <span className="ca-btn-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
              <span>View On Explorer</span>
            </a>
          )}

          <button
            type="button"
            className="ca-btn ca-btn-primary"
            onClick={onOpenTopUp}
          >
            <span>+ Top Up USDC</span>
          </button>
        </div>
      </div>

      {/* Active Lease if running */}
      {lease && (
        <div className="dashboard-active-lease">
          <LeasePanel lease={lease} session={session} onRelease={onLeaseEnded} />
        </div>
      )}

      {/* 2-Column Section */}
      <div className="explore-columns-grid dashboard-content-grid">
        {/* Row 1, Col 1: Historical Balance */}
        <div className="explore-card dashboard-card dashboard-balance-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Historical Balance</h3>
              <p className="card-head-sub">Reconstructed deposits &amp; usage</p>
            </div>
            <strong
              className="text-green dashboard-balance-total"
              title={wallet ? formatUsdcExact(wallet.balanceAtomic) : undefined}
            >
              {creditBalance} USDC
            </strong>
          </div>
          {wallet ? (
            <BalanceChart
              topups={wallet.topups}
              charges={wallet.charges}
              currentBalance={wallet.balanceAtomic}
            />
          ) : (
            <div className="lease-empty-state">
              <p className="empty-title">Connect wallet</p>
              <p className="empty-sub">Connect your wallet to see real-time balance history and usage charts.</p>
            </div>
          )}
        </div>

        {/* Row 1, Col 2: Spend History */}
        <div className="explore-card dashboard-card dashboard-history-card" id="history">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Spend History</h3>
              <p className="card-head-sub">Settled compute sessions</p>
            </div>
          </div>

          <div className="leases-list dashboard-history-list">
            {wallet?.charges && wallet.charges.length > 0 ? (
              wallet.charges.map((c) => (
                <div className="lease-item dashboard-history-item" key={c.id}>
                  <span className="history-item-marker history-item-marker-charge" aria-hidden="true" />
                  <div className="lease-item-info">
                    <div className="lease-item-title">
                      Compute Session &middot; {fmtDuration(c.seconds)}
                    </div>
                    <div className="lease-item-meta">
                      Paid to {c.payToAddr ? short(c.payToAddr) : "Registry"} &middot; {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="lease-item-badge">
                    <span className="pill-badge pill-cost">
                      −{formatUsdcExact(c.amountAtomic)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="lease-empty-state">
                <p className="empty-title">No charges yet</p>
                <p className="empty-sub">When you rent hardware or run agent jobs, charges appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2, Col 1: Prepaid Top Up */}
        <div className="explore-card dashboard-card dashboard-topup-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Prepaid Top Up</h3>
              <p className="card-head-sub">Instant settlement with Algorand USDC</p>
            </div>
          </div>
          {address ? (
            <div className="dashboard-topup-body">
              <TopUpControl
                address={address}
                session={session}
                signTransactions={signTransactions}
                onChanged={onWalletChanged}
                onError={onError}
              />
            </div>
          ) : (
            <div className="lease-empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <p className="empty-title">Wallet not connected</p>
              <p className="empty-sub">Connect a wallet to deposit USDC into your prepaid balance.</p>
            </div>
          )}
        </div>

        {/* Row 2, Col 2: Top-up History */}
        <div className="explore-card dashboard-card dashboard-history-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Top-up History</h3>
              <p className="card-head-sub">On-chain USDC deposits</p>
            </div>
          </div>

          <div className="leases-list dashboard-history-list">
            {wallet?.topups && wallet.topups.length > 0 ? (
              wallet.topups.map((t) => (
                <div className="lease-item dashboard-history-item" key={t.txid}>
                  <span className="history-item-marker history-item-marker-topup" aria-hidden="true" />
                  <div className="lease-item-info">
                    <div className="lease-item-title">
                      Deposit &middot;{" "}
                      <a
                        className="ext-link"
                        href={explorerTxUrl(t.txid)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {short(t.txid)}
                      </a>
                    </div>
                    <div className="lease-item-meta">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="lease-item-badge">
                    <span className="pill-badge pill-running">
                      +{formatUsdcExact(t.amountAtomic)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="lease-empty-state">
                <p className="empty-title">No deposits yet</p>
                <p className="empty-sub">Top up your account in USDC to fund your sandboxed machines.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
