import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { WalletStats, WalletSummary } from "@tendril/shared";
import { formatAlgo, formatAlgoExact } from "@tendril/shared";
import { BalanceChart } from "./BalanceChart";
import { LeasePanel } from "./LeasePanel";
import { TopUpControl } from "./TopUpControl";
import type { ActiveLease } from "../api";

type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

interface Props {
  wallet: WalletSummary | null;
  address: string | null;
  signedIn: boolean;
  token: string | null;
  signTransactions: SignTransactions;
  onWalletChanged: () => void;
  onError: (msg: string) => void;
  lease: ActiveLease | null;
  onLeaseEnded: () => void;
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

/** Use server-side stats when present; otherwise derive from the loaded history
 *  (so the dashboard still works before the backend is rebuilt). */
function resolveStats(w: WalletSummary): WalletStats {
  if (w.stats) return w.stats;
  const sum = <T,>(arr: T[], pick: (x: T) => number) => arr.reduce((a, x) => a + pick(x), 0);
  return {
    totalSpentMicroAlgos: sum(w.charges, (c) => c.amountMicroAlgos),
    totalToppedUpMicroAlgos: sum(w.topups, (t) => t.amountMicroAlgos),
    totalLeaseSeconds: sum(w.charges, (c) => c.seconds),
    leaseCount: w.charges.length,
    totalEarnedMicroAlgos: sum(w.payouts ?? [], (p) => p.amountMicroAlgos),
    payoutCount: (w.payouts ?? []).length,
  };
}

/** Compact ALGO figure; the exact one is on hover. */
function AlgoStat({ label, microAlgos }: { label: string; microAlgos: number }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" title={formatAlgoExact(microAlgos)}>{formatAlgo(microAlgos)}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

/** Address-only account dashboard: lifetime stats + spend/top-up history. */
export function Dashboard({
  wallet,
  address,
  signedIn,
  token,
  signTransactions,
  onWalletChanged,
  onError,
  lease,
  onLeaseEnded,
}: Props) {
  // Router doesn't scroll to #hash targets, and the tables only exist once the
  // wallet has loaded — so re-try when it arrives.
  const { hash } = useLocation();
  const loaded = !!wallet; // not `wallet` — it's re-fetched every 5s and would re-scroll
  useEffect(() => {
    if (hash && loaded) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash, loaded]);

  return (
    <section className="page">
      <div className="section-head">
        <p className="kicker">// ACCOUNT</p>
        <h2 className="display section-title">DASHBOARD</h2>
      </div>
      <div className="rule"></div>

      {!signedIn || !address ? (
        <p className="muted dash-note">Connect your wallet and sign in to view your dashboard.</p>
      ) : !wallet ? (
        <p className="muted dash-note">Loading your account…</p>
      ) : (
        (() => {
          const stats = resolveStats(wallet);
          return (
        <>
          <p className="dash-addr">{address}</p>

          {/* Same panel Explore shows — countdown, SSH command, release. Only one
              route is mounted at a time, so the poll never runs twice. */}
          {lease && <LeasePanel lease={lease} onRelease={onLeaseEnded} />}

          <div className="stat-grid">
            <AlgoStat label="Balance" microAlgos={wallet.balanceMicroAlgos} />
            <AlgoStat label="Total spent" microAlgos={stats.totalSpentMicroAlgos} />
            <AlgoStat label="Total topped up" microAlgos={stats.totalToppedUpMicroAlgos} />
            <Stat label="Lease time" value={fmtDuration(stats.totalLeaseSeconds)} />
            <Stat label="Leases taken" value={String(stats.leaseCount)} />
            {stats.payoutCount > 0 && (
              <AlgoStat label="Earned (contributor)" microAlgos={stats.totalEarnedMicroAlgos} />
            )}
          </div>

          {/* Topping up is the most-taken action — don't make it a trip to the wallet panel. */}
          {token && (
            <div className="panel">
              <h3>Top up</h3>
              <TopUpControl
                address={address}
                token={token}
                signTransactions={signTransactions}
                onChanged={onWalletChanged}
                onError={onError}
              />
            </div>
          )}

          <BalanceChart
            topups={wallet.topups}
            charges={wallet.charges}
            currentBalance={wallet.balanceMicroAlgos}
          />

          <div className="dash-cols panel" id="history">
            <div>
              <h3>Spend history</h3>
              {wallet.charges.length === 0 ? (
                <p className="muted small">No charges yet.</p>
              ) : (
                <table className="ledger">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Time</th>
                      <th>Paid to</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.charges.map((c) => (
                      <tr key={c.id}>
                        <td className="num">−{formatAlgoExact(c.amountMicroAlgos)}</td>
                        <td className="num">{fmtDuration(c.seconds)}</td>
                        <td title={c.payToAddr}>{short(c.payToAddr)}</td>
                        <td>{new Date(c.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <h3>Top-up history</h3>
              {wallet.topups.length === 0 ? (
                <p className="muted small">No deposits yet.</p>
              ) : (
                <table className="ledger">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Txn</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.topups.map((t) => (
                      <tr key={t.txid}>
                        <td className="num">+{formatAlgoExact(t.amountMicroAlgos)}</td>
                        <td title={t.txid}>{short(t.txid)}</td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
          );
        })()
      )}
    </section>
  );
}
