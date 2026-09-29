import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import type { WalletSummary } from "@tendril/shared";
import { WalletBar } from "./components/WalletBar";
import { Marketplace } from "./components/Marketplace";
import { LandingPage } from "./components/LandingPage";
import { Docs } from "./components/Docs";
import { Dashboard } from "./components/Dashboard";
import { Metrics } from "./components/Metrics";
import { GoogleCallback } from "./components/GoogleCallback";
import { Sidebar } from "./components/Sidebar";
import { TopUpModal } from "./components/TopUpModal";
import { McpModal } from "./components/McpModal";
import { ConnectWalletModal } from "./components/ConnectWalletModal";
import { loginWithWallet } from "./wallet";
import { fetchWallet, type ActiveLease } from "./api";
import { serializeSigner } from "./lib/x402Client";
import { isCustodialSession } from "./lib/session";

export type Session = {
  token: string;
  address: string;
  authType?: "wallet" | "google" | "email";
  email?: string;
  name?: string | null;
};

const SESSION_KEY = "tendril.session";

function ApiToDocs() {
  const { hash } = useLocation();
  return <Navigate to={`/docs?doc=api${hash}`} replace />;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.token && s.address ? s : null;
  } catch {
    return null;
  }
}

function storeSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function App() {
  const { activeAddress, signTransactions: rawSign, isReady } = useWallet();
  const signTransactions = useMemo(
    () => serializeSigner(rawSign as never),
    [rawSign],
  ) as typeof rawSign;

  const location = useLocation();
  const navigate = useNavigate();
  const [lease, setLease] = useState<ActiveLease | null>(null);
  const [session, setSessionState] = useState<Session | null>(loadSession);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [connectWalletOpen, setConnectWalletOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const autoSignIn = useRef(false);

  const effectiveAddress = session?.address ?? activeAddress ?? null;
  const isCustodialAuth = isCustodialSession(session);

  const setSession = useCallback((s: Session | null) => {
    storeSession(s);
    setSessionState(s);
    if (!s) setWallet(null);
  }, []);

  const path = location.pathname;
  const isLanding = path === "/";
  const isDocs = path.startsWith("/docs") || path === "/api";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/explore": "EXPLORE",
      "/contribute": "CONTRIBUTE",
      "/dashboard": "DASHBOARD",
      "/metrics": "METRICS",
      "/docs": "DOCS",
    };
    const page = titles[path];
    document.title = page ? `${page} · Tendril` : "Tendril — Rent Real Compute by the Second";
  }, [path]);

  // A null activeAddress on reload is the wallet still resuming, not a disconnect.
  // Clearing the session there made every signed-in action (withdraw, mint, balance)
  // look empty until the user signed in again.
  useEffect(() => {
    if (!isReady || isCustodialAuth) return;
    if (activeAddress && session && session.address !== activeAddress) {
      setSession(null);
    }
  }, [isReady, activeAddress, session, setSession, isCustodialAuth]);

  const refreshWallet = useCallback(
    async (token: string) => {
      try {
        setWallet(await fetchWallet(token));
      } catch (e) {
        if (/\b401\b/.test((e as Error).message)) setSession(null);
      }
    },
    [setSession],
  );

  useEffect(() => {
    if (!session) return;
    const { token } = session;
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      if (timer) return;
      refreshWallet(token);
      timer = setInterval(() => refreshWallet(token), 5000);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session, refreshWallet]);

  async function signIn() {
    if (!activeAddress || isCustodialAuth) return;
    setSigningIn(true);
    setError(null);
    try {
      const res = await loginWithWallet(activeAddress, signTransactions as never);
      setSession({ token: res.token, address: res.address, authType: "wallet" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSigningIn(false);
    }
  }

  // Trigger signature when wallet connects with autoSignIn enabled
  useEffect(() => {
    if (activeAddress && autoSignIn.current && !session && !isCustodialAuth && !signingIn) {
      autoSignIn.current = false;
      void signIn();
    }
  }, [activeAddress, session, isCustodialAuth, signingIn]);

  const onWalletChanged = () => session && refreshWallet(session.token);

  // Landing page route renders the standalone landing page
  if (isLanding) {
    return (
      <div className="app app-landing">
        <LandingPage />
      </div>
    );
  }

  if (path === "/api") {
    return <ApiToDocs />;
  }

  // Standalone docs portal matching docs-page-layout.png (docs.tendrilhq.com)
  if (isDocs) {
    return <Docs />;
  }

  return (
    <div className="app app-appshell">
      <header className="mobile-header">
        <div className="brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <span className="brand-flower">
            <svg viewBox="0 0 32 32" width="24" height="24">
              <rect width="32" height="32" rx="6" fill="#0B5D3A" />
              <g fill="#F4F1EA">
                <rect x="5" y="7" width="22" height="4" />
                <rect x="5" y="7" width="2" height="3" />
                <rect x="25" y="7" width="2" height="3" />
                <rect x="14" y="7" width="4" height="17" />
                <rect x="10" y="22" width="12" height="3" />
              </g>
            </svg>
          </span>
          <span className="brand-text">Tendril</span>
        </div>
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle Navigation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      <div className={`app-shell-container ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <Sidebar
          session={session}
          activeAddress={effectiveAddress}
          wallet={wallet}
          activeLeaseCount={lease ? 1 : 0}
          onConnectWallet={() => setConnectWalletOpen(true)}
          onOpenTopUp={() => setTopUpOpen(true)}
          onOpenMcp={() => setMcpOpen(true)}
          onSignOut={() => setSession(null)}
        />

        {mobileMenuOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        <main className="app-main-content">
          <div className="shell-wallet">
            <WalletBar
              session={session}
              signedIn={!!session}
              canSignIn={!!activeAddress && !isCustodialAuth}
              signingIn={signingIn}
              onSignIn={signIn}
              onSignOut={() => setSession(null)}
              onCustodialSession={(res) =>
                setSession({
                  token: res.token,
                  address: res.address,
                  authType: res.authType,
                  email: res.email,
                  name: res.name,
                })
              }
              onAccountRefresh={onWalletChanged}
              balanceAtomic={wallet?.balanceAtomic ?? null}
              signTransactions={signTransactions as never}
            />
          </div>
          {error && (
            <div className="error">
              <span>{error}</span>
              <button className="error-dismiss" aria-label="Dismiss error" onClick={() => setError(null)}>
                ×
              </button>
            </div>
          )}
          <Routes>
            <Route path="/auth/google" element={<GoogleCallback onSession={(s) => setSession(s)} />} />
            <Route
              path="/explore"
              element={
                <Marketplace
                  tab="explore"
                  session={session}
                  wallet={wallet}
                  activeAddress={effectiveAddress}
                  signTransactions={signTransactions}
                  onWalletChanged={onWalletChanged}
                  onError={setError}
                  lease={lease}
                  onLeased={setLease}
                  onOpenTopUp={() => setTopUpOpen(true)}
                  onOpenConnectWallet={() => setConnectWalletOpen(true)}
                />
              }
            />
            <Route
              path="/contribute"
              element={
                <Marketplace
                  tab="contribute"
                  session={session}
                  wallet={wallet}
                  activeAddress={effectiveAddress}
                  signTransactions={signTransactions}
                  onWalletChanged={onWalletChanged}
                  onError={setError}
                  lease={lease}
                  onLeased={setLease}
                  onOpenTopUp={() => setTopUpOpen(true)}
                  onOpenConnectWallet={() => setConnectWalletOpen(true)}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  session={session}
                  wallet={wallet}
                  address={effectiveAddress}
                  signedIn={!!session}
                  signTransactions={signTransactions}
                  onWalletChanged={onWalletChanged}
                  onError={setError}
                  lease={lease}
                  onLeaseEnded={() => setLease(null)}
                  onOpenTopUp={() => setTopUpOpen(true)}
                />
              }
            />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/api" element={<ApiToDocs />} />
            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Routes>
        </main>
      </div>

      {topUpOpen && (
        <TopUpModal
          address={effectiveAddress}
          session={session}
          signTransactions={signTransactions as never}
          onClose={() => setTopUpOpen(false)}
          onChanged={onWalletChanged}
          onError={setError}
        />
      )}

      {connectWalletOpen && (
        <ConnectWalletModal
          onClose={() => setConnectWalletOpen(false)}
          onCustodialSession={(res) =>
            setSession({
              token: res.token,
              address: res.address,
              authType: res.authType,
              email: res.email,
              name: res.name,
            })
          }
          onWalletConnected={() => {
            autoSignIn.current = true;
          }}
        />
      )}

      {mcpOpen && <McpModal onClose={() => setMcpOpen(false)} />}
    </div>
  );
}
