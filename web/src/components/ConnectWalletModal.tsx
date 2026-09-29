import { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import type { EmailSessionResponse, GoogleSessionResponse } from "@tendril/shared";
import { fetchEmailEnabled, fetchGoogleEnabled, googleLoginUrl } from "../lib/custodialClient";
import { EmailAuthModal } from "./EmailAuthModal";

interface Props {
  onClose: () => void;
  onCustodialSession: (res: GoogleSessionResponse | EmailSessionResponse) => void;
  onWalletConnected?: () => void;
}

export function ConnectWalletModal({ onClose, onCustodialSession, onWalletConnected }: Props) {
  const { wallets } = useWallet();
  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchGoogleEnabled().then(setGoogleEnabled);
    void fetchEmailEnabled().then(setEmailEnabled);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleConnect(walletName: "Lute" | "Pera" | "Defly") {
    setError(null);
    setConnectingWallet(walletName);

    const targetWallet = wallets.find((w) =>
      w.id.toLowerCase().includes(walletName.toLowerCase()) ||
      w.metadata.name.toLowerCase().includes(walletName.toLowerCase())
    );

    if (!targetWallet) {
      setConnectingWallet(null);
      setError(`${walletName} wallet not detected. Install the extension or app.`);
      return;
    }

    try {
      await targetWallet.connect();
      onWalletConnected?.();
      onClose();
    } catch (e) {
      const msg = (e as Error)?.message ?? "Could not connect wallet.";
      if (!/cancel|reject|closed|user rejected/i.test(msg)) {
        setError(msg);
      }
    } finally {
      setConnectingWallet(null);
    }
  }

  function handleGoogleLogin() {
    window.location.href = googleLoginUrl();
  }

  if (emailOpen) {
    return (
      <EmailAuthModal
        onClose={() => setEmailOpen(false)}
        onSuccess={(res) => {
          setEmailOpen(false);
          onCustodialSession(res);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="cw-modal-backdrop" onClick={onClose}>
      <div
        className="cw-modal"
        role="dialog"
        aria-label="Connect Wallet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cw-modal-header">
          <span className="cw-modal-title">
            CONNECT
          </span>
          <button
            type="button"
            className="cw-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Green Divider Line */}
        <div className="cw-modal-divider" />

        {/* Error notice if extension not found */}
        {error && (
          <div className="cw-modal-error">
            <span>{error}</span>
            <button
              type="button"
              className="cw-error-close"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {/* Connection Options List matching connect-wallet-layout.png */}
        <div className="cw-options-list">
          {/* Option 1: Continue with email */}
          {emailEnabled && (
            <button
              type="button"
              className="cw-option-btn"
              onClick={() => setEmailOpen(true)}
            >
              <span className="cw-email-at" aria-hidden="true">@</span>
              <span className="cw-option-label">Continue with email</span>
            </button>
          )}

          {/* Option 2: Continue with Google */}
          {googleEnabled && (
            <button
              type="button"
              className="cw-option-btn"
              onClick={handleGoogleLogin}
            >
              <span className="cw-google-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22">
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
              </span>
              <span className="cw-option-label">Continue with Google</span>
            </button>
          )}

          {/* Option 3: Lute */}
          <button
            type="button"
            className="cw-option-btn"
            disabled={connectingWallet === "Lute"}
            onClick={() => handleConnect("Lute")}
          >
            <span className="cw-lute-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="16" cy="16" r="3.5" stroke="#9333ea" />
                <path d="M16 12.5a5.5 5.5 0 0 1 4.7 2.7" />
                <path d="M18.8 17.5a5.5 5.5 0 0 1-4.7 2.7" />
                <path d="M13.2 14a5.5 5.5 0 0 1 0-5.5" />
                <circle cx="16" cy="16" r="10.5" stroke="#9333ea" strokeDasharray="14 6" />
              </svg>
            </span>
            <span className="cw-option-label">
              {connectingWallet === "Lute" ? "Connecting Lute…" : "Lute"}
            </span>
          </button>

          {/* Option 4: Pera */}
          <button
            type="button"
            className="cw-option-btn"
            disabled={connectingWallet === "Pera"}
            onClick={() => handleConnect("Pera")}
          >
            <span className="cw-pera-square" aria-hidden="true">
              <svg viewBox="0 0 400 447" width="15" height="15" fill="#000000">
                <path d="M178 290 L172 295 L169 301 L167 311 L167 342 L172 371 L181 400 L194 426 L206 439 L210 441 L215 441 L221 436 L226 421 L226 389 L222 364 L215 339 L201 308 L191 295 L183 290 Z M248 274 L251 283 L261 293 L270 299 L294 311 L317 319 L350 326 L375 327 L387 325 L397 318 L398 314 L396 308 L382 294 L354 279 L325 269 L294 263 L273 262 L257 265 L253 267 Z M122 244 L117 240 L106 240 L99 242 L81 251 L57 269 L37 289 L22 309 L13 328 L13 341 L19 346 L30 346 L39 343 L53 336 L81 315 L102 293 L116 273 L123 256 Z M0 123 L0 128 L3 134 L17 147 L39 159 L64 168 L100 175 L121 175 L136 170 L141 163 L136 151 L120 138 L96 126 L68 117 L46 113 L24 112 L9 115 L5 117 Z M378 95 L367 89 L355 86 L342 86 L331 88 L322 91 L303 101 L282 120 L272 134 L265 148 L260 169 L260 181 L263 193 L269 204 L276 211 L289 218 L299 220 L313 220 L323 218 L348 207 L359 199 L372 186 L386 165 L392 149 L394 138 L394 125 L391 113 L385 102 Z M183 0 L176 7 L172 21 L172 52 L178 83 L187 109 L198 129 L210 141 L219 142 L226 135 L230 120 L230 93 L225 64 L215 34 L205 15 L194 3 L188 0 Z" />
              </svg>
            </span>
            <span className="cw-option-label">
              {connectingWallet === "Pera" ? "Connecting Pera…" : "Pera"}
            </span>
          </button>

          {/* Option 5: Defly */}
          <button
            type="button"
            className="cw-option-btn"
            disabled={connectingWallet === "Defly"}
            onClick={() => handleConnect("Defly")}
          >
            <span className="cw-defly-square" aria-hidden="true">
              <svg viewBox="80 80 287 270" width="15" height="15" fill="#ffffff">
                <path d="M96 313 L223 240 L351 313 L224 98 Z M121 335 L224 301 L326 335 L224 281 Z" />
              </svg>
            </span>
            <span className="cw-option-label">
              {connectingWallet === "Defly" ? "Connecting Defly…" : "Defly"}
            </span>
          </button>
        </div>

        {/* Footer Note matching connect-wallet-layout.png */}
        <p className="cw-modal-foot">
          Connecting prompts a one-time signature to sign in.
        </p>
      </div>
    </div>
  );
}
