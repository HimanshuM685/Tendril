interface Props {
  onClose: () => void;
}

export function McpModal({ onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Connect MCP" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span>Connect Tendril MCP Server</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>
            Connect Tendril directly to your favorite agent tools (Claude Desktop, Cursor, Roo Code, Cline).
          </p>
          <div className="codeblock" style={{ margin: "8px 0" }}>
            <div className="codeblock-bar">
              <span className="codeblock-title">CLAUDE_DESKTOP_CONFIG.JSON</span>
            </div>
            <pre className="codeblock-body">{`{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "TENDRIL_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}`}</pre>
          </div>
          <p className="muted small">
            Mint an API key in the Contribute tab to authenticate your MCP calls.
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
