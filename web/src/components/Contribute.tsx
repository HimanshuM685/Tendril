import { useEffect, useState } from "react";
import type { ApiKeyInfo, ComputeNode, CreateApiKeyResponse, WalletSummary } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import {
  createApiKey,
  fetchApiKeys,
  fetchMyNodes,
  fetchPlatform,
  revokeApiKey,
  withdrawEarnings,
} from "../api";
import { writeClipboard } from "../clipboard";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";
import { isCustodialSession } from "../lib/session";

interface Props {
  address: string | null;
  session: Session | null;
  wallet: WalletSummary | null;
  signTransactions: SignTransactions;
  onWalletChanged: () => void;
  onError: (e: string | null) => void;
  onOpenTopUp?: () => void;
}

export function Contribute({
  address,
  session,
  wallet,
  signTransactions,
  onWalletChanged,
  onError,
}: Props) {
  const { runCustodialAction } = useCustodialSign();
  const [nodes, setNodes] = useState<ComputeNode[]>([]);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintStage, setMintStage] = useState<PayStage | "confirming" | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(5_000_000);
  const [mintKeyFee, setMintKeyFee] = useState(100_000);
  const [copied, setCopied] = useState<string | null>(null);

  const isCustodial = isCustodialSession(session);

  useEffect(() => {
    if (!address) {
      setNodes([]);
      return;
    }
    let alive = true;
    const load = () =>
      fetchMyNodes(address)
        .then((n) => alive && setNodes(n))
        .catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address]);

  useEffect(() => {
    if (!session) {
      setKeys([]);
      setNewSecret(null);
      return;
    }
    fetchApiKeys(session.token)
      .then(setKeys)
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    fetchPlatform()
      .then((p) => {
        setMinWithdraw(p.minWithdrawAtomic);
        setMintKeyFee(p.flatMintKeyAtomic);
      })
      .catch(() => {});
  }, []);

  async function mint() {
    if (!session || !address) return;
    setMinting(true);
    setMintStage(null);
    onError(null);
    try {
      let created: CreateApiKeyResponse;
      if (isCustodial) {
        setMintStage("confirming");
        created = (await runCustodialAction(session.token, {
          action: "mintkey",
          label: "",
        })) as CreateApiKeyResponse;
      } else {
        created = await createApiKey(session.token, address, signTransactions, "", setMintStage);
      }
      setKeys((k) => [created.key, ...k]);
      setNewSecret(created.secret);
    } catch (err) {
      if ((err as Error).message !== "cancelled") onError((err as Error).message);
    } finally {
      setMinting(false);
      setMintStage(null);
    }
  }

  async function revoke(id: number) {
    if (!session) return;
    try {
      await revokeApiKey(session.token, id);
      setKeys((k) => k.filter((x) => x.id !== id));
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function withdraw() {
    if (!session) return;
    setWithdrawing(true);
    onError(null);
    try {
      const { amountAtomic } = await withdrawEarnings(session.token);
      onWalletChanged();
      onError(`Withdrew ${formatUsdc(amountAtomic)} to your wallet.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setWithdrawing(false);
    }
  }

  function copy(id: string, text: string) {
    void writeClipboard(text).then((ok) => {
      if (!ok) return;
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const earnings = wallet?.earningsAtomic ?? 0;
  const canWithdraw = earnings >= minWithdraw;

  const keyForEnv = newSecret ?? keys[0]?.preview ?? "YOUR_API_KEY";
  const envCmd = `TENDRIL_API_KEY=${keyForEnv}\nTENDRIL_LABEL=my-rig\nTENDRIL_PRICE_PER_HOUR=0.25`;
  const runCmd = `docker run -d --name tendril-agent \\
  --restart unless-stopped \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  --env-file .env \\
  ghcr.io/tendril/agent:latest`;

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userGreetingName = session?.name || (address ? `${address.slice(0, 6)}…` : "");

  return (
    <div className="explore-dashboard">
      {/* Header Row */}
      <div className="explore-header-row">
        <div>
          <h1 className="explore-greeting">
            {userGreetingName ? `${timeGreeting}, ${userGreetingName}!` : "Contributor Portal"}
          </h1>
          <p className="explore-subtitle">
            Share your hardware, run sandboxed workloads, and earn USDC on Algorand.
          </p>
        </div>
      </div>

      {/* Top 4 Stat Cards (Real data) */}
      <div className="explore-stats-grid">
        <div className="explore-stat-card">
          <div className="stat-card-label">Contributor Earnings</div>
          <div className="stat-card-value">{wallet ? (earnings / 1_000_000).toFixed(2) : "0.00"}</div>
          <div className="stat-card-sub text-green">USDC ready to withdraw</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Your Active Nodes</div>
          <div className="stat-card-value">{nodes.length}</div>
          <div className="stat-card-sub">Hardware daemon instances</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Min Payout Threshold</div>
          <div className="stat-card-value">{formatUsdc(minWithdraw)}</div>
          <div className="stat-card-sub">Algorand USDC floor</div>
        </div>

        <div className="explore-stat-card">
          <div className="stat-card-label">Platform Settlement Fee</div>
          <div className="stat-card-value">5%</div>
          <div className="stat-card-sub">Sponsors network fees</div>
        </div>
      </div>

      {/* Actions Bar with Vector SVG Icons */}
      <div className="compute-actions-bar">
        <span className="ca-title">Contributor Actions</span>
        <div className="ca-buttons">
          <button
            type="button"
            className="ca-btn ca-btn-ghost"
            disabled={minting || !session}
            onClick={mint}
          >
            <span className="ca-btn-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3L22 7l-3-3" />
              </svg>
            </span>
            <span>
              {minting
                ? mintStage
                  ? mintStage === "signing"
                    ? "Approve in wallet…"
                    : mintStage === "confirming"
                      ? "Confirm in dialog…"
                      : "Settling on-chain…"
                    : "Minting…"
                : `Mint API Key (${formatUsdc(mintKeyFee)})`}
            </span>
          </button>

          <button
            type="button"
            className="ca-btn ca-btn-primary"
            disabled={!canWithdraw || withdrawing}
            onClick={withdraw}
          >
            <span>{withdrawing ? "Withdrawing…" : "Withdraw Earnings"}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Main Section */}
      <div className="explore-columns-grid">
        {/* Row 1, Col 1: 1. Contributor API Keys */}
        <div className="explore-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">1. Contributor API Keys</h3>
              <p className="card-head-sub">Authenticates your hardware daemon without exposing wallet private keys</p>
            </div>
          </div>

          <div style={{ padding: "8px 0", flex: 1, display: "flex", flexDirection: "column" }}>
            {!session ? (
              <p className="muted small">
                Connect your wallet and sign in to generate and manage your API keys.
              </p>
            ) : (
              <>
                {newSecret && (
                  <div className="codeblock" style={{ margin: "10px 0" }}>
                    <div className="codeblock-bar">
                      <span className="codeblock-title">NEW API KEY — COPY NOW (SHOWN ONCE)</span>
                      <button
                        className={`codeblock-copy${copied === "key" ? " done" : ""}`}
                        type="button"
                        onClick={() => copy("key", newSecret)}
                      >
                        {copied === "key" ? "COPIED" : "COPY"}
                      </button>
                    </div>
                    <pre className="codeblock-body">{newSecret}</pre>
                  </div>
                )}

                {keys.length > 0 ? (
                  <div className="leases-list" style={{ marginTop: "12px" }}>
                    {keys.map((k) => (
                      <div className="lease-item" key={k.id}>
                        <div className="lease-item-info pl-dot">
                          <div className="lease-item-title" style={{ fontFamily: "var(--font-mono)" }}>
                            {k.preview}
                          </div>
                          <div className="lease-item-meta">
                            {k.lastUsedAt ? `Used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "Never used"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-tiny btn-danger-tiny"
                          onClick={() => revoke(k.id)}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted small" style={{ marginTop: "8px" }}>
                    No active API keys found. Mint one using the button above.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Row 1, Col 2: Your Live Nodes */}
        <div className="explore-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Your Live Nodes</h3>
              <p className="card-head-sub">Compute machines advertised by your daemon</p>
            </div>
          </div>

          <div className="hardware-list">
            {nodes.length > 0 ? (
              nodes.map((n) => (
                <div className="hardware-item" key={n.id}>
                  <div className="hw-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e8810" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                  <div className="hw-info">
                    <div className="hw-title">{n.label}</div>
                    <div className="hw-meta">
                      {n.cpuCores} vCPU &middot; {(n.ramMb / 1024).toFixed(1)} GB RAM &middot; {n.gpu ?? "no GPU"}
                    </div>
                  </div>
                  <div className="hw-action">
                    <span className={`pill-badge ${n.status === "online" ? "pill-running" : "pill-cost"}`}>
                      {n.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="lease-empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <rect width="16" height="16" x="4" y="4" rx="2" />
                  <rect width="6" height="6" x="9" y="9" rx="1" />
                  <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
                </svg>
                <p className="empty-title">No nodes connected yet</p>
                <p className="empty-sub">
                  Start your daemon using the instructions on the left to see your hardware appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Row 2, Col 1: 2. Bring Up The Daemon */}
        <div className="explore-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">2. Bring Up The Daemon</h3>
              <p className="card-head-sub">Runs each sandbox as a sibling Docker container</p>
            </div>
          </div>

          <div style={{ padding: "8px 0" }}>
            <div className="codeblock">
              <div className="codeblock-bar">
                <span className="codeblock-title">.ENV</span>
                <button
                  className={`codeblock-copy${copied === "env" ? " done" : ""}`}
                  type="button"
                  onClick={() => copy("env", envCmd)}
                >
                  {copied === "env" ? "COPIED" : "COPY"}
                </button>
              </div>
              <pre className="codeblock-body">{envCmd}</pre>
            </div>

            <div className="codeblock">
              <div className="codeblock-bar">
                <span className="codeblock-title">SHELL</span>
                <button
                  className={`codeblock-copy${copied === "run" ? " done" : ""}`}
                  type="button"
                  onClick={() => copy("run", runCmd)}
                >
                  {copied === "run" ? "COPIED" : "COPY"}
                </button>
              </div>
              <pre className="codeblock-body">{runCmd}</pre>
            </div>
          </div>
        </div>

        {/* Row 2, Col 2: Earnings & Payouts */}
        <div className="explore-card">
          <div className="explore-card-head">
            <div>
              <h3 className="card-head-title">Earnings &amp; Payouts</h3>
              <p className="card-head-sub">Direct on-chain payout to your connected wallet</p>
            </div>
          </div>

          <div style={{ padding: "12px 0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="muted small">Withdrawable Balance</span>
                <strong className="text-green" style={{ fontSize: "20px" }}>
                  {formatUsdc(earnings)}
                </strong>
              </div>
              <p className="muted small" style={{ lineHeight: "1.6" }}>
                {!session
                  ? "Sign in to view and withdraw your earnings."
                  : canWithdraw
                    ? "Sends your entire balance to your wallet in one transfer. You must be opted into USDC."
                    : `Earned per lease, after the platform fee. Withdraw once you reach the ${formatUsdc(minWithdraw)} floor.`}
              </p>
            </div>

            <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#fafbf7", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Payout Threshold</span>
                <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--brand-green)", fontWeight: 600 }}>{formatUsdc(minWithdraw)}</span>
              </div>
              <p className="muted small" style={{ margin: 0, fontSize: "11px" }}>
                Payouts are settled instantly on Algorand testnet directly to your registered wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
