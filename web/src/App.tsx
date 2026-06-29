import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import type { WalletSummary } from "@tendril/shared";
import { WalletBar } from "./components/WalletBar";
import { WalletPanel } from "./components/WalletPanel";
import { Explore } from "./components/Explore";
import { Contribute } from "./components/Contribute";
import { LeasePanel } from "./components/LeasePanel";
import { HashHero } from "./components/HashHero";
import { Docs } from "./components/Docs";
import { About } from "./components/About";
import { Dashboard } from "./components/Dashboard";
import { loginWithWallet } from "./wallet";
import { fetchWallet, type ActiveLease } from "./api";

type Tab = "explore" | "contribute";
type View = "landing" | "app" | "dashboard" | "docs" | "about";
export type Session = { token: string; address: string };

export function App() {
  const { activeAddress, signTransactions } = useWallet();
  const [view, setView] = useState<View>("landing");
  const [tab, setTab] = useState<Tab>("explore");
  const [lease, setLease] = useState<ActiveLease | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const enterApp = (t: Tab) => {
    setTab(t);
    setView("app");
  };

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true"></div>

      <header className="masthead">
        <nav className="mast-left">
          {view === "app" ? (
            <>
              <button className={tab === "explore" ? "active" : ""} onClick={() => setTab("explore")}>
                EXPLORE
              </button>
              <button
                className={tab === "contribute" ? "active" : ""}
                onClick={() => setTab("contribute")}
              >
                CONTRIBUTE
              </button>
            </>
          ) : (
            view !== "landing" && (
              <button onClick={() => enterApp("explore")}>EXPLORE&nbsp;→</button>
            )
          )}
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>
            DASHBOARD
          </button>
          <button className={view === "docs" ? "active" : ""} onClick={() => setView("docs")}>
            DOCS
          </button>
          <button className={view === "about" ? "active" : ""} onClick={() => setView("about")}>
            ABOUT
          </button>
        </nav>
        <span className="wordmark" onClick={() => setView("landing")} role="button" tabIndex={0}>
          TENDRIL<span className="wm-tld">.ALGO</span>
        </span>
        <div className="mast-right">
          {view !== "landing" && (
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

        {view === "landing" && (
          <HashHero
            onEnter={() => enterApp("explore")}
            onDocs={() => setView("docs")}
            onAbout={() => setView("about")}
          />
        )}

        {view === "dashboard" && (
          <Dashboard wallet={wallet} address={session?.address ?? null} signedIn={!!session} />
        )}
        {view === "docs" && <Docs />}
        {view === "about" && <About />}

        {view === "app" && (
          <>
            {session && (
              <WalletPanel
                wallet={wallet}
                address={session.address}
                signTransactions={signTransactions as never}
                token={session.token}
                onChanged={() => refreshWallet(session.token)}
                onError={setError}
              />
            )}

            <section className="index">
              <div className="section-head">
                <div className="sh-left">
                  <p className="kicker">// {tab === "explore" ? "THE MARKETPLACE" : "SHARE COMPUTE"}</p>
                  <h2 className="display section-title">
                    {tab === "explore" ? "EXPLORE" : "CONTRIBUTE"}
                  </h2>
                </div>
              </div>
              <div className="rule"></div>

              {tab === "explore" ? (
                <Explore
                  session={session}
                  balanceMicroAlgos={wallet?.balanceMicroAlgos ?? 0}
                  onLeased={setLease}
                />
              ) : (
                <Contribute address={activeAddress} />
              )}

              {lease && <LeasePanel lease={lease} onRelease={() => setLease(null)} />}
            </section>
          </>
        )}
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
