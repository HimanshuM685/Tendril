import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GasRequestInfo, GoogleAccountResponse } from "@tendril/shared";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";
import {
  exportGoogleMnemonic,
  fetchGasRequest,
  fetchGoogleAccount,
  submitGasRequest,
} from "../lib/custodialClient";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { Session } from "../App";
import { ExportKeyModal } from "./ExportKeyModal";
import { OnchainAccountPanel } from "./OnchainAccountPanel";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

interface Props {
  session: Session;
  signedIn: boolean;
  balanceAtomic: number | null;
  onSignOut: () => void;
  onAccountRefresh?: () => void;
}

export function GoogleWalletBar({
  session,
  signedIn,
  balanceAtomic,
  onSignOut,
  onAccountRefresh,
}: Props) {
  const navigate = useNavigate();
  const { runCustodialAction } = useCustodialSign();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<GoogleAccountResponse | null>(null);
  const [gasRequest, setGasRequest] = useState<GasRequestInfo | null | undefined>(undefined);
  const [gasBusy, setGasBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [optInBusy, setOptInBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const loadAccount = async () => {
    try {
      setAccount(await fetchGoogleAccount(session.token));
      setGasRequest(await fetchGasRequest(session.token));
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    if (!signedIn) return;
    void loadAccount();
    const t = setInterval(() => void loadAccount(), 8000);
    return () => clearInterval(t);
  }, [signedIn, session.token]);

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

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  async function optInUsdc() {
    setOptInBusy(true);
    setErr(null);
    try {
      await runCustodialAction(session.token, { action: "optin" });
      await loadAccount();
      onAccountRefresh?.();
    } catch (e) {
      if ((e as Error).message !== "cancelled") setErr((e as Error).message);
    } finally {
      setOptInBusy(false);
    }
  }

  async function requestGas() {
    setGasBusy(true);
    setErr(null);
    try {
      setGasRequest(await submitGasRequest(session.token));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setGasBusy(false);
    }
  }

  const hasBalance = signedIn && balanceAtomic !== null;
  const displayName = session.name || session.email || "Google account";

  return (
    <div className="wallet-bar" ref={barRef}>
      <button
        className="addr addr-btn"
        title={session.address}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {short(session.address)} <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="wallet-menu wallet-menu-google" role="menu">
          <div className="wm-user">
            <strong>{displayName}</strong>
            {session.email && session.name && (
              <span className="muted small">{session.email}</span>
            )}
          </div>
          <div className="wm-balance">
            <span className="muted small">Address</span>
            <code className="wm-addr" title={session.address}>
              {short(session.address)}
            </code>
          </div>
          <OnchainAccountPanel
            account={
              account
                ? {
                    algoMicro: account.algoMicro,
                    usdcAtomic: account.usdcAtomic,
                    usdcOptedIn: account.usdcOptedIn,
                    gasGrantEligible: account.gasGrantEligible,
                  }
                : null
            }
            gasRequest={gasRequest}
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
          {err && <p className="modal-err">{err}</p>}
          <button className="wm-item" role="menuitem" onClick={() => go("/dashboard")}>
            Top up
          </button>
          <button className="wm-item" role="menuitem" onClick={() => go("/dashboard#history")}>
            History
          </button>
          <button
            className="wm-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setExportOpen(true);
            }}
          >
            Export recovery phrase
          </button>
          <button className="wm-item wm-danger" role="menuitem" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}

      {exportOpen && (
        <ExportKeyModal
          onClose={() => setExportOpen(false)}
          onExport={() => exportGoogleMnemonic(session.token)}
        />
      )}
    </div>
  );
}
