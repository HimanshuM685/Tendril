import { useState } from "react";
import { REGISTRY_URL } from "../api";

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
      file: "User scope. Or drop the same mcpServers JSON in .mcp.json at the project root.",
      body: `claude mcp add --transport stdio tendril \\
  --env REGISTRY_URL=${registry} \\
  --env AVM_PRIVATE_KEY=<base64 64-byte secret> \\
  -- npx -y @tendril/mcp-server`,
    },
    vscode: {
      title: ".vscode/mcp.json",
      file: "VS Code uses \"servers\", not \"mcpServers\". Workspace file, or user mcp.json.",
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
    void navigator.clipboard?.writeText(block.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal mcp-modal"
        role="dialog"
        aria-label="Connect MCP"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span>Connect Tendril MCP</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            Stdio server. No clone. <code>npx -y @tendril/mcp-server</code> talks to{" "}
            <code>{REGISTRY_URL}</code>. Restart the app after saving the file.
          </p>
          <div className="mcp-tabs" role="tablist">
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={client === c.id}
                className={`mcp-tab${client === c.id ? " on" : ""}`}
                onClick={() => {
                  setClient(c.id);
                  setCopied(false);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="muted small mcp-file">{block.file}</p>
          <div className="codeblock" style={{ margin: "8px 0" }}>
            <div className="codeblock-bar">
              <span className="codeblock-title">{block.title}</span>
              <button type="button" className={`codeblock-copy${copied ? " done" : ""}`} onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="codeblock-body">{block.body}</pre>
          </div>
          <p className="muted small">
            <code>tendril_platform</code> and <code>tendril_list_nodes</code> work with no key. Paid
            tools need <code>AVM_PRIVATE_KEY</code> — base64 64-byte secret, wallet opted into USDC.
            A contributor API key cannot pay. Optional cap: <code>TENDRIL_MAX_ATOMIC</code> (default
            1000000 = $1 per quote). Cline and Roo use the same <code>mcpServers</code> JSON.
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
