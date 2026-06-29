import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import type { WalletSummary } from "@tendril/shared";
import { WalletBar } from "./components/WalletBar";
import { Marketplace } from "./components/Marketplace";
import { HashHero } from "./components/HashHero";
import { Docs } from "./components/Docs";
import { About } from "./components/About";
import { Dashboard } from "./components/Dashboard";
import { loginWithWallet } from "./wallet";
import { fetchWallet, type ActiveLease } from "./api";

export type Session = { token: string; address: string };

export function App() {
  const { activeAddress, signTransactions } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [lease, setLease] = useState<ActiveLease | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const path = location.pathname;
  const isLanding = path === "/";
  const inApp = path === "/explore" || path === "/contribute";

  // Drop the session if the wallet disconnects or switches accounts.
  useEffect(() => {
    if (!activeAddress || (session && session.address !== activeAddress)) {
      setSession(null);
      setWallet(null);
    }
  }, [activeAddress, session]);

  const refreshWallet = useCallback(async (token: string) => {
    try {
      setWallet(await fetchWallet(token));
    } catch {
      /* transient */
    }
  }, []);

  // While signed in, poll the balance so it visibly drains as compute is metered.
  useEffect(() => {
    if (!session) return;
    refreshWallet(session.token);
    const t = setInterval(() => refreshWallet(session.token), 5000);
    return () => clearInterval(t);
  }, [session, refreshWallet]);

  async function signIn() {
    if (!activeAddress) return;
    setSigningIn(true);
    setError(null);
    try {
      const res = await loginWithWallet(activeAddress, signTransactions as never);
      setSession({ token: res.token, address: res.address });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSigningIn(false);
    }
  }

  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");
  const onWalletChanged = () => session && refreshWallet(session.token);

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true"></div>

      <header className="masthead">
        <nav className="mast-left">
          {inApp ? (
            <>
              <NavLink to="/explore" className={navClass}>
                EXPLORE
              </NavLink>
              <NavLink to="/contribute" className={navClass}>
                CONTRIBUTE
              </NavLink>
            </>
          ) : (
            !isLanding && (
              <NavLink to="/explore" className={navClass}>
                EXPLORE&nbsp;→
              </NavLink>
            )
          )}
          <NavLink to="/dashboard" className={navClass}>
            DASHBOARD
          </NavLink>
          <NavLink to="/docs" className={navClass}>
            DOCS
          </NavLink>
          <NavLink to="/about" className={navClass}>
            ABOUT
          </NavLink>
        </nav>
        <span className="wordmark" onClick={() => navigate("/")} role="button" tabIndex={0}>
          TENDRIL<span className="wm-tld">.ALGO</span>
        </span>
        <div className="mast-right">
          {!isLanding && (
            <WalletBar
              signedIn={!!session}
              canSignIn={!!activeAddress}
              signingIn={signingIn}
              onSignIn={signIn}
            />
          )}
        </div>
      </header>

      <div className="rule rule-heavy"></div>

      <main>
        {error && <div className="error">{error}</div>}

        <Routes>
          <Route
            path="/"
            element={
              <HashHero
                onEnter={() => navigate("/explore")}
                onDocs={() => navigate("/docs")}
                onAbout={() => navigate("/about")}
              />
            }
          />
          <Route
            path="/explore"
            element={
              <Marketplace
                tab="explore"
                session={session}
                wallet={wallet}
                activeAddress={activeAddress ?? null}
                signTransactions={signTransactions}
                onWalletChanged={onWalletChanged}
                onError={setError}
                lease={lease}
                onLeased={setLease}
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
                activeAddress={activeAddress ?? null}
                signTransactions={signTransactions}
                onWalletChanged={onWalletChanged}
                onError={setError}
                lease={lease}
                onLeased={setLease}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard wallet={wallet} address={session?.address ?? null} signedIn={!!session} />
            }
          />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <div className="rule rule-heavy"></div>

      <footer className="footer">
        <span>&copy;&nbsp;TENDRIL</span>
        <span className="foot-mid">
          EPHEMERAL DOCKER SANDBOX &bull; NO HOST MOUNT &bull; DESTROYED ON LEASE END
        </span>
        <span>ALGORAND&nbsp;TESTNET</span>
      </footer>
    </div>
  );
}
