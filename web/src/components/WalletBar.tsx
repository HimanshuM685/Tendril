import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WalletId, useWallet } from "@txnlab/use-wallet-react";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";
import { consumeAutoSignIn, isMagicEnabled, markAutoSignIn } from "../lib/magic";

interface Props {
  signedIn: boolean;
  canSignIn: boolean;
  signingIn: boolean;
  onSignIn: () => void;
  /** Prepaid balance in microALGO, or null when not signed in / not loaded. */
  balanceAtomic: number | null;
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/**
 * Where the connect modal is.
 *
 * "choose" only exists when Magic is configured — with no social option there is
 * nothing to choose between, so the button opens the wallet list directly and
 * the flow is exactly what it was before Magic existed.
 */
type Step = "choose" | "social" | "wallets";

/**
 * One "Connect Wallet" button → social or wallet? → Google / email (Magic) or the
 * wallet picker (Pera / Lute / Defly) → on connect, sign-in fires automatically so the
 * prepaid balance loads in a single flow. Once connected the address is a menu:
 * balance, top up, history, account switching, disconnect.
 */
export function WalletBar({ signedIn, canSignIn, signingIn, onSignIn, balanceAtomic }: Props) {
  const { wallets, activeAddress, activeWallet, activeWalletAccounts } = useWallet();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  // Only auto sign-in after a user-initiated connect (not on reload reconnect).
  const autoSignIn = useRef(false);

  const magic = isMagicEnabled ? wallets.find((w) => w.id === WalletId.CUSTOM) : undefined;
  const signers = wallets.filter((w) => w.id !== WalletId.CUSTOM);

  useEffect(() => {
    if (consumeAutoSignIn()) autoSignIn.current = true;
    if (activeAddress && autoSignIn.current && !signedIn && canSignIn && !signingIn) {
      autoSignIn.current = false;
      onSignIn();
    }
  }, [activeAddress, signedIn, canSignIn, signingIn, onSignIn]);

  // Close the menu on an outside click or Escape.
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

  /** Open the modal at the top: the social/wallet fork, or the list if there is no fork. */
  function openPicker() {
    setStep(magic ? "choose" : "wallets");
    setConnectError(null);
    setPicking(true);
  }

  async function connect(w: (typeof wallets)[number], args?: Record<string, unknown>) {
    autoSignIn.current = true;
    setConnecting(true);
    setConnectError(null);
    try {
      await w.connect(args);
      setPicking(false);
    } catch (e) {
      autoSignIn.current = false;
      // Magic's flow happens in its own overlay, so a failure there is invisible
      // unless we surface it — a silent close reads as the button being broken.
      const msg = (e as Error)?.message ?? "";
      setConnectError(/closed|cancel|reject/i.test(msg) ? null : msg || "Could not connect.");
    } finally {
      setConnecting(false);
    }
  }

  function connectGoogle() {
    if (!magic) return;
    markAutoSignIn();
    void connect(magic, { provider: "google" });
  }

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  // Switching account drops the session (App clears it on address change), so
  // re-sign automatically instead of leaving the user at a signed-out balance.
  function switchAccount(address: string) {
    autoSignIn.current = true;
    activeWallet?.setActiveAccount(address);
    setOpen(false);
  }

  const others = (activeWalletAccounts ?? []).filter((a) => a.address !== activeAddress);
  const hasBalance = signedIn && balanceAtomic !== null;

  const headings: Record<Step, string> = {
    choose: "// CONNECT",
    social: "// SOCIAL SIGN-IN",
    wallets: "// SELECT WALLET",
  };

  const picker = picking && (
    <div className="modal-backdrop" onClick={() => setPicking(false)}>
      <div
        className="modal"
        role="dialog"
        aria-label="Connect"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>{headings[step]}</span>
          <button className="modal-close" aria-label="Close" onClick={() => setPicking(false)}>
            ×
          </button>
        </div>

        {step === "choose" && (
          <div className="modal-wallets">
            <button className="wallet-choice" onClick={() => setStep("social")}>
              {magic?.metadata.icon && <img src={magic.metadata.icon} alt="" aria-hidden="true" />}
              <span>
                Social sign-in
                <small>Google or email — no wallet needed</small>
              </span>
            </button>
            <button className="wallet-choice" onClick={() => setStep("wallets")}>
              <span>
                Connect a wallet
                <small>Pera, Lute or Defly</small>
              </span>
            </button>
          </div>
        )}

        {step === "social" && magic && (
          <div className="modal-wallets">
            <button
              type="button"
              className="wallet-choice wallet-choice-google"
              disabled={connecting}
              onClick={connectGoogle}
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

            <div className="modal-divider">
              <span>or</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) void connect(magic, { email: email.trim() });
              }}
            >
              <input
                className="modal-input"
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn" type="submit" disabled={connecting || !email.trim()}>
                {connecting ? "Check your email…" : "Continue with email"}
              </button>
            </form>
          </div>
        )}

        {step === "wallets" && (
          <div className="modal-wallets">
            {signers.length === 0 ? (
              <p className="muted small">
                No Algorand wallet detected. Install Pera or Defly, then reload.
              </p>
            ) : (
              signers.map((w) => (
                <button key={w.id} className="wallet-choice" onClick={() => connect(w)}>
                  {w.metadata.icon && <img src={w.metadata.icon} alt="" aria-hidden="true" />}
                  <span>{w.metadata.name}</span>
                </button>
              ))
            )}
          </div>
        )}

        {connectError && <p className="modal-foot modal-err">{connectError}</p>}

        <p className="modal-foot">
          {magic && step !== "choose" && (
            <button className="modal-back" onClick={() => setStep("choose")}>
              ← back
            </button>
          )}
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
              <span className="muted small">Prepaid balance</span>
              <strong title={hasBalance ? formatUsdcExact(balanceAtomic) : undefined}>
                {hasBalance ? formatUsdc(balanceAtomic) : "—"}
              </strong>
            </div>
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
                openPicker();
              }}
            >
              Switch wallet…
            </button>
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
          </div>
        )}

        {picker}
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <button className="btn" onClick={openPicker}>
        Connect Wallet
      </button>
      {picker}
    </div>
  );
}
