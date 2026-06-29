import { useEffect, useRef, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";

interface Props {
  signedIn: boolean;
  canSignIn: boolean;
  signingIn: boolean;
  onSignIn: () => void;
}

/**
 * One "Connect Wallet" button → a picker modal (Pera / Defly / …) → on connect,
 * sign-in fires automatically so the prepaid balance loads in a single flow.
 */
export function WalletBar({ signedIn, canSignIn, signingIn, onSignIn }: Props) {
  const { wallets, activeAddress, activeWallet } = useWallet();
  const [picking, setPicking] = useState(false);
  // Only auto sign-in after a user-initiated connect (not on reload reconnect).
  const autoSignIn = useRef(false);

  useEffect(() => {
    if (activeAddress && autoSignIn.current && !signedIn && canSignIn && !signingIn) {
      autoSignIn.current = false;
      onSignIn();
    }
  }, [activeAddress, signedIn, canSignIn, signingIn, onSignIn]);

  async function connect(w: (typeof wallets)[number]) {
    autoSignIn.current = true;
    try {
      await w.connect();
      setPicking(false);
    } catch {
      autoSignIn.current = false;
    }
  }

  if (activeAddress) {
    return (
      <div className="wallet-bar">
        <span className="addr" title={activeAddress}>
          {activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}
        </span>
        {!signedIn && (
          <button className="btn" disabled={!canSignIn || signingIn} onClick={onSignIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        )}
        <button className="btn ghost" onClick={() => activeWallet?.disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-bar">
      <button className="btn" onClick={() => setPicking(true)}>
        Connect Wallet
      </button>

      {picking && (
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
              {wallets.map((w) => (
                <button key={w.id} className="wallet-choice" onClick={() => connect(w)}>
                  {w.metadata.icon && <img src={w.metadata.icon} alt="" aria-hidden="true" />}
                  <span>{w.metadata.name}</span>
                </button>
              ))}
            </div>
            <p className="modal-foot">
              {signingIn ? "Signing in…" : "Connecting prompts a one-time signature to sign in."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
