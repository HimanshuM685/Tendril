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
}

const CustodialSignContext = createContext<CustodialSignContextValue | null>(null);

export function CustodialSignProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [busy, setBusy] = useState(false);
  const tokenRef = useRef("");

  const runCustodialAction = useCallback((token: string, action: CustodialAction) => {
    tokenRef.current = token;
    return new Promise<unknown>(async (resolve, reject) => {
      try {
        const prepare = await prepareCustodial(token, action);
        setPending({ prepare, resolve, reject });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }, []);

  async function approve() {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await confirmCustodial(tokenRef.current, pending.prepare.requestId);
      pending.resolve(result);
    } catch (e) {
      pending.reject(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  function cancel() {
    pending?.reject(new Error("cancelled"));
    setPending(null);
  }

  return (
    <CustodialSignContext.Provider value={{ runCustodialAction }}>
      {children}
      {pending && (
        <SignConfirmModal
          summary={pending.prepare.summary}
          details={pending.prepare.details}
          busy={busy}
          onApprove={approve}
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
