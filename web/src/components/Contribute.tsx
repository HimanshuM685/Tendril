import { useEffect, useState } from "react";
import type { ComputeNode } from "@tendril/shared";
import { fetchMyNodes } from "../api";

/**
 * On Tendril you contribute by running the agent daemon (it holds your key,
 * proves ownership, and manages sandboxes). This tab shows the command to start
 * it and lists the nodes currently registered under the connected wallet.
 */
export function Contribute({ address }: { address: string | null }) {
  const [nodes, setNodes] = useState<ComputeNode[]>([]);

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

  const cmd = `# 1) set these in .env (copied from .env.example)
AVM_PRIVATE_KEY=<your-key>
PRICE_PER_HOUR_USD=1.0
REGISTRY_URL=http://<backend-host>:4000

# 2) bring up the contributor
docker compose up --build contributor`;

  return (
    <div>
      <p className="muted">
        Share your machine's CPU/RAM/GPU and earn ALGO by the hour, paid out on-chain when a
        renter's lease ends. Renters only ever reach a throwaway Docker SSH sandbox — never your
        files or your host.
      </p>

      <div className="card wide">
        <strong>1. Run the contributor agent (Docker)</strong>
        <pre className="cmd">{cmd}</pre>
        <p className="muted small">
          Generate a key with <code>npm run keygen</code>, fund it on testnet, set the values in{" "}
          <code>.env</code>, then bring up the container. It mounts the host Docker socket and runs
          each rented sandbox as a sibling container — nothing else to install. Your node appears in
          Explore within seconds.
        </p>
      </div>

      <h3>Your nodes</h3>
      {!address && <p className="muted">Connect a wallet to see your nodes.</p>}
      {address && nodes.length === 0 && (
        <p className="muted">No nodes yet — start the agent with this wallet's key.</p>
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
