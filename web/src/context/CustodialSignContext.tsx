import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { SignPrepareResponse } from "@tendril/shared";
import {
  confirmCustodial,
  prepareCustodial,
  type CustodialAction,
} from "../lib/custodialClient";
import { SignConfirmModal } from "../components/SignConfirmModal";

interface PendingConfirm {
  prepare: SignPrepareResponse;
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

interface CustodialSignContextValue {
  /** Prepare → show modal → confirm. Returns the confirm endpoint result. */
  runCustodialAction: (token: string, action: CustodialAction) => Promise<unknown>;
  /** Social accounts may sign only after a PIN exists. Wallet users stay enabled. */
  setSigningReady: (ready: boolean) => void;
}

const CustodialSignContext = createContext<CustodialSignContextValue | null>(null);

export function CustodialSignProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [busy, setBusy] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const tokenRef = useRef("");
  const signingReady = useRef(true);
  const setSigningReady = useCallback((ready: boolean) => {
    signingReady.current = ready;
  }, []);

  const runCustodialAction = useCallback((token: string, action: CustodialAction) => {
    tokenRef.current = token;
    return new Promise<unknown>(async (resolve, reject) => {
      if (!signingReady.current) {
        reject(new Error("pin_not_set"));
        return;
      }
      try {
        const prepare = await prepareCustodial(token, action);
        setPinError(null);
        setPending({ prepare, resolve, reject });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }, []);

  async function approve(pin: string) {
    if (!pending) return;
    setBusy(true);
    setPinError(null);
    try {
      const result = await confirmCustodial(tokenRef.current, pending.prepare.requestId, pin);
      pending.resolve(result);
      setPending(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/invalid pin|too many pin attempts/i.test(message)) {
        setPinError(message);
        return;
      }
      pending.reject(e instanceof Error ? e : new Error(message));
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    pending?.reject(new Error("cancelled"));
    setPending(null);
  }

  return (
    <CustodialSignContext.Provider value={{ runCustodialAction, setSigningReady }}>
      {children}
      {pending && (
        <SignConfirmModal
          summary={pending.prepare.summary}
          details={pending.prepare.details}
          busy={busy}
          error={pinError}
          onApprove={(pin) => void approve(pin)}
          onCancel={cancel}
        />
      )}
    </CustodialSignContext.Provider>
  );
}

export function useCustodialSign(): CustodialSignContextValue {
  const ctx = useContext(CustodialSignContext);
  if (!ctx) throw new Error("useCustodialSign outside provider");
  return ctx;
}
