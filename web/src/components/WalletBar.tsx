import { useWallet } from "@txnlab/use-wallet-react";

interface Props {
  signedIn: boolean;
  canSignIn: boolean;
  signingIn: boolean;
  onSignIn: () => void;
}

/** Connect/disconnect Pera or Defly, then sign in to load the prepaid wallet. */
export function WalletBar({ signedIn, canSignIn, signingIn, onSignIn }: Props) {
  const { wallets, activeAddress, activeWallet } = useWallet();

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
      {wallets.map((w) => (
        <button key={w.id} className="btn" onClick={() => w.connect()}>
          Connect {w.metadata.name}
        </button>
      ))}
    </div>
  );
}
