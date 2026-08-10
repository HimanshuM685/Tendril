import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import type { EmailSessionResponse, GasRequestInfo, GoogleSessionResponse } from "@tendril/shared";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";
import { fetchEmailEnabled, fetchGoogleEnabled, googleLoginUrl } from "../lib/custodialClient";
import {
  fetchOnchainBalances,
  fetchWalletAccount,
  fetchWalletGasRequest,
  optInUsdcWithWallet,
  submitWalletGasRequest,
} from "../lib/walletAccount";
import type { SignTransactions } from "../wallet";
import type { Session } from "../App";
import { GoogleWalletBar } from "./GoogleWalletBar";
import { EmailAuthModal } from "./EmailAuthModal";
import { OnchainAccountPanel } from "./OnchainAccountPanel";
import { isCustodialSession } from "../lib/session";
import type { OnchainPanelState } from "./OnchainAccountPanel";

interface Props {
  session: Session | null;
  signedIn: boolean;
  canSignIn: boolean;
  signingIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onCustodialSession: (res: GoogleSessionResponse | EmailSessionResponse) => void;
  onAccountRefresh?: () => void;
  balanceAtomic: number | null;
  signTransactions: SignTransactions;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function WalletBar({
  session,
  signedIn,
  canSignIn,
  signingIn,
  onSignIn,
  onSignOut,
  onCustodialSession,
  onAccountRefresh,
  balanceAtomic,
  signTransactions,
}: Props) {
  const { wallets, activeAddress, activeWallet, activeWalletAccounts } = useWallet();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [onchain, setOnchain] = useState<OnchainPanelState | null>(null);
  const [gasRequest, setGasRequest] = useState<GasRequestInfo | null | undefined>(undefined);
  const [gasBusy, setGasBusy] = useState(false);
  const [optInBusy, setOptInBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const autoSignIn = useRef(false);

  const walletSignedIn = signedIn && !isCustodialSession(session);

  useEffect(() => {
    void fetchGoogleEnabled().then(setGoogleEnabled);
    void fetchEmailEnabled().then(setEmailEnabled);
  }, []);

  useEffect(() => {
    if (!picking) return;
    void fetchGoogleEnabled().then(setGoogleEnabled);
    void fetchEmailEnabled().then(setEmailEnabled);
  }, [picking]);

  useEffect(() => {
    if (activeAddress && autoSignIn.current && !signedIn && canSignIn && !signingIn) {
      autoSignIn.current = false;
      onSignIn();
    }
  }, [activeAddress, signedIn, canSignIn, signingIn, onSignIn]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const loadOnchain = async () => {
    if (!activeAddress) return;
    try {
      if (walletSignedIn && session?.token) {
        const acct = await fetchWalletAccount(session.token);
        setOnchain({
          algoMicro: acct.algoMicro,
          usdcAtomic: acct.usdcAtomic,
          usdcOptedIn: acct.usdcOptedIn,
          gasGrantEligible: acct.gasGrantEligible,
        });
        setGasRequest(await fetchWalletGasRequest(session.token));
      } else {
        const bal = await fetchOnchainBalances(activeAddress);
        setOnchain({ ...bal, gasGrantEligible: false });
        setGasRequest(undefined);
      }
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    if (!activeAddress) {
      setOnchain(null);
      setGasRequest(undefined);
      return;
    }
    void loadOnchain();
    const t = setInterval(() => void loadOnchain(), 8000);
    return () => clearInterval(t);
  }, [activeAddress, walletSignedIn, session?.token]);

  if (isCustodialSession(session)) {
    return (
      <GoogleWalletBar
        session={session}
        signedIn={signedIn}
        balanceAtomic={balanceAtomic}
        onSignOut={onSignOut}
        onAccountRefresh={onAccountRefresh}
      />
    );
  }

  async function connect(w: (typeof wallets)[number]) {
    autoSignIn.current = true;
    try {
      await w.connect();
      setPicking(false);
    } catch (e) {
      autoSignIn.current = false;
      const msg = (e as Error)?.message ?? "Could not connect.";
      if (!/cancel|reject|closed/i.test(msg)) console.error("[wallet]", e);
    }
  }

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  function switchAccount(address: string) {
    autoSignIn.current = true;
    activeWallet?.setActiveAccount(address);
    setOpen(false);
  }

  async function optInUsdc() {
    if (!activeAddress) return;
    setOptInBusy(true);
    setErr(null);
    try {
      await optInUsdcWithWallet(activeAddress, signTransactions);
      await loadOnchain();
      onAccountRefresh?.();
    } catch (e) {
      const msg = (e as Error).message;
      if (!/cancel/i.test(msg)) setErr(msg);
    } finally {
      setOptInBusy(false);
    }
  }

  async function requestGas() {
    if (!session?.token) return;
    setGasBusy(true);
    setErr(null);
    try {
      setGasRequest(await submitWalletGasRequest(session.token));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setGasBusy(false);
    }
  }

  const others = (activeWalletAccounts ?? []).filter((a) => a.address !== activeAddress);
  const hasBalance = walletSignedIn && balanceAtomic !== null;

  const picker = picking && (
    <div className="modal-backdrop" onClick={() => setPicking(false)}>
      <div
        className="modal"
        role="dialog"
        aria-label="Connect"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// CONNECT</span>
          <button className="modal-close" aria-label="Close" onClick={() => setPicking(false)}>
            ×
          </button>
        </div>
        <div className="modal-wallets">
          {emailEnabled && (
            <button
              type="button"
              className="wallet-choice wallet-choice-email"
              onClick={() => {
                setPicking(false);
                setEmailOpen(true);
              }}
            >
              <span className="email-icon" aria-hidden="true">
                @
              </span>
              <span>Continue with email</span>
            </button>
          )}
          {googleEnabled && (
            <button
              type="button"
              className="wallet-choice wallet-choice-google"
              onClick={() => {
                window.location.href = googleLoginUrl();
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
          {wallets.length === 0 ? (
            <p className="muted small">
              No Algorand wallet detected. Install Pera or Defly, then reload.
            </p>
          ) : (
            wallets.map((w) => (
              <button key={w.id} className="wallet-choice" onClick={() => connect(w)}>
                {w.metadata.icon && <img src={w.metadata.icon} alt="" aria-hidden="true" />}
                <span>{w.metadata.name}</span>
              </button>
            ))
          )}
        </div>
        <p className="modal-foot">
          {signingIn ? "Signing in…" : "Connecting prompts a one-time signature to sign in."}
        </p>
      </div>
    </div>
  );

  if (activeAddress) {
    return (
      <div className="wallet-bar" ref={barRef}>
        {!signedIn && (
          <button className="btn" disabled={!canSignIn || signingIn} onClick={onSignIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        )}
        <button
          className="addr addr-btn"
          title={activeAddress}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {short(activeAddress)} <span aria-hidden="true">▾</span>
        </button>

        {open && (
          <div className="wallet-menu" role="menu">
            <div className="wm-balance">
              <span className="muted small">Address</span>
              <code className="wm-addr" title={activeAddress}>
                {short(activeAddress)}
              </code>
            </div>
            <OnchainAccountPanel
              account={onchain}
              gasRequest={walletSignedIn ? gasRequest : undefined}
              gasBusy={gasBusy}
              optInBusy={optInBusy}
              onOptIn={() => void optInUsdc()}
              onRequestGas={() => void requestGas()}
            />
            <div className="wm-balance">
              <span className="muted small">Prepaid credit</span>
              <strong title={hasBalance ? formatUsdcExact(balanceAtomic) : undefined}>
                {hasBalance ? formatUsdc(balanceAtomic) : "—"}
              </strong>
            </div>
            {!walletSignedIn && (
              <p className="muted small" style={{ padding: "0 12px 8px" }}>
                Sign in to request a gas grant or view prepaid credit.
              </p>
            )}
            {err && <p className="modal-err">{err}</p>}
            <button className="wm-item" role="menuitem" onClick={() => go("/dashboard")}>
              Top up
            </button>
            <button className="wm-item" role="menuitem" onClick={() => go("/dashboard#history")}>
              History
            </button>
            {others.length > 0 && (
              <>
                <span className="wm-label muted small">Switch account</span>
                {others.map((a) => (
                  <button
                    key={a.address}
                    className="wm-item"
                    role="menuitem"
                    title={a.address}
                    onClick={() => switchAccount(a.address)}
                  >
                    {a.name && a.name !== a.address ? `${a.name} · ` : ""}
                    {short(a.address)}
                  </button>
                ))}
              </>
            )}
            <button
              className="wm-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setPicking(true);
              }}
            >
              Switch wallet…
            </button>
            {walletSignedIn ? (
              <button className="wm-item wm-danger" role="menuitem" onClick={onSignOut}>
                Sign out
              </button>
            ) : (
              <button
                className="wm-item wm-danger"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  activeWallet?.disconnect();
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        )}
        {picker}
        {emailOpen && (
          <EmailAuthModal
            onClose={() => setEmailOpen(false)}
            onSuccess={(res) => {
              setEmailOpen(false);
              onCustodialSession(res);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <button className="btn" onClick={() => setPicking(true)}>
        Connect Wallet
      </button>
      {picker}
      {emailOpen && (
        <EmailAuthModal
          onClose={() => setEmailOpen(false)}
          onSuccess={(res) => {
            setEmailOpen(false);
            onCustodialSession(res);
          }}
        />
      )}
    </div>
  );
}
