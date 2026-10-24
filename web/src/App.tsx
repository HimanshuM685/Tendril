import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import type { WalletSummary } from "@tendril/shared";
import { WalletBar } from "./components/WalletBar";
import { Sidebar } from "./components/Sidebar";
import { TendrilBrand } from "./components/TendrilBrand";
import { loginWithWallet } from "./wallet";
import { fetchWallet, type ActiveLease } from "./api";
import { serializeSigner } from "./lib/x402Client";
import { network } from "./lib/network";
import { isCustodialSession } from "./lib/session";
import { LandingPage } from "./components/LandingPage";

export type Session = {
  token: string;
  address: string;
  authType?: "wallet" | "google" | "email";
  email?: string;
  name?: string | null;
};

const SESSION_KEY = "tendril.session";

// Keep first paint small. Wallet chrome stays eager; route screens and modals
// load only when their route/state needs them.
const loadMarketplace = () => import("./components/Marketplace").then(({ Marketplace }) => ({ default: Marketplace }));
const Marketplace = lazy(loadMarketplace);
const BrandGuidelinesPage = lazy(() => import("./components/BrandGuidelinesPage").then(({ BrandGuidelinesPage }) => ({ default: BrandGuidelinesPage })));
const DocsRedirect = lazy(() => import("./components/DocsRedirect").then(({ DocsRedirect }) => ({ default: DocsRedirect })));
const Legal = lazy(() => import("./components/Legal").then(({ Legal }) => ({ default: Legal })));
const Dashboard = lazy(() => import("./components/Dashboard").then(({ Dashboard }) => ({ default: Dashboard })));
const Metrics = lazy(() => import("./components/Metrics").then(({ Metrics }) => ({ default: Metrics })));
const GoogleCallback = lazy(() => import("./components/GoogleCallback").then(({ GoogleCallback }) => ({ default: GoogleCallback })));
const TopUpModal = lazy(() => import("./components/TopUpModal").then(({ TopUpModal }) => ({ default: TopUpModal })));
const McpModal = lazy(() => import("./components/McpModal").then(({ McpModal }) => ({ default: McpModal })));
const ConnectWalletModal = lazy(() => import("./components/ConnectWalletModal").then(({ ConnectWalletModal }) => ({ default: ConnectWalletModal })));

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
  const isBrand = path === "/brand";
  const isDocs = path === "/docs" || path.startsWith("/docs/") || path === "/api";
  const isLegal =
    path === "/terms" ||
    path === "/tnc" ||
    path === "/terms-and-conditions" ||
    path === "/privacy" ||
    path === "/privacy-policy" ||
    path === "/refunds" ||
    path === "/refund";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [path]);

  // Marketplace is next route reached from landing CTAs. Load its chunk while
  // user is reading landing content so navigation does not reveal Suspense UI.
  useEffect(() => {
    if (!isLanding) return;
    const prefetch = () => { void loadMarketplace(); };
    const idle = window.setTimeout(prefetch, 700);
    return () => {
      window.clearTimeout(idle);
    };
  }, [isLanding]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/explore": "Explore",
      "/contribute": "Contribute",
      "/dashboard": "Dashboard",
      "/metrics": "Metrics",
      "/api": "API",
      "/docs": "Docs",
      "/terms": "Terms of Service",
      "/tnc": "Terms & Conditions",
      "/terms-and-conditions": "Terms & Conditions",
      "/privacy": "Privacy Policy",
      "/privacy-policy": "Privacy Policy",
      "/refunds": "Refund Policy",
      "/refund": "Refund Policy",
      "/brand": "Brand Guidelines",
    };
    const page = titles[path];
    document.title = page ? `${page} · Tendril` : "Tendril — Rent Real Compute by the Second";
  }, [path]);

  // Drop session if account switches
  useEffect(() => {
    if (!isReady || isCustodialAuth) return;
    if (!activeAddress || (session && session.address !== activeAddress)) {
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

  // Legal pages render independently without authenticated app chrome.
  if (isLegal) {
    return (
      <div className="app app-landing">
        <Suspense fallback={<p className="muted">Loading legal page…</p>}>
          <Routes>
            <Route path="/terms" element={<Legal document="terms" />} />
            <Route path="/tnc" element={<Legal document="terms" />} />
            <Route path="/terms-and-conditions" element={<Legal document="terms" />} />
            <Route path="/privacy" element={<Legal document="privacy" />} />
            <Route path="/privacy-policy" element={<Legal document="privacy" />} />
            <Route path="/refunds" element={<Legal document="refund" />} />
            <Route path="/refund" element={<Legal document="refund" />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  if (isBrand) {
    return (
      <div className="app app-landing">
        <Suspense fallback={<p className="muted">Loading brand guidelines…</p>}>
          <BrandGuidelinesPage />
        </Suspense>
      </div>
    );
  }

  // Documentation is independently deployed at docs.tendrilhq.com.
  if (isDocs) {
    return <Suspense fallback={<p className="muted">Opening documentation…</p>}><DocsRedirect /></Suspense>;
  }

  return (
    <div className="app app-appshell">
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <TendrilBrand
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        </div>
      </header>

      <div className={`app-shell-container ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* Sidebar matching explore.png */}
        <Sidebar
          session={session}
          activeAddress={effectiveAddress}
          wallet={wallet}
          activeLeaseCount={lease ? 1 : 2}
          onConnectWallet={() => setConnectWalletOpen(true)}
          onOpenTopUp={() => setTopUpOpen(true)}
          onOpenMcp={() => setMcpOpen(true)}
          onSignOut={() => setSession(null)}
        />

        {/* Backdrop for mobile drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Main Content View */}
        <main className="app-main-content">
          <div className="desktop-account">
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
            <div className="error" style={{ marginBottom: "20px" }}>
              <span>{error}</span>
              <button
                className="error-dismiss"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
              >
                &times;
              </button>
            </div>
          )}

          <Suspense fallback={<p className="muted">Loading workspace…</p>}>
            <Routes>
              <Route
                path="/auth/google"
                element={<GoogleCallback onSession={(s) => setSession(s)} />}
              />
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
              <Route path="*" element={<Navigate to="/explore" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Global Modals */}
      <Suspense fallback={null}>
        {connectWalletOpen && (
          <ConnectWalletModal
            onClose={() => setConnectWalletOpen(false)}
            onCustodialSession={(res) => {
              setSession({
                token: res.token,
                address: res.address,
                authType: res.authType,
                email: res.email,
                name: res.name,
              });
            }}
            onWalletConnected={() => {
              autoSignIn.current = true;
            }}
          />
        )}

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

        {mcpOpen && <McpModal onClose={() => setMcpOpen(false)} />}
      </Suspense>
    </div>
  );
}
