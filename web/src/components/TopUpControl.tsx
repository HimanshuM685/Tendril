import { useState } from "react";
import { topUp, type TopUpStage } from "../wallet";

type SignTransactions = (
  txnGroup: Uint8Array[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>;

interface Props {
  address: string;
  token: string;
  signTransactions: SignTransactions;
  onChanged: () => void;
  onError: (msg: string) => void;
}

const PRESETS = [0.5, 1, 5];

/** Amount presets + the top-up button, with the on-chain wait spelled out.
 *  Shared by the wallet panel and the dashboard — topping up is the action
 *  people take most, so it lives in both places. */
export function TopUpControl({ address, token, signTransactions, onChanged, onError }: Props) {
  const [amount, setAmount] = useState(1);
  // null = idle. "done" lingers so a fast confirm still shows a result.
  const [stage, setStage] = useState<TopUpStage | "requesting" | "done" | null>(null);
  const amountOk = Number.isFinite(amount) && amount > 0;
  const busy = stage !== null && stage !== "done";

  async function deposit() {
    if (!amountOk || busy) return;
    setStage("requesting");
    try {
      await topUp(token, address, signTransactions, amount, setStage);
      setStage("done");
      onChanged();
      setTimeout(() => setStage((s) => (s === "done" ? null : s)), 4000);
    } catch (e) {
      setStage(null);
      onError((e as Error).message);
    }
  }

  const STAGE_LABEL: Record<string, string> = {
    requesting: "Preparing…",
    signing: "Approve in wallet…",
    confirming: "Confirming on-chain…",
    done: `Topped up ${amount} ALGO ✓`,
  };

  return (
    <>
      <div className="topup">
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`btn ghost${amount === p ? " active" : ""}`}
            onClick={() => setAmount(p)}
          >
            {p} ALGO
          </button>
        ))}
        <input
          type="number"
          min={0}
          step={0.1}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="topup-amount"
          aria-label="Top-up amount in ALGO"
        />
        <button
          className="btn"
          disabled={busy || !amountOk}
          title={amountOk ? "" : "Enter an amount above 0"}
          onClick={deposit}
        >
          {busy ? "Topping up…" : "Top up"}
        </button>
      </div>

      {/* The chain takes seconds to confirm — say what we're waiting on. */}
      {stage && (
        <p className="muted small" role="status" aria-live="polite">
          {STAGE_LABEL[stage]}
        </p>
      )}
    </>
  );
}
