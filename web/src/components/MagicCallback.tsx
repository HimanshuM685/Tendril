import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WalletId, useWallet } from "@txnlab/use-wallet-react";
import { consumeAutoSignIn, isMagicEnabled, markAutoSignIn } from "../lib/magicConfig";
import { getMagic } from "../lib/magic";

/**
 * OAuth redirect landing page. Google login sends users here; we finish the Magic
 * session, connect the custom wallet, and hand off to WalletBar for sign-in.
 */
export function MagicCallback() {
  const { wallets, isReady } = useWallet();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isMagicEnabled) {
      navigate("/", { replace: true });
      return;
    }
    if (!isReady || started.current) return;
    started.current = true;

    let cancelled = false;

    (async () => {
      try {
        const magic = await getMagic();
        await magic.oauth2.getRedirectResult();
        const magicWallet = wallets.find((w) => w.id === WalletId.CUSTOM);
        if (!magicWallet) throw new Error("Magic wallet is not configured.");

        markAutoSignIn();
        await magicWallet.connect();
        if (!cancelled) navigate("/explore", { replace: true });
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Google sign-in failed.");
          consumeAutoSignIn();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [wallets, isReady, navigate]);

  if (error) {
    return (
      <div className="magic-callback">
        <p className="modal-err">{error}</p>
        <button className="btn" onClick={() => navigate("/", { replace: true })}>
          Back home
        </button>
      </div>
    );
  }

  return <p className="muted magic-callback">Finishing sign-in…</p>;
}
