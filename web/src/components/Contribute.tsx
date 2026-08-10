import { useEffect, useState } from "react";
import type { ApiKeyInfo, ComputeNode, CreateApiKeyResponse, WalletSummary } from "@tendril/shared";
import { formatUsdc } from "@tendril/shared";
import {
  createApiKey,
  fetchApiKeys,
  fetchMyNodes,
  fetchPlatform,
  revokeApiKey,
  withdrawEarnings,
} from "../api";
import { writeClipboard } from "../clipboard";
import { useCustodialSign } from "../context/CustodialSignContext";
import type { PayStage, SignTransactions } from "../lib/x402Client";
import type { Session } from "../App";
import { isCustodialSession } from "../lib/session";

interface Props {
  address: string | null;
  session: Session | null;
  wallet: WalletSummary | null;
  signTransactions: SignTransactions;
  onWalletChanged: () => void;
  onError: (e: string | null) => void;
}

/**
 * On Tendril you contribute by running the agent daemon, which manages the
 * sandboxes renters get. It authenticates with an API key minted here, so the
 * machine you share never holds a private key: the wallet that minted the key
 * owns the node and is where its earnings land.
 */
export function Contribute({
  address,
  session,
  wallet,
  signTransactions,
  onWalletChanged,
  onError,
}: Props) {
  const { runCustodialAction } = useCustodialSign();
  const [nodes, setNodes] = useState<ComputeNode[]>([]);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  /** The plaintext of a key just minted. The server never returns it again. */
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [mintStage, setMintStage] = useState<PayStage | "confirming" | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(5_000_000);
  const [mintKeyFee, setMintKeyFee] = useState(100_000);
  const [copied, setCopied] = useState<string | null>(null);

  const isCustodial = isCustodialSession(session);

  useEffect(() => {
    if (!address) {
      setNodes([]);
      return;
    }
    let alive = true;
    const load = () =>
      fetchMyNodes(address)
        .then((n) => alive && setNodes(n))
        .catch(() => {});
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [address]);

  useEffect(() => {
    if (!session) {
      setKeys([]);
      setNewSecret(null);
      return;
    }
    fetchApiKeys(session.token)
      .then(setKeys)
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    fetchPlatform()
      .then((p) => {
        setMinWithdraw(p.minWithdrawAtomic);
        setMintKeyFee(p.flatMintKeyAtomic);
      })
      .catch(() => {});
  }, []);

  async function mint() {
    if (!session || !address) return;
    setMinting(true);
    setMintStage(null);
    onError(null);
    try {
      let created: CreateApiKeyResponse;
      if (isCustodial) {
        setMintStage("confirming");
        created = (await runCustodialAction(session.token, {
          action: "mintkey",
          label: "",
        })) as CreateApiKeyResponse;
      } else {
        created = await createApiKey(session.token, address, signTransactions, "", setMintStage);
      }
      setKeys((k) => [created.key, ...k]);
      setNewSecret(created.secret);
    } catch (err) {
      if ((err as Error).message !== "cancelled") onError((err as Error).message);
    } finally {
      setMinting(false);
      setMintStage(null);
    }
  }

  async function revoke(id: number) {
    if (!session) return;
    try {
      await revokeApiKey(session.token, id);
      setKeys((k) => k.filter((x) => x.id !== id));
    } catch (err) {
      onError((err as Error).message);
    }
  }

  async function withdraw() {
    if (!session) return;
    setWithdrawing(true);
    onError(null);
    try {
      const { amountAtomic } = await withdrawEarnings(session.token);
      onWalletChanged();
      onError(`Withdrew ${formatUsdc(amountAtomic)} USDC to your wallet.`);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setWithdrawing(false);
    }
  }

  const earnings = wallet?.earningsAtomic ?? 0;
  const canWithdraw = !!session && earnings >= minWithdraw;

  const mintStageLabel: Record<string, string> = {
    signing: "Approve in wallet…",
    settling: "Settling on-chain…",
    confirming: "Confirm in dialog…",
  };

  // The key is the only secret in a contributor's setup — the rest is what the
  // machine is worth per hour and what to call it.
  const envCmd = `# .env — everything a contributor configures
TENDRIL_API_KEY=${newSecret ?? "<paste your key>"}
NODE_LABEL=my-machine
PRICE_PER_HOUR_USD=1.0`;
  const runCmd = `# bring up the contributor
docker compose up --build contributor`;

  function copy(id: string, text: string) {
    void writeClipboard(text).then((ok) => {
      if (!ok) return; // don't claim "COPIED" if the copy actually failed
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    });
  }

  return (
    <div>
      <p className="muted">
        Share your machine's CPU/RAM/GPU and earn USDC by the hour. Earnings build up as a balance
        you withdraw to your wallet whenever you like. Renters only ever reach a throwaway Docker
        SSH sandbox — never your files or your host.
      </p>

      <div className="card wide">
        <strong>1. Get an API key</strong>
        {!session && (
          <p className="muted small">Sign in (wallet or Google) to mint a key.</p>
        )}
        {session && (
          <>
            <p className="muted small">
              Minting costs <strong>{formatUsdc(mintKeyFee)}</strong> on-chain via x402. The key
              identifies your node and links it to <code>{session.address.slice(0, 8)}…</code> — the
              wallet earnings are paid to. Keep it secret; anyone holding it can register a node as
              you.
            </p>
            <button className="btn" type="button" onClick={() => void mint()} disabled={minting}>
              {minting
                ? mintStage
                  ? mintStageLabel[mintStage]
                  : "MINTING…"
                : `MINT API KEY (${formatUsdc(mintKeyFee)})`}
            </button>

            {newSecret && (
              <div className="codeblock">
                <div className="codeblock-bar">
                  <span className="codeblock-title">YOUR KEY — SHOWN ONCE</span>
                  <button
                    className={`codeblock-copy${copied === "key" ? " done" : ""}`}
                    type="button"
                    onClick={() => copy("key", newSecret)}
                  >
                    {copied === "key" ? "COPIED" : "COPY"}
                  </button>
                </div>
                <pre className="codeblock-body">{newSecret}</pre>
              </div>
            )}

            {keys.length > 0 && (
              <ul className="specs">
                {keys.map((k) => (
                  <li key={k.id}>
                    <code>{k.preview}</code>{" "}
                    <span className="muted small">
                      {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleString()}` : "never used"}
                    </span>{" "}
                    <button className="btn small" type="button" onClick={() => void revoke(k.id)}>
                      REVOKE
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <strong>2. Set your environment (.env)</strong>
        <div className="codeblock">
          <div className="codeblock-bar">
            <span className="codeblock-title">.ENV</span>
            <button
              className={`codeblock-copy${copied === "env" ? " done" : ""}`}
              type="button"
              onClick={() => copy("env", envCmd)}
            >
              {copied === "env" ? "COPIED" : "COPY"}
            </button>
          </div>
          <pre className="codeblock-body">{envCmd}</pre>
        </div>

        <strong>3. Bring up the contributor (Docker)</strong>
        <div className="codeblock">
          <div className="codeblock-bar">
            <span className="codeblock-title">SHELL</span>
            <button
              className={`codeblock-copy${copied === "run" ? " done" : ""}`}
              type="button"
              onClick={() => copy("run", runCmd)}
            >
              {copied === "run" ? "COPIED" : "COPY"}
            </button>
          </div>
          <pre className="codeblock-body">{runCmd}</pre>
        </div>

        <p className="muted small">
          No wallet key, payout address or registry URL to configure — the API key carries all
          three. The container mounts the host Docker socket and runs each rented sandbox as a
          sibling container, so there is nothing else to install. Your node appears in Explore
          within seconds.
        </p>
      </div>

      <h3>Earnings</h3>
      <div className="card wide">
        <div className="card-head">
          <strong>{formatUsdc(earnings)} USDC</strong>
          <button
            className="btn"
            type="button"
            onClick={() => void withdraw()}
            disabled={!canWithdraw || withdrawing}
          >
            {withdrawing ? "WITHDRAWING…" : "WITHDRAW"}
          </button>
        </div>
        <p className="muted small">
          {!session
            ? "Sign in to see and withdraw your earnings."
            : canWithdraw
              ? "Sends your whole balance to your wallet in one transfer. You must be opted into USDC."
              : `Earned per lease, after the platform fee. Withdraw once you have ${formatUsdc(minWithdraw)} USDC — a floor that keeps transfer fees from eating small amounts.`}
        </p>
      </div>

      <h3>Your nodes</h3>
      {!address && <p className="muted">Connect a wallet to see your nodes.</p>}
      {address && nodes.length === 0 && (
        <p className="muted">No nodes yet — start the agent with an API key from this wallet.</p>
      )}
      <div className="grid">
        {nodes.map((n) => (
          <div className="card" key={n.id}>
            <div className="card-head">
              <strong>{n.label}</strong>
              <span className={`badge ${n.status}`}>{n.status}</span>
            </div>
            <ul className="specs">
              <li>{n.cpuCores} vCPU</li>
              <li>{(n.ramMb / 1024).toFixed(1)} GB RAM</li>
              <li>{n.gpu ?? "no GPU"}</li>
            </ul>
            <div className="price">${n.pricePerHourUsd}/hr</div>
          </div>
        ))}
      </div>
    </div>
  );
}
