import { useEffect, useId, useRef, useState } from "react";

type FlowMode = "all" | "lease" | "run" | "settlement";
type NodeId = "consumer" | "registry" | "contributor" | "sandbox" | "ledger" | "algorand";
type EdgeId = "ssh" | "request" | "dispatch" | "spawn" | "meter" | "settle";
type Position = { x: number; y: number; width: number; height: number };
type Connection = { path: string; x: number; y: number; width: number; rotation?: number };

const nodes: { id: NodeId; badge: string; title: string; lines: string[] }[] = [
  { id: "consumer", badge: "Client tier", title: "Consumer / Agent", lines: ["Web UI · scripts · MCP tools", "Funds USDC & manages leases"] },
  { id: "registry", badge: "Control plane", title: "Tendril Registry", lines: ["REST API · WebSocket · Watchdog", "Tracks runtime & verifies payments"] },
  { id: "contributor", badge: "Provider node", title: "Contributor PC", lines: ["Daemon · Docker Engine · Bore", "Outbound-only; no wallet keys"] },
  { id: "sandbox", badge: "Execution plane", title: "Docker Sandbox", lines: ["Disposable Linux · SSH server", "Destroyed when the lease closes"] },
  { id: "ledger", badge: "Ledger database", title: "Neon Postgres", lines: ["Off-chain balances & history", "Atomic charge reconciliation"] },
  { id: "algorand", badge: "Settlement layer", title: "Algorand", lines: ["USDC asset transfers · Finality", "Payment fees sponsored"] },
];

// Both layouts use these six connections, so compact mode preserves topology.
const edges: { id: EdgeId; from: NodeId; to: NodeId; label: string; flows: FlowMode[] }[] = [
  { id: "ssh", from: "consumer", to: "sandbox", label: "SSH · bore tunnel", flows: ["lease"] },
  { id: "request", from: "consumer", to: "registry", label: "x402 auth · REST API", flows: ["lease", "run"] },
  { id: "dispatch", from: "registry", to: "contributor", label: "WebSocket dispatch", flows: ["lease", "run"] },
  { id: "spawn", from: "contributor", to: "sandbox", label: "Spawn / destroy container", flows: ["lease", "run"] },
  { id: "meter", from: "registry", to: "ledger", label: "Per-second ledger", flows: ["settlement"] },
  { id: "settle", from: "registry", to: "algorand", label: "USDC settlement", flows: ["settlement"] },
];

const wideNodes: Record<NodeId, Position> = {
  consumer: { x: 24, y: 24, width: 272, height: 128 },
  registry: { x: 24, y: 272, width: 296, height: 144 },
  contributor: { x: 664, y: 272, width: 272, height: 144 },
  sandbox: { x: 664, y: 24, width: 272, height: 128 },
  ledger: { x: 24, y: 528, width: 272, height: 128 },
  algorand: { x: 376, y: 528, width: 272, height: 128 },
};
const compactNodes: Record<NodeId, Position> = {
  consumer: { x: 32, y: 16, width: 288, height: 128 },
  registry: { x: 32, y: 232, width: 288, height: 144 },
  contributor: { x: 32, y: 464, width: 288, height: 144 },
  sandbox: { x: 32, y: 696, width: 288, height: 128 },
  ledger: { x: 32, y: 944, width: 288, height: 128 },
  algorand: { x: 32, y: 1192, width: 288, height: 128 },
};
const wideEdges: Record<EdgeId, Connection> = {
  ssh: { path: "M296 88H664", x: 480, y: 88, width: 164 },
  request: { path: "M160 152V272", x: 160, y: 211, width: 204 },
  dispatch: { path: "M320 344H664", x: 492, y: 344, width: 204 },
  spawn: { path: "M800 272V152", x: 800, y: 211, width: 224 },
  meter: { path: "M160 416V528", x: 160, y: 473, width: 188 },
  settle: { path: "M280 416L512 528", x: 418, y: 473, width: 176 },
};
const compactEdges: Record<EdgeId, Connection> = {
  ssh: { path: "M320 80H342V760H320", x: 338, y: 420, width: 166, rotation: 90 },
  request: { path: "M176 144V232", x: 176, y: 188, width: 216 },
  dispatch: { path: "M176 376V464", x: 176, y: 420, width: 216 },
  spawn: { path: "M176 608V696", x: 176, y: 652, width: 256 },
  meter: { path: "M32 304H18V1008H32", x: 18, y: 654, width: 188, rotation: -90 },
  settle: { path: "M32 342H5V1360H176V1320", x: 176, y: 1360, width: 184 },
};

export function ArchDiagram() {
  const [activeFlow, setActiveFlow] = useState<FlowMode>("all");
  const [compact, setCompact] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setCompact(element.clientWidth < 720);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const positions = compact ? compactNodes : wideNodes;
  const connections = compact ? compactEdges : wideEdges;
  return (
    <figure className="arch-component-wrapper" ref={container}>
      <div className="arch-flow-toolbar">
        <span className="arch-toolbar-label">Highlight flow</span>
        <div className="arch-flow-buttons" role="group" aria-label="Architecture flow">
          {([{ mode: "all", label: "All flows" }, { mode: "lease", label: "Metered SSH lease" }, { mode: "run", label: "One-shot run" }, { mode: "settlement", label: "USDC settlement" }] as const).map((flow) => (
            <button type="button" key={flow.mode} aria-pressed={activeFlow === flow.mode} className={`arch-flow-btn${activeFlow === flow.mode ? " active" : ""}`} onClick={() => setActiveFlow(flow.mode)}>{flow.label}</button>
          ))}
        </div>
      </div>
      <svg className={`arch-svg${compact ? " arch-svg-compact" : ""}`} viewBox={compact ? "0 0 352 1384" : "0 0 960 680"} role="img" aria-labelledby={`${id}-title ${id}-description`} data-layout={compact ? "compact" : "wide"}>
        <title id={`${id}-title`}>Tendril compute architecture</title>
        <desc id={`${id}-description`}>A consumer requests work from the registry. The registry dispatches to a contributor, which creates a Docker sandbox. The consumer connects to the sandbox over SSH through bore. The registry reconciles balances in Neon Postgres and settles USDC on Algorand.</desc>
        <defs>
          <marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M1 1 7 4 1 7" fill="none" stroke="context-stroke" strokeWidth="1.5" /></marker>
        </defs>
        {edges.map((edge) => {
          const position = connections[edge.id];
          const dimmed = activeFlow !== "all" && !edge.flows.includes(activeFlow);
          return (
            <g key={edge.id} className={`arch-flow-group${dimmed ? " dimmed" : ""}`} data-edge={edge.id} data-from={edge.from} data-to={edge.to}>
              <path d={position.path} fill="none" stroke={edge.flows.includes("settlement") ? "#5e8810" : "#0B5D3A"} strokeWidth="2" strokeDasharray={edge.id === "dispatch" ? "5 4" : undefined} markerEnd={`url(#${id}-arrow)`} />
              <g transform={`translate(${position.x} ${position.y}) rotate(${position.rotation ?? 0})`}>
                <rect x={-position.width / 2} y="-14" width={position.width} height="28" rx="4" fill="#ffffff" stroke="#e6e7df" />
                <text textAnchor="middle" dominantBaseline="central" className="arch-flow-label">{edge.label}</text>
              </g>
            </g>
          );
        })}
        {nodes.map((node) => {
          const position = positions[node.id];
          return (
            <g key={node.id} transform={`translate(${position.x} ${position.y})`} className="arch-node" data-node={node.id}>
              <rect width={position.width} height={position.height} rx="10" fill="#ffffff" stroke="#e6e7df" strokeWidth="1.5" />
              <text x="16" y="26" className="arch-node-badge">{node.badge}</text>
              <text x="16" y="56" className="arch-node-title">{node.title}</text>
              {node.lines.map((line, index) => <text x="16" y={82 + index * 22} className="arch-node-desc" key={line}>{line}</text>)}
            </g>
          );
        })}
      </svg>
      <figcaption className="arch-caption-bar">The registry meters runtime off-chain in Neon, settles USDC on Algorand, and orchestrates disposable Docker sandboxes through contributor daemons. SSH reaches sandboxes through bore relay tunnels.</figcaption>
    </figure>
  );
}
