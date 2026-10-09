import { useState, type KeyboardEvent } from "react";
import { REGISTRY_URL } from "../api";
import { docsUrl } from "../lib/docsLinks";

interface Props {
  onClose: () => void;
}

type ClientId = "claude-desktop" | "cursor" | "claude-code" | "vscode";

const CLIENTS: { id: ClientId; label: string }[] = [
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "cursor", label: "Cursor" },
  { id: "claude-code", label: "Claude Code" },
  { id: "vscode", label: "VS Code" },
];

function mcpServersJson(registry: string): string {
  return `{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "${registry}",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}`;
}

function configs(registry: string): Record<ClientId, { file: string; title: string; body: string }> {
  const shared = mcpServersJson(registry);
  return {
    "claude-desktop": {
      title: "claude_desktop_config.json",
      file: "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json\nWindows: %APPDATA%\\Claude\\claude_desktop_config.json",
      body: shared,
    },
    cursor: {
      title: "mcp.json",
      file: "Global: ~/.cursor/mcp.json\nProject: .cursor/mcp.json",
      body: shared,
    },
    "claude-code": {
      title: "claude mcp add",
      file: "User scope: run the command below\nProject: put the same mcpServers JSON in .mcp.json",
      body: `claude mcp add --transport stdio tendril \\
  --env REGISTRY_URL=${registry} \\
  --env AVM_PRIVATE_KEY=<base64 64-byte secret> \\
  -- npx -y @tendril/mcp-server`,
    },
    vscode: {
      title: ".vscode/mcp.json",
      file: "Workspace: .vscode/mcp.json\nUser: mcp.json (VS Code uses \"servers\")",
      body: `{
  "servers": {
    "tendril": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "${registry}",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}`,
    },
  };
}

export function McpModal({ onClose }: Props) {
  const [client, setClient] = useState<ClientId>("claude-desktop");
  const [copied, setCopied] = useState(false);
  const block = configs(REGISTRY_URL)[client];

  function copy() {
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(block.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => setCopied(false));
  }

  function selectClient(id: ClientId) {
    setClient(id);
    setCopied(false);
  }

  function onTabsKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = CLIENTS.findIndex((item) => item.id === client);
    const nextIndex = e.key === "ArrowRight" ? (index + 1) % CLIENTS.length
      : e.key === "ArrowLeft" ? (index - 1 + CLIENTS.length) % CLIENTS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? CLIENTS.length - 1
      : -1;
    if (nextIndex < 0) return;
    e.preventDefault();
    const next = CLIENTS[nextIndex].id;
    selectClient(next);
    document.getElementById(`mcp-tab-${next}`)?.focus();
  }

  return (
    <div className="modal-backdrop mcp-backdrop" onClick={onClose}>
      <div
        className="modal mcp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcp-modal-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="mcp-hero">
          <div className="mcp-hero-copy">
            <span className="mcp-hero-mark" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path d="M8 8L15 15L23 7M15 15L22 23M15 15L7 23" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="3" fill="currentColor" />
                <circle cx="23" cy="7" r="3" fill="currentColor" />
                <circle cx="7" cy="23" r="3" fill="currentColor" />
                <circle cx="22" cy="23" r="3" fill="currentColor" />
                <circle cx="15" cy="15" r="3.5" fill="#C7F287" />
              </svg>
            </span>
            <div>
              <p className="mcp-hero-kicker">Tendril MCP</p>
              <h2 id="mcp-modal-title">Put compute in your agent’s hands.</h2>
              <p className="mcp-hero-description">
                Connect your AI client to live machines, notebooks, and paid tools.
              </p>
            </div>
          </div>
          <button type="button" className="mcp-hero-close" onClick={onClose} aria-label="Close MCP setup">
            &times;
          </button>
        </div>
        <div className="modal-body mcp-body">
          <div className="mcp-section-heading">
            <div>
              <h3>Choose your client</h3>
              <p>Copy a ready-to-use configuration for your setup.</p>
            </div>
            <span className="mcp-runtime">Runs locally via npx</span>
          </div>
          <div className="mcp-tabs" role="tablist" aria-label="AI client" onKeyDown={onTabsKeyDown}>
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`mcp-tab-${c.id}`}
                aria-selected={client === c.id}
                aria-controls="mcp-config-panel"
                tabIndex={client === c.id ? 0 : -1}
                className={`mcp-tab${client === c.id ? " on" : ""}`}
                onClick={() => selectClient(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div id="mcp-config-panel" role="tabpanel" aria-labelledby={`mcp-tab-${client}`}>
            <div className="mcp-location">
              <span className="mcp-location-label">{client === "claude-code" ? "Run in" : "Save to"}</span>
              <span className="mcp-file">{block.file}</span>
            </div>
            <div className="codeblock mcp-codeblock">
              <div className="codeblock-bar">
                <span className="codeblock-title"><span className="mcp-code-dot" />{block.title}</span>
                <button type="button" className={`codeblock-copy${copied ? " done" : ""}`} onClick={copy}>
                  {copied ? "Copied ✓" : "Copy config"}
                </button>
              </div>
              <pre className="codeblock-body"><code>{block.body}</code></pre>
            </div>
          </div>
          <div className="mcp-details">
            <div className="mcp-detail">
              <span className="mcp-detail-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Explore without a key</strong>
                <p><code>tendril_platform</code> and <code>tendril_list_nodes</code> work right away.</p>
              </div>
            </div>
            <div className="mcp-detail">
              <span className="mcp-detail-icon" aria-hidden="true">↗</span>
              <div>
                <strong>Pay for compute</strong>
                <p>Set <code>AVM_PRIVATE_KEY</code> to a base64 64-byte secret from a USDC-opted-in wallet. A contributor API key cannot pay.</p>
              </div>
            </div>
          </div>
          <p className="mcp-extra">
            Restart your client after saving. Optional spend cap: <code>TENDRIL_MAX_ATOMIC</code> (default 1000000 = $1 per quote). Cline and Roo use the same <code>mcpServers</code> JSON.
          </p>
        </div>
        <div className="modal-actions mcp-actions">
          <a className="mcp-docs-link" href={docsUrl("/docs/build/mcp")}>Read setup guide <span aria-hidden="true">↗</span></a>
          <button type="button" className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
