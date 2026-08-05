import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@txnlab/use-wallet-react";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";

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
 * One "Connect Wallet" button → a picker modal (Pera / Defly / …) → on connect,
 * sign-in fires automatically so the prepaid balance loads in a single flow.
 * Once connected the address is a menu: balance, top up, history, account
 * switching, disconnect.
 */
export function WalletBar({ signedIn, canSignIn, signingIn, onSignIn, balanceAtomic }: Props) {
  const { wallets, activeAddress, activeWallet, activeWalletAccounts } = useWallet();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  // Only auto sign-in after a user-initiated connect (not on reload reconnect).
  const autoSignIn = useRef(false);

  useEffect(() => {
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

  // Switching account drops the session (App clears it on address change), so
  // re-sign automatically instead of leaving the user at a signed-out balance.
  function switchAccount(address: string) {
    autoSignIn.current = true;
    activeWallet?.setActiveAccount(address);
    setOpen(false);
  }

  const others = (activeWalletAccounts ?? []).filter((a) => a.address !== activeAddress);
  const hasBalance = signedIn && balanceAtomic !== null;

  const picker = picking && (
    <div className="modal-backdrop" onClick={() => setPicking(false)}>
      <div
        className="modal"
        role="dialog"
        aria-label="Select wallet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>// SELECT WALLET</span>
          <button className="modal-close" aria-label="Close" onClick={() => setPicking(false)}>
            ×
          </button>
        </div>
        <div className="modal-wallets">
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
                setPicking(true);
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
      <button className="btn" onClick={() => setPicking(true)}>
        Connect Wallet
      </button>
      {picker}
    </div>
  );
}
