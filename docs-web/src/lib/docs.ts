import { Marked, Renderer } from "marked";
import welcome from "../../../docs/welcome.md";
import gettingStarted from "../../../docs/start/getting-started.md";
import architecture from "../../../docs/start/architecture-flow.md";
import settlementBasics from "../../../docs/start/algorand-settlement.md";
import settlement from "../../../docs/concepts/algorand-settlement.md";
import payments from "../../../docs/concepts/usdc-with-x402.md";
import sandboxes from "../../../docs/concepts/sandboxes-bore-tunnels.md";
import metering from "../../../docs/concepts/per-second-metering.md";
import ssh from "../../../docs/guides-access/ssh-access-keys.md";
import jobs from "../../../docs/guides-access/one-shot-jobs.md";
import security from "../../../docs/guides-access/security-sandboxes.md";
import build from "../../../docs/build.md";
import api from "../../../docs/api.md";
import x402 from "../../../docs/x402-api.md";
import mcp from "../../../docs/mcp.md";

export type DocsTab = "docs" | "build" | "api";
export type DocHeading = { id: string; text: string; depth: number };
export type DocPage = {
  path: string;
  title: string;
  group: string;
  tab: DocsTab;
  source: string;
};

export const DOC_PAGES: DocPage[] = [
  { path: "/", title: "Welcome to Tendril", group: "Start", tab: "docs", source: welcome },
  { path: "/docs/start/getting-started", title: "Getting Started", group: "Start", tab: "docs", source: gettingStarted },
  { path: "/docs/start/architecture-flow", title: "Architecture & Flow", group: "Start", tab: "docs", source: architecture },
  { path: "/docs/start/algorand-settlement", title: "Algorand Settlement Basics", group: "Start", tab: "docs", source: settlementBasics },
  { path: "/docs/concepts/algorand-settlement", title: "Algorand Settlement", group: "Concepts", tab: "docs", source: settlement },
  { path: "/docs/concepts/usdc-with-x402", title: "USDC with x402", group: "Concepts", tab: "docs", source: payments },
  { path: "/docs/concepts/sandboxes-bore-tunnels", title: "Sandboxes & Bore Tunnels", group: "Concepts", tab: "docs", source: sandboxes },
  { path: "/docs/concepts/per-second-metering", title: "Per-Second Metering", group: "Concepts", tab: "docs", source: metering },
  { path: "/docs/guides-access/ssh-access-keys", title: "SSH Access & Keys", group: "Guides & Access", tab: "docs", source: ssh },
  { path: "/docs/guides-access/one-shot-jobs", title: "One-shot Jobs", group: "Guides & Access", tab: "docs", source: jobs },
  { path: "/docs/guides-access/security-sandboxes", title: "Security & Sandboxes", group: "Guides & Access", tab: "docs", source: security },
  { path: "/docs/build", title: "Build on Tendril", group: "Build", tab: "build", source: build },
  { path: "/docs/build/mcp", title: "MCP Tools", group: "Build", tab: "build", source: mcp },
  { path: "/docs/api", title: "HTTP API", group: "API", tab: "api", source: api },
  { path: "/docs/api/x402", title: "x402 Payments", group: "API", tab: "api", source: x402 },
];

export function slugify(text: string): string {
  return text.trim().toLowerCase().replace(/`/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

const markdownRoutes: Record<string, string> = {
  "api.md": "/docs/api",
  "x402-api.md": "/docs/api/x402",
  "mcp.md": "/docs/build/mcp",
};

// Preserve published Build anchors while giving repeated API subheadings unique IDs.
const buildAnchors: Record<string, string> = {
  "serverless-python-execution": "serverless-python",
  "best-value-scoring-algorithm": "best-value",
  "become-a-provider": "contributor-setup",
  "installing-running-the-daemon": "daemon-install",
  "earnings-on-chain-payouts": "payouts",
  "model-context-protocol-mcp": "mcp-setup",
  "claude-desktop-cursor-claude-code-vs-code": "claude-config",
  "autonomous-agent-tool-loop": "agent-loop",
};

function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function renderDoc(page: DocPage): { html: string; toc: DocHeading[] } {
  const toc: DocHeading[] = [];
  const counts = new Map<string, number>();
  const renderer = new Renderer();
  // Marked wraps renderer overrides. Use its active `this`, not the original
  // Renderer instance, so inline links and table cells retain their parser.
  const table = renderer.table;
  const link = renderer.link;
  const code = renderer.code;
  let codeIndex = 0;
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const plain = plainText(text);
    const slug = slugify(plain);
    const base = (page.path === "/docs/build" && buildAnchors[slug]) || slug;
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    const id = count ? `${base}-${count}` : base;
    const level = Math.max(2, depth);
    if (level <= 3) toc.push({ id, text: plain, depth: level });
    return `<h${level} id="${id}" tabindex="-1">${text}</h${level}>`;
  };
  renderer.code = function (token) {
    const label = (token.lang?.split(/\s/)[0] || "Code").replace(/[^\w+-]/g, "");
    return `<div class="docs-code-block"><div class="dcb-header"><span>${label}</span><button type="button" class="dcb-copy" data-copy-code="${codeIndex++}" aria-label="Copy code">Copy</button></div>${code.call(this, token)}</div>`;
  };
  renderer.table = function (token) {
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="Scrollable table">${table.call(this, token)}</div>`;
  };
  renderer.link = function (token) {
    const match = token.href.match(/^(?:\.\/)?([^/#]+\.md)(#.*)?$/);
    const route = match && markdownRoutes[match[1]];
    return link.call(this, route ? { ...token, href: `${route}${match?.[2] ?? ""}` } : token);
  };
  const marked = new Marked({ gfm: true, renderer });
  const tokens = marked.lexer(page.source);
  // The shell supplies the title and TOC. Keep the source files useful on GitHub.
  if (tokens[0]?.type === "heading" && tokens[0].depth === 1) tokens.splice(0, 1);
  const tocIndex = tokens.findIndex((token) => token.type === "heading" && token.text.toLowerCase() === "table of contents");
  if (tocIndex >= 0) {
    let end = tocIndex + 1;
    while (tokens[end]?.type === "space") end++;
    if (tokens[end]?.type === "list") end++;
    tokens.splice(tocIndex, end - tocIndex);
  }
  return { html: marked.parser(tokens), toc };
}

const legacyAnchors: Record<string, string> = {
  welcome: "/",
  "get-started": "/docs/start/getting-started",
  architecture: "/docs/start/architecture-flow",
  "algorand-layer": "/docs/concepts/algorand-settlement",
  "x402-protocol": "/docs/concepts/usdc-with-x402",
  sandboxes: "/docs/concepts/sandboxes-bore-tunnels",
  "metering-billing": "/docs/concepts/per-second-metering",
  "ssh-access": "/docs/guides-access/ssh-access-keys",
  "serverless-jobs": "/docs/guides-access/one-shot-jobs",
  "safety-isolation": "/docs/guides-access/security-sandboxes",
};

export function resolveDocsLocation(pathname: string, search: string, hash: string): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);
  let target = path;
  let anchor = hash;
  if (path === "/docs") target = "/";
  if (path === "/api") target = "/docs/api";
  if (path === "/docs" || path === "/") {
    const doc = params.get("doc");
    const tab = params.get("tab");
    if (doc === "api" || (!doc && tab === "api")) target = "/docs/api";
    if (doc === "x402") target = "/docs/api/x402";
    if (doc === "mcp") target = "/docs/build/mcp";
    if (!doc && tab === "build") target = "/docs/build";
    if (target === "/docs/build" && hash === "#build-welcome") anchor = "";
    if (target === "/docs/api" && hash === "#api-reference") anchor = "";
    if (target === "/" && legacyAnchors[hash.slice(1)]) {
      target = legacyAnchors[hash.slice(1)];
      anchor = "";
    }
  }
  const targetParams = new URLSearchParams(search);
  targetParams.delete("tab");
  targetParams.delete("doc");
  const query = targetParams.toString();
  const result = `${target}${query ? `?${query}` : ""}${anchor}`;
  return result !== `${pathname}${search}${hash}` ? result : null;
}
