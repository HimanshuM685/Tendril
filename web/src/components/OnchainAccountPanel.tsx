import type { GasRequestInfo } from "@tendril/shared";
import { formatUsdc, formatUsdcExact } from "@tendril/shared";
import { explorerTxUrl } from "../api";

const MIN_ALGO_MICRO = 100_000;

function formatAlgo(micro: number): string {
  return `${(micro / 1_000_000).toFixed(4)} ALGO`;
}

export interface OnchainPanelState {
  algoMicro: number;
  usdcAtomic: number;
  usdcOptedIn: boolean;
  gasGrantEligible: boolean;
}

interface Props {
  account: OnchainPanelState | null;
  gasRequest: GasRequestInfo | null | undefined;
  gasBusy: boolean;
  optInBusy: boolean;
  onOptIn: () => void;
  onRequestGas: () => void;
  grantAlgoLabel?: string;
}

export function OnchainAccountPanel({
  account,
  gasRequest,
  gasBusy,
  optInBusy,
  onOptIn,
  onRequestGas,
  grantAlgoLabel = "0.26 ALGO",
}: Props) {
  if (!account) return null;

  const needsAlgo = account.algoMicro < MIN_ALGO_MICRO;
  const canRequestGas =
    account.gasGrantEligible && account.algoMicro === 0 && gasRequest === null;
  const grantAlgo = gasRequest?.amountMicro
    ? formatAlgo(gasRequest.amountMicro)
    : grantAlgoLabel;

  return (
    <>
      <div className="wm-balance">
        <span className="muted small">On-chain ALGO</span>
        <strong>{formatAlgo(account.algoMicro)}</strong>
      </div>
      {account.usdcOptedIn ? (
        <div className="wm-balance">
          <span className="muted small">On-chain USDC</span>
          <strong title={formatUsdcExact(account.usdcAtomic)}>
            {formatUsdc(account.usdcAtomic)}
          </strong>
        </div>
      ) : (
        <div className="wm-warn">
          <p className="muted small">USDC not opted in — required for top-ups.</p>
          <button
            className="btn"
            type="button"
            disabled={optInBusy || needsAlgo}
            onClick={onOptIn}
          >
            {optInBusy ? "Opting in…" : "Opt in to USDC"}
          </button>
        </div>
      )}
      {needsAlgo && (canRequestGas || gasRequest != null) && (
        <div className="wm-warn">
          {canRequestGas ? (
            <>
              <p className="muted small">
                Need ALGO for fees? Request a one-time {grantAlgo} grant.
              </p>
              <button className="btn" type="button" disabled={gasBusy} onClick={onRequestGas}>
                {gasBusy ? "Submitting…" : `Request gas (${grantAlgo})`}
              </button>
            </>
          ) : gasRequest?.status === "pending" ? (
            <p className="muted small">Gas request pending admin review.</p>
          ) : gasRequest?.status === "accepted" ? (
            <p className="muted small">
              Gas grant sent
              {gasRequest.txid && (
                <>
                  {" "}
                  (
                  <a
                    className="ext-link"
                    href={explorerTxUrl(gasRequest.txid)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    tx
                  </a>
                  )
                </>
              )}
              .
            </p>
          ) : gasRequest?.status === "rejected" ? (
            <p className="muted small">
              Gas request was declined.
              {gasRequest.reviewNote ? ` ${gasRequest.reviewNote}` : ""}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
