import { useState } from "react";
import { network } from "../lib/network";

type FlowMode = "all" | "lease" | "run" | "settlement";

export function ArchDiagram() {
  const [activeFlow, setActiveFlow] = useState<FlowMode>("all");

  const isDimmed = (flow: FlowMode) => {
    if (activeFlow === "all") return false;
    return activeFlow !== flow;
  };

  const isHighlighted = (flow: FlowMode) => {
    return activeFlow === flow;
  };

  return (
    <div className="arch-component-wrapper">
      {/* Interactive Flow Switcher */}
      <div className="arch-flow-toolbar">
        <span className="arch-toolbar-label">Highlight Flow:</span>
        <div className="arch-flow-buttons">
          <button
            type="button"
            className={`arch-flow-btn ${activeFlow === "all" ? "active" : ""}`}
            onClick={() => setActiveFlow("all")}
          >
            All Flows
          </button>
          <button
            type="button"
            className={`arch-flow-btn ${activeFlow === "lease" ? "active" : ""}`}
            onClick={() => setActiveFlow("lease")}
          >
            1. Metered SSH Lease
          </button>
          <button
            type="button"
            className={`arch-flow-btn ${activeFlow === "run" ? "active" : ""}`}
            onClick={() => setActiveFlow("run")}
          >
            2. One-Shot Run (/x402/run)
          </button>
          <button
            type="button"
            className={`arch-flow-btn ${activeFlow === "settlement" ? "active" : ""}`}
            onClick={() => setActiveFlow("settlement")}
          >
            3. USDC Settlement
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="arch-svg-container">
        <svg
          viewBox="0 0 960 620"
          className="arch-svg"
          role="img"
          aria-label="Tendril Decentralized Compute Architecture"
        >
          <defs>
            {/* Arrowhead Markers */}
            <marker
              id="arch-arrow-default"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M1,1 L7,4 L1,7 Z" fill="#6e7067" />
            </marker>
            <marker
              id="arch-arrow-green"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M1,1 L7,4 L1,7 Z" fill="#0B5D3A" />
            </marker>
            <marker
              id="arch-arrow-lime"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M1,1 L7,4 L1,7 Z" fill="#7cb305" />
            </marker>

            {/* Subtle Node Dropshadow */}
            <filter id="node-shadow" x="-5%" y="-5%" width="115%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#14180f" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* ================= FLOW LINES ================= */}

          {/* 1. SSH Direct Tunnel: Consumer ↔ Sandbox (Lease Flow) */}
          <g
            className={`arch-flow-group ${isDimmed("lease") ? "dimmed" : ""} ${isHighlighted("lease") ? "highlighted" : ""
              }`}
          >
            <path
              d="M 280 90 L 680 90"
              fill="none"
              stroke={isHighlighted("lease") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("lease") ? "2.5" : "1.8"}
              strokeDasharray={isHighlighted("lease") ? "6,4" : "none"}
              markerEnd={isHighlighted("lease") ? "url(#arch-arrow-green)" : "url(#arch-arrow-default)"}
            />
            <rect x="420" y="74" width="130" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="485" y="89" textAnchor="middle" className="arch-flow-tag">
              SSH · BORE TUNNEL
            </text>
          </g>

          {/* 2. Consumer → Registry: Sign In / Top Up / Rent / Run */}
          <g
            className={`arch-flow-group ${isDimmed(activeFlow === "run" ? "run" : "lease") ? "dimmed" : ""
              } ${isHighlighted("lease") || isHighlighted("run") ? "highlighted" : ""}`}
          >
            <path
              d="M 160 145 L 160 250"
              fill="none"
              stroke={isHighlighted("lease") || isHighlighted("run") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("lease") || isHighlighted("run") ? "2.5" : "1.8"}
              markerEnd={
                isHighlighted("lease") || isHighlighted("run")
                  ? "url(#arch-arrow-green)"
                  : "url(#arch-arrow-default)"
              }
            />
            <rect x="75" y="180" width="170" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="160" y="195" textAnchor="middle" className="arch-flow-tag">
              x402 AUTH · REST API
            </text>
          </g>

          {/* 3. Registry ↔ Contributor Daemon: WebSocket */}
          <g
            className={`arch-flow-group ${isDimmed(activeFlow === "run" ? "run" : "lease") ? "dimmed" : ""
              } ${isHighlighted("lease") || isHighlighted("run") ? "highlighted" : ""}`}
          >
            <path
              d="M 330 315 L 680 315"
              fill="none"
              stroke={isHighlighted("lease") || isHighlighted("run") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("lease") || isHighlighted("run") ? "2.5" : "1.8"}
              strokeDasharray="4,4"
              markerEnd={
                isHighlighted("lease") || isHighlighted("run")
                  ? "url(#arch-arrow-green)"
                  : "url(#arch-arrow-default)"
              }
            />
            <rect x="440" y="295" width="140" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="510" y="310" textAnchor="middle" className="arch-flow-tag">
              WEBSOCKET DISPATCH
            </text>
            <text x="510" y="332" textAnchor="middle" className="arch-flow-subtag">
              Heartbeat &amp; Lease Event
            </text>
          </g>

          {/* 4. Contributor Daemon → Sandbox: Docker Run / Destroy */}
          <g
            className={`arch-flow-group ${isDimmed(activeFlow === "run" ? "run" : "lease") ? "dimmed" : ""
              } ${isHighlighted("lease") || isHighlighted("run") ? "highlighted" : ""}`}
          >
            <path
              d="M 800 250 L 800 145"
              fill="none"
              stroke={isHighlighted("lease") || isHighlighted("run") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("lease") || isHighlighted("run") ? "2.5" : "1.8"}
              markerEnd={
                isHighlighted("lease") || isHighlighted("run")
                  ? "url(#arch-arrow-green)"
                  : "url(#arch-arrow-default)"
              }
            />
            <rect x="715" y="180" width="170" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="800" y="195" textAnchor="middle" className="arch-flow-tag">
              SPAWN HARDENED CONTAINER
            </text>
          </g>

          {/* 5. Registry ↔ Neon: Off-chain Balance Ledger */}
          <g
            className={`arch-flow-group ${isDimmed("settlement") ? "dimmed" : ""} ${isHighlighted("settlement") ? "highlighted" : ""
              }`}
          >
            <path
              d="M 160 380 L 160 480"
              fill="none"
              stroke={isHighlighted("settlement") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("settlement") ? "2.5" : "1.8"}
              markerEnd={isHighlighted("settlement") ? "url(#arch-arrow-green)" : "url(#arch-arrow-default)"}
            />
            <rect x="75" y="415" width="170" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="160" y="430" textAnchor="middle" className="arch-flow-tag">
              PER-SECOND LEDGER
            </text>
          </g>

          {/* 6. Registry ↔ Algorand: x402 Settle & Payouts */}
          <g
            className={`arch-flow-group ${isDimmed("settlement") ? "dimmed" : ""} ${isHighlighted("settlement") ? "highlighted" : ""
              }`}
          >
            <path
              d="M 280 380 L 410 480"
              fill="none"
              stroke={isHighlighted("settlement") ? "#0B5D3A" : "#8c9085"}
              strokeWidth={isHighlighted("settlement") ? "2.5" : "1.8"}
              markerEnd={isHighlighted("settlement") ? "url(#arch-arrow-green)" : "url(#arch-arrow-default)"}
            />
            <rect x="290" y="415" width="150" height="22" rx="4" fill="#ffffff" stroke="#e6e7df" />
            <text x="365" y="430" textAnchor="middle" className="arch-flow-tag">
              USDC ON-CHAIN FINALITY
            </text>
          </g>

          {/* ================= NODE CARDS ================= */}

          {/* Node 1: Consumer / Agent */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="40" y="35" width="240" height="110" rx="10" className="arch-node-bg" />
            <rect x="40" y="35" width="240" height="110" rx="10" className="arch-node-border" />
            {/* Header pill */}
            <rect x="54" y="48" width="105" height="18" rx="4" fill="rgba(11, 93, 58, 0.08)" />
            <text x="60" y="61" className="arch-node-badge">CLIENT TIER</text>
            <text x="54" y="90" className="arch-node-title">Consumer / Agent</text>
            <text x="54" y="110" className="arch-node-sub">Web UI · Python SDK · MCP Agent</text>
            <text x="54" y="126" className="arch-node-desc">Funds USDC &amp; manages leases</text>
          </g>

          {/* Node 2: Ephemeral Docker Sandbox */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="680" y="35" width="240" height="110" rx="10" className="arch-node-bg" />
            <rect x="680" y="35" width="240" height="110" rx="10" className="arch-node-border" />
            <rect x="694" y="48" width="115" height="18" rx="4" fill="rgba(124, 179, 5, 0.12)" />
            <text x="700" y="61" className="arch-node-badge-lime">EXECUTION TIER</text>
            <text x="694" y="90" className="arch-node-title">Docker Sandbox</text>
            <text x="694" y="110" className="arch-node-sub">Ubuntu / Debian · Bore Relay</text>
            <text x="694" y="126" className="arch-node-desc">Destroyed on lease closure</text>
          </g>

          {/* Node 3: Tendril Registry & API */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="40" y="250" width="290" height="130" rx="10" className="arch-node-bg" />
            <rect x="40" y="250" width="290" height="130" rx="10" className="arch-node-border" />
            <rect x="54" y="264" width="115" height="18" rx="4" fill="rgba(11, 93, 58, 0.08)" />
            <text x="60" y="277" className="arch-node-badge">CONTROL PLANE</text>
            <text x="54" y="306" className="arch-node-title">Tendril Registry</text>
            <text x="54" y="328" className="arch-node-sub">Express · Socket.io · Watchdog</text>
            <text x="54" y="348" className="arch-node-desc">Meters usage down to the second</text>
            <text x="54" y="364" className="arch-node-desc">Verifies x402 payment headers</text>
          </g>

          {/* Node 4: Contributor Host Daemon */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="680" y="250" width="240" height="130" rx="10" className="arch-node-bg" />
            <rect x="680" y="250" width="240" height="130" rx="10" className="arch-node-border" />
            <rect x="694" y="264" width="125" height="18" rx="4" fill="rgba(124, 179, 5, 0.12)" />
            <text x="700" y="277" className="arch-node-badge-lime">PROVIDER NODE</text>
            <text x="694" y="306" className="arch-node-title">Contributor PC</text>
            <text x="694" y="328" className="arch-node-sub">Daemon · Docker Engine · Bore</text>
            <text x="694" y="348" className="arch-node-desc">Outbound-only connection</text>
            <text x="694" y="364" className="arch-node-desc">No wallet keys on machine</text>
          </g>

          {/* Node 5: Neon Postgres */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="40" y="480" width="240" height="105" rx="10" className="arch-node-bg" />
            <rect x="40" y="480" width="240" height="105" rx="10" className="arch-node-border" />
            <rect x="54" y="494" width="95" height="18" rx="4" fill="#f0f1ec" />
            <text x="60" y="507" className="arch-node-badge-muted">LEDGER DB</text>
            <text x="54" y="534" className="arch-node-title">Neon Postgres</text>
            <text x="54" y="554" className="arch-node-sub">Off-chain Balances &amp; History</text>
            <text x="54" y="570" className="arch-node-desc">Atomic charge reconciliation</text>
          </g>

          {/* Node 6: Algorand Network */}
          <g className="arch-node-group" filter="url(#node-shadow)">
            <rect x="330" y="480" width="250" height="105" rx="10" className="arch-node-bg" />
            <rect x="330" y="480" width="250" height="105" rx="10" className="arch-node-border" />
            <rect x="344" y="494" width="125" height="18" rx="4" fill="rgba(11, 93, 58, 0.08)" />
            <text x="350" y="507" className="arch-node-badge">SETTLEMENT LAYER</text>
            <text x="344" y="534" className="arch-node-title">Algorand ({network.network})</text>
            <text x="344" y="554" className="arch-node-sub">USDC ASA · 2.8s Finality</text>
            <text x="344" y="570" className="arch-node-desc">Gas sponsored by facilitator</text>
          </g>
        </svg>
      </div>

      <div className="arch-caption-bar">
        <span className="acb-tag">ARCHITECTURE FLOW</span>
        <span className="acb-desc">
          The registry balances micro-metered runtime off-chain in Neon, settles USDC on Algorand with zero network gas for consumers, and orchestrates disposable Docker sandboxes over secure bore tunnels.
        </span>
      </div>
    </div>
  );
}