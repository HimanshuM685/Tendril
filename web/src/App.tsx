import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import type { WalletSummary } from "@tendril/shared";
import { WalletBar } from "./components/WalletBar";
import { WalletPanel } from "./components/WalletPanel";
import { Explore } from "./components/Explore";
import { Contribute } from "./components/Contribute";
import { LeasePanel } from "./components/LeasePanel";
import { loginWithWallet } from "./wallet";
import { fetchWallet, type ActiveLease } from "./api";

type Tab = "explore" | "contribute";
export type Session = { token: string; address: string };

export function App() {
  const { activeAddress, signTransactions } = useWallet();
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

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">🌿</span>
          <div>
            <h1>Tendril</h1>
            <p className="tagline">
              Top up once. Rent real compute. Time is metered straight from your ALGO balance.
            </p>
          </div>
        </div>
        <WalletBar
          signedIn={!!session}
          canSignIn={!!activeAddress}
          signingIn={signingIn}
          onSignIn={signIn}
        />
      </header>

      {error && <div className="error">{error}</div>}

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

      <nav className="tabs">
        <button className={tab === "explore" ? "active" : ""} onClick={() => setTab("explore")}>
          Explore
        </button>
        <button
          className={tab === "contribute" ? "active" : ""}
          onClick={() => setTab("contribute")}
        >
          Contribute
        </button>
      </nav>

      <main>
        {tab === "explore" ? (
          <Explore
            session={session}
            balanceMicroAlgos={wallet?.balanceMicroAlgos ?? 0}
            onLeased={setLease}
          />
        ) : (
          <Contribute address={activeAddress} />
        )}

        {lease && (
          <LeasePanel lease={lease} onRelease={() => setLease(null)} />
        )}
      </main>

      <footer className="muted small">
        Sandbox boundary: each lease runs an ephemeral Docker container — no host mount, no host
        network, dropped capabilities, destroyed when the lease ends.
      </footer>
    </div>
  );
}
