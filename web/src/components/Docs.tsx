import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Marked } from "marked";
import { ArchDiagram } from "./ArchDiagram";
import apiMd from "../../../docs/api.md?raw";
import x402Md from "../../../docs/x402-api.md?raw";
import { REGISTRY_URL } from "../api";

type TabId = "docs" | "build" | "api";
type DocId = "api" | "x402";

type Heading = { id: string; text: string; depth: number };
type Section = Heading & { subs: Heading[] };
type Group = { label: string | null; sections: Section[] };

const API_DOCS: { id: DocId; label: string; blurb: string; source: string }[] = [
  {
    id: "api",
    label: "API REFERENCE",
    blurb: "The plain HTTP endpoints — discovery, sign-in, wallet, leases. Every one has a curl.",
    source: apiMd,
  },
  {
    id: "x402",
    label: "X402 (PAID)",
    blurb: "The three endpoints that move money, and how to pay one from a terminal.",
    source: x402Md,
  },
];

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderMarkdown(markdown: string): { html: string; toc: Heading[] } {
  const toc: Heading[] = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        const id = slugify(plain);
        if (depth <= 3 && id !== "table-of-contents") {
          toc.push({ id, text: plain, depth });
        }
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
      table(token) {
        const html = this.constructor.prototype.table.call(this, token);
        return `<div class="table-wrap">${html}</div>`;
      },
    },
  });
  return { html: marked.parse(markdown) as string, toc };
}

function groupToc(toc: Heading[]): Group[] {
  const rest = toc[0]?.depth === 1 ? toc.slice(1) : toc;
  const groups: Group[] = [{ label: null, sections: [] }];
  for (const h of rest) {
    if (h.depth === 1) {
      groups.push({ label: h.text, sections: [] });
      continue;
    }
    const current = groups[groups.length - 1];
    if (h.depth === 2) current.sections.push({ ...h, subs: [] });
    else current.sections[current.sections.length - 1]?.subs.push(h);
  }
  return groups.filter((g) => g.sections.length > 0);
}

interface DocsProps {
  initialTab?: TabId;
}

export function Docs({ initialTab }: DocsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab from prop, pathname, or search query
  const queryTab = new URLSearchParams(location.search).get("tab") as TabId | null;
  const pathIsApi = location.pathname === "/api";
  const defaultTab: TabId = initialTab || (pathIsApi ? "api" : queryTab || "docs");

  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [activeApiDoc, setActiveApiDoc] = useState<DocId>("api");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const apiBodyRef = useRef<HTMLDivElement>(null);

  // Sync tab with URL if changes externally
  useEffect(() => {
    if (location.pathname === "/api") {
      setActiveTab("api");
    } else {
      const tabParam = new URLSearchParams(location.search).get("tab") as TabId | null;
      if (tabParam && (tabParam === "docs" || tabParam === "build" || tabParam === "api")) {
        setActiveTab(tabParam);
      }
    }
  }, [location.pathname, location.search]);

  // Handle Tab Switch
  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === "docs") {
      navigate("/docs", { replace: true });
    } else {
      navigate(`/docs?tab=${tab}`, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Markdown rendering for API tab
  const currentDoc = API_DOCS.find((d) => d.id === activeApiDoc)!;
  const { html: apiHtml, toc: apiToc } = useMemo(
    () => renderMarkdown(currentDoc.source),
    [currentDoc.source]
  );
  const apiGroups = useMemo(() => groupToc(apiToc), [apiToc]);

  // Which section is open in API TOC
  const openApiSection = useMemo(() => {
    for (const g of apiGroups) {
      for (const s of g.sections) {
        if (s.id === activeHeadingId || s.subs.some((h) => h.id === activeHeadingId)) {
          return s.id;
        }
      }
    }
    return apiGroups[0]?.sections[0]?.id ?? "";
  }, [apiGroups, activeHeadingId]);

  // Copy helper
  const copyText = (text: string, id: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSearchFocused(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scrollspy tracking for headings
  useEffect(() => {
    const handleScroll = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
      let current = "";
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top;
        if (top <= 140) {
          current = heading.id;
        } else {
          break;
        }
      }
      if (current) setActiveHeadingId(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, activeApiDoc, apiHtml]);

  // Intercept internal anchor clicks in rendered API HTML
  useEffect(() => {
    const root = apiBodyRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!href?.startsWith("#")) return;
      e.preventDefault();
      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveHeadingId(targetId);
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [apiHtml]);

  // Search items across Docs, Build, and API
  const searchIndex = useMemo(() => [
    { title: "Welcome to Tendril", category: "Docs / Start", tab: "docs" as TabId, anchor: "welcome" },
    { title: "Architecture & Flow", category: "Docs / Architecture", tab: "docs" as TabId, anchor: "architecture" },
    { title: "Get Started (3 Steps)", category: "Docs / Guides", tab: "docs" as TabId, anchor: "get-started" },
    { title: "SSH Access & Host Keys", category: "Docs / Guides", tab: "docs" as TabId, anchor: "ssh-access" },
    { title: "Billing & Metering Grace", category: "Docs / Concepts", tab: "docs" as TabId, anchor: "metering-billing" },
    { title: "Safety & Sandbox Isolation", category: "Docs / Concepts", tab: "docs" as TabId, anchor: "safety-isolation" },
    { title: "Serverless Python (/x402/run)", category: "Build / Quickstart", tab: "build" as TabId, anchor: "serverless-python" },
    { title: "Best-Value Scoring Formula", category: "Build / Algorithms", tab: "build" as TabId, anchor: "best-value" },
    { title: "Become a Contributor Node", category: "Build / Providers", tab: "build" as TabId, anchor: "contributor-setup" },
    { title: "Model Context Protocol (MCP)", category: "Build / Tooling", tab: "build" as TabId, anchor: "mcp-setup" },
    { title: "Claude Desktop Integration", category: "Build / Tooling", tab: "build" as TabId, anchor: "claude-config" },
    { title: "Autonomous Agent Tool Loop", category: "Build / Agents", tab: "build" as TabId, anchor: "agent-loop" },
    { title: "GET /explorer (List Nodes)", category: "API / Free", tab: "api" as TabId, anchor: "get-explorer" },
    { title: "POST /x402/run (One-off Execution)", category: "API / Paid", tab: "api" as TabId, anchor: "post-x402run" },
    { title: "POST /x402/rent (Open Lease)", category: "API / Paid", tab: "api" as TabId, anchor: "post-x402rent" },
    { title: "POST /x402/release (Close Lease)", category: "API / Paid", tab: "api" as TabId, anchor: "post-x402release" },
    { title: "GET /wallet (Balances)", category: "API / Session", tab: "api" as TabId, anchor: "get-wallet" },
    { title: "POST /keys (Mint Daemon Key)", category: "API / Contributor", tab: "api" as TabId, anchor: "post-keys" },
  ], []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, searchIndex]);

  const scrollToAnchor = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(anchor);
    }
  };

  const selectSearchResult = (item: (typeof searchIndex)[0]) => {
    if (item.tab !== activeTab) {
      switchTab(item.tab);
    }
    setSearchQuery("");
    setSearchFocused(false);
    setTimeout(() => {
      scrollToAnchor(item.anchor);
    }, 120);
  };

  return (
    <div className="docs-page-wrapper">
      {/* Top Header matching docs-page-layout.png */}
      <header className="docs-top-header">
        <div className="docs-header-inner">
          {/* Brand */}
          <div className="docs-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <span className="docs-brand-flower">
              <svg viewBox="0 0 32 32" width="24" height="24">
                <rect width="32" height="32" rx="6" fill="#0B5D3A" />
                <g fill="#F4F1EA">
                  <rect x="5" y="7" width="22" height="4" />
                  <rect x="5" y="7" width="2" height="3" />
                  <rect x="25" y="7" width="2" height="3" />
                  <rect x="14" y="7" width="4" height="17" />
                  <rect x="10" y="22" width="12" height="3" />
                </g>
              </svg>
            </span>
            <span className="docs-brand-text">Tendril</span>
          </div>

          {/* Search bar with Ctrl+K badge */}
          <div className="docs-search-container">
            <div className={`docs-search-input-wrap ${searchFocused ? "focused" : ""}`}>
              <svg className="docs-search-icon" viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="docs-search-input"
                placeholder="Search documentation, guides & API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
              />
              <kbd className="docs-search-kbd">Ctrl K</kbd>
            </div>

            {/* Live Search Results Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="docs-search-dropdown">
                {searchResults.length === 0 ? (
                  <div className="docs-search-empty">No results found for &ldquo;{searchQuery}&rdquo;</div>
                ) : (
                  <div className="docs-search-list">
                    {searchResults.map((item, i) => (
                      <div
                        key={i}
                        className="docs-search-item"
                        onMouseDown={() => selectSearchResult(item)}
                      >
                        <span className="ds-item-title">{item.title}</span>
                        <span className="ds-item-cat">{item.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top Actions: GitHub & Launch App > */}
          <div className="docs-header-actions">
            <a
              href="https://github.com/HimanshuM685/Tendril"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-nav-link"
              title="GitHub Repository"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>

            <button
              type="button"
              className="docs-launch-btn"
              onClick={() => navigate("/explore")}
            >
              <span>Launch App</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Horizontal Sub-nav Tabs: Docs | Build | API */}
      <nav className="docs-subnav-bar">
        <div className="docs-subnav-inner">
          <button
            type="button"
            className={`docs-subnav-tab ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => switchTab("docs")}
          >
            Docs
          </button>
          <button
            type="button"
            className={`docs-subnav-tab ${activeTab === "build" ? "active" : ""}`}
            onClick={() => switchTab("build")}
          >
            Build
          </button>
          <button
            type="button"
            className={`docs-subnav-tab ${activeTab === "api" ? "active" : ""}`}
            onClick={() => switchTab("api")}
          >
            API
          </button>
        </div>
      </nav>

      {/* 3-Column Layout Shell */}
      <div className="docs-main-shell">
        {/* ================= COLUMN 1: LEFT NAVIGATION SIDEBAR ================= */}
        <aside className="docs-sidebar-nav">
          {activeTab === "docs" && (
            <div className="docs-nav-group-list">
              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Start</div>
                <a
                  href="#welcome"
                  className={`docs-nav-link-item ${activeHeadingId === "welcome" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("welcome"); }}
                >
                  Welcome to Tendril
                </a>
                <a
                  href="#get-started"
                  className={`docs-nav-link-item ${activeHeadingId === "get-started" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("get-started"); }}
                >
                  Getting Started
                </a>
                <a
                  href="#architecture"
                  className={`docs-nav-link-item ${activeHeadingId === "architecture" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("architecture"); }}
                >
                  Architecture &amp; Flow
                </a>
              </div>

              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Concepts</div>
                <a
                  href="#algorand-layer"
                  className={`docs-nav-link-item ${activeHeadingId === "algorand-layer" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("algorand-layer"); }}
                >
                  Algorand Settlement
                </a>
                <a
                  href="#x402-protocol"
                  className={`docs-nav-link-item ${activeHeadingId === "x402-protocol" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("x402-protocol"); }}
                >
                  USDC with x402
                </a>
                <a
                  href="#sandboxes"
                  className={`docs-nav-link-item ${activeHeadingId === "sandboxes" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("sandboxes"); }}
                >
                  Sandboxes &amp; Bore Tunnels
                </a>
                <a
                  href="#metering-billing"
                  className={`docs-nav-link-item ${activeHeadingId === "metering-billing" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("metering-billing"); }}
                >
                  Per-Second Metering
                </a>
              </div>

              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Guides &amp; Access</div>
                <a
                  href="#ssh-access"
                  className={`docs-nav-link-item ${activeHeadingId === "ssh-access" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("ssh-access"); }}
                >
                  SSH Access &amp; Keys
                </a>
                <a
                  href="#serverless-jobs"
                  className={`docs-nav-link-item ${activeHeadingId === "serverless-jobs" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("serverless-jobs"); }}
                >
                  One-shot Jobs (/x402/run)
                </a>
                <a
                  href="#safety-isolation"
                  className={`docs-nav-link-item ${activeHeadingId === "safety-isolation" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("safety-isolation"); }}
                >
                  Security &amp; Sandboxes
                </a>
              </div>
            </div>
          )}

          {activeTab === "build" && (
            <div className="docs-nav-group-list">
              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Quickstart</div>
                <a
                  href="#build-welcome"
                  className={`docs-nav-link-item ${activeHeadingId === "build-welcome" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("build-welcome"); }}
                >
                  Build on Tendril
                </a>
                <a
                  href="#serverless-python"
                  className={`docs-nav-link-item ${activeHeadingId === "serverless-python" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("serverless-python"); }}
                >
                  Run Python Scripts
                </a>
                <a
                  href="#best-value"
                  className={`docs-nav-link-item ${activeHeadingId === "best-value" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("best-value"); }}
                >
                  Best-Value Scoring
                </a>
              </div>

              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Contributor Daemon</div>
                <a
                  href="#contributor-setup"
                  className={`docs-nav-link-item ${activeHeadingId === "contributor-setup" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("contributor-setup"); }}
                >
                  Become a Provider
                </a>
                <a
                  href="#daemon-install"
                  className={`docs-nav-link-item ${activeHeadingId === "daemon-install" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("daemon-install"); }}
                >
                  Installing Daemon
                </a>
                <a
                  href="#payouts"
                  className={`docs-nav-link-item ${activeHeadingId === "payouts" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("payouts"); }}
                >
                  Earnings &amp; Payouts
                </a>
              </div>

              <div className="docs-nav-group">
                <div className="docs-nav-group-title">Tooling &amp; MCP</div>
                <a
                  href="#mcp-setup"
                  className={`docs-nav-link-item ${activeHeadingId === "mcp-setup" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("mcp-setup"); }}
                >
                  Model Context Protocol
                </a>
                <a
                  href="#claude-config"
                  className={`docs-nav-link-item ${activeHeadingId === "claude-config" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("claude-config"); }}
                >
                  Claude Desktop Setup
                </a>
                <a
                  href="#agent-loop"
                  className={`docs-nav-link-item ${activeHeadingId === "agent-loop" ? "active" : ""}`}
                  onClick={(e) => { e.preventDefault(); scrollToAnchor("agent-loop"); }}
                >
                  Autonomous Agent Loop
                </a>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="docs-nav-group-list">
              <div className="docs-api-subtabs">
                {API_DOCS.map((d) => (
                  <button
                    key={d.id}
                    className={`docs-api-tab-btn ${activeApiDoc === d.id ? "active" : ""}`}
                    onClick={() => setActiveApiDoc(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {apiGroups.map((g, i) => (
                <div className="docs-nav-group" key={g.label ?? `g${i}`}>
                  {g.label && <div className="docs-nav-group-title">{g.label}</div>}
                  {g.sections.map((s) => (
                    <div key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={`docs-nav-link-item ${s.id === activeHeadingId ? "active" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToAnchor(s.id);
                        }}
                      >
                        {s.text}
                      </a>
                      {s.id === openApiSection &&
                        s.subs.map((sub) => (
                          <a
                            key={sub.id}
                            href={`#${sub.id}`}
                            className={`docs-nav-link-subitem ${sub.id === activeHeadingId ? "active" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              scrollToAnchor(sub.id);
                            }}
                          >
                            {sub.text}
                          </a>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ================= COLUMN 2: CENTER MAIN CONTENT ================= */}
        <main className="docs-main-content">
          {activeTab === "docs" && (
            <article className="docs-article">
              <div className="docs-eyebrow">Start</div>
              <h1 id="welcome" className="docs-title">Welcome to Tendril</h1>
              <p className="docs-lead">
                Tendril rents real machines by the second, paid in <strong>USDC over x402</strong> on
                Algorand. Top up once, then either rent a box and SSH into it, or throw a script
                at <code>POST /x402/run</code>. You pay for the seconds you actually use, billed at
                the end — never for a block of time you booked and didn&rsquo;t need.
              </p>

              {/* 3 Summary Cards matching docs-page-layout.png */}
              <div className="docs-feature-cards-grid">
                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                      <path d="M13.874 0h3.673l1.61 5.963h3.789l-2.588 4.5 3.624 13.533h-3.757l-2.44-9.077-5.247 9.079H8.345l8.107-14.051-1.304-4.878L4.215 24H.018Z" />
                    </svg>
                  </div>
                  <h3 className="dfc-title">ALGORAND</h3>
                  <span className="dfc-subtitle">Base layer</span>
                  <p className="dfc-desc">
                    Fast 2.8s finality. Facilitator sponsors network fees — payers need zero ALGO.
                  </p>
                </div>

                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 96 96" width="34" height="34" fill="currentColor">
                      <path
                        d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="dfc-title">USDC WITH X402</h3>
                  <span className="dfc-subtitle">Collateral &amp; Settlement</span>
                  <p className="dfc-desc">
                    1:1 USD settlement. Idempotent deposits, off-chain ledger, and no rate volatility.
                  </p>
                </div>

                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                    </svg>
                  </div>
                  <h3 className="dfc-title">DOCKER &amp; BORE</h3>
                  <span className="dfc-subtitle">Sandboxes &amp; Tunnels</span>
                  <p className="dfc-desc">
                    Hardened throwaway Linux containers. Zero host ports opened; instant teardown.
                  </p>
                </div>
              </div>

              {/* Get started Section */}
              <h2 id="get-started" className="docs-h2">Get started</h2>
              <div className="docs-steps-grid">
                <div className="docs-step-card">
                  <div className="step-num">01</div>
                  <h4>Connect &amp; sign in</h4>
                  <p>
                    Connect Pera, Defly, or Lute for non-custodial use, or select <strong>Continue with Google</strong> to
                    provision a custodial Algorand wallet automatically.
                  </p>
                </div>

                <div className="docs-step-card">
                  <div className="step-num">02</div>
                  <h4>Top up USDC</h4>
                  <p>
                    Deposit USDC into your prepaid balance. The x402 facilitator pays network fees so you
                    need zero ALGO. Balance is credited instantly with idempotent protection.
                  </p>
                </div>

                <div className="docs-step-card">
                  <div className="step-num">03</div>
                  <h4>Rent &amp; SSH or Run</h4>
                  <p>
                    Pick any machine on the <strong>Explore</strong> page and connect via encrypted bore SSH,
                    or submit one-off scripts directly to <code>POST /x402/run</code>.
                  </p>
                </div>
              </div>

              {/* Architecture Section */}
              <h2 id="architecture" className="docs-h2">System Architecture &amp; Data Flow</h2>
              <p>
                Tendril decouples execution, orchestration, and settlement into three autonomous planes that communicate
                over lightweight, resilient protocols. Renters and headless AI agents never interact directly with provider host
                systems, and providers never open incoming ports on their local networks.
              </p>

              {/* Three Decoupled Tiers */}
              <div className="arch-tiers-grid">
                <div className="arch-tier-card">
                  <div className="atc-tag">TIER 1 · CONTROL PLANE</div>
                  <h4>Tendril Registry &amp; Ledger</h4>
                  <p>
                    Orchestrates leases over WebSockets, maintains high-resolution per-second billing in Neon Postgres,
                    monitors watchdog heartbeats, and verifies x402 payment claims.
                  </p>
                </div>

                <div className="arch-tier-card">
                  <div className="atc-tag">TIER 2 · EXECUTION PLANE</div>
                  <h4>Disposable Sandboxes &amp; Bore</h4>
                  <p>
                    Hardened throwaway Docker containers spawned on demand by provider daemons. Inbound SSH is forwarded
                    through an outbound encrypted bore tunnel relay. Destroyed at release.
                  </p>
                </div>

                <div className="arch-tier-card">
                  <div className="atc-tag">TIER 3 · SETTLEMENT PLANE</div>
                  <h4>Algorand &amp; x402 Facilitator</h4>
                  <p>
                    Instant 2.8s finality for USDC asset transfers. Facilitator sponsors all network transaction fees
                    so payers need zero ALGO balance. Providers withdraw earnings on-chain.
                  </p>
                </div>
              </div>

              {/* Interactive Architecture Diagram */}
              <div className="docs-arch-wrap">
                <ArchDiagram />
              </div>

              {/* Deep Dive Pillars: 4 Architectural Guarantees */}
              <h3 className="docs-h3">Core Architectural Pillars</h3>
              <div className="arch-pillars-grid">
                <div className="arch-pillar-card">
                  <div className="apc-icon-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <h4>Zero-Port Inbound NAT Traversal</h4>
                  <p>
                    Standard home PCs and datacenter servers alike can provide compute without port forwarding or static public IPs.
                    The provider daemon initiates an outbound TCP bore tunnel to the Tendril relay, routing renter SSH traffic
                    directly into the ephemeral sandbox.
                  </p>
                </div>

                <div className="arch-pillar-card">
                  <div className="apc-icon-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <h4>Cryptographic Wallet Decoupling</h4>
                  <p>
                    Provider daemons hold zero private keys or seed phrases. The wallet that mints the API key in the web
                    dashboard owns the node and accumulates earnings. If a provider server is physically compromised, zero
                    funds can be stolen.
                  </p>
                </div>

                <div className="arch-pillar-card">
                  <div className="apc-icon-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h4>Micro-Metered Continuous Billing</h4>
                  <p>
                    Rather than forcing blocks of booked hours, runtime is tracked continuously and settled once at lease release.
                    A $1.00 goodwill runtime grace window protects renters if prepaid credits deplete mid-calculation, preventing
                    unexpected job truncation.
                  </p>
                </div>

                <div className="arch-pillar-card">
                  <div className="apc-icon-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h4>Hardened Container Sandbox Isolation</h4>
                  <p>
                    Each lease is isolated in an unprivileged container with <code>CAP_DROP=ALL</code>, no host mounts, hard CPU core
                    and RAM cgroup caps, PID limits, and automated teardown upon session termination.
                  </p>
                </div>
              </div>

              {/* Protocol Lifecycle Breakdown */}
              <h3 className="docs-h3">Lifecycle: How a Metered Lease Executes</h3>
              <div className="arch-lifecycle-timeline">
                <div className="alt-step">
                  <div className="alt-marker">1</div>
                  <div className="alt-content">
                    <h5>Discovery &amp; Gate Fee Opening</h5>
                    <p>
                      Renter queries <code>GET /explorer</code> (free read) and chooses a node. Opening a lease requires a 0.01 USDC gate fee
                      deducted from prepaid credit to establish an active session token.
                    </p>
                  </div>
                </div>

                <div className="alt-step">
                  <div className="alt-marker">2</div>
                  <div className="alt-content">
                    <h5>WebSocket Dispatch &amp; Sandbox Provisioning</h5>
                    <p>
                      The registry sends a lease command to the provider daemon over an authenticated WebSocket. The daemon executes{" "}
                      <code>docker run</code> with resource constraints and launches the internal bore client.
                    </p>
                  </div>
                </div>

                <div className="alt-step">
                  <div className="alt-marker">3</div>
                  <div className="alt-content">
                    <h5>Encrypted Direct SSH Access</h5>
                    <p>
                      Renter receives the allocated bore host and port (e.g. <code>bore.tendrilhq.com:38472</code>). Renter SSH traffic
                      flows straight through the relay tunnel into the container. The host filesystem remains inaccessible.
                    </p>
                  </div>
                </div>

                <div className="alt-step">
                  <div className="alt-marker">4</div>
                  <div className="alt-content">
                    <h5>Watchdog Watch &amp; Per-Second Reconciliation</h5>
                    <p>
                      The registry watchdog audits active leases every tick. If runtime reaches zero balance, the grace window activates.
                      When the renter releases or timeout occurs, the container is destroyed, exact seconds are calculated, and earnings credit to the provider.
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Concepts */}
              <h2 id="algorand-layer" className="docs-h2">Algorand Settlement Layer</h2>
              <p>
                Algorand provides immediate, deterministic block finality without chain reorganizations. Every deposit
                and contributor withdrawal settles on Algorand Mainnet or Testnet via standard ASA USDC asset transfers.
                Because the facilitator sponsors transaction fees, renters need only hold USDC.
              </p>

              <h2 id="x402-protocol" className="docs-h2">USDC with x402 Protocol</h2>
              <p>
                x402 is an open HTTP payment standard that maps HTTP status code <code>402 Payment Required</code> to
                verifiable on-chain settlement tokens. When funding a balance or invoking paid endpoints, clients provide
                a signed payment authorization header that the Tendril registry verifies before processing the request.
              </p>

              <h2 id="sandboxes" className="docs-h2">Docker Sandboxes &amp; Bore Tunnels</h2>
              <p>
                Providers never open incoming ports or give shell access to their host machines. Instead, each lease spawns
                an isolated Docker sandbox containing an internal bore tunnel client. The client forwards SSH traffic
                through a secure relay server directly into the ephemeral container.
              </p>

              {/* SSH Access */}
              <h2 id="ssh-access" className="docs-h2">SSH Access &amp; Keys</h2>
              <p>
                When a lease is confirmed, the registry returns a unique host and port combination. Your connected
                wallet address acts as the password, or you can supply your SSH public key during checkout:
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>TERMINAL</span>
                  <button
                    className="dcb-copy"
                    onClick={() => copyText("ssh root@bore.tendrilhq.com -p 38472", "ssh-cmd")}
                  >
                    {copiedId === "ssh-cmd" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>ssh root@bore.tendrilhq.com -p 38472   # password = your wallet address</code></pre>
              </div>

              {/* One-shot Jobs */}
              <h2 id="serverless-jobs" className="docs-h2">One-shot Jobs (/x402/run)</h2>
              <p>
                For executing single scripts or agent tasks without leasing a full machine, <code>POST /x402/run</code> selects
                the best-value idle machine, executes your code inside a throwaway sandbox, returns stdout, and instantly
                destroys the container:
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>BASH / CURL</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `curl -X POST ${REGISTRY_URL}/x402/run \\\n  -H 'content-type: application/json' \\\n  -d '{"payload":"print(sum(range(100)))"}'`,
                        "curl-run"
                      )
                    }
                  >
                    {copiedId === "curl-run" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`curl -X POST $API/x402/run \\
  -H 'content-type: application/json' \\
  -d '{"payload":"print(sum(range(100)))"}'`}</code></pre>
              </div>

              {/* Billing & Metering */}
              <h2 id="metering-billing" className="docs-h2">Billing &amp; Per-Second Metering</h2>
              <ul className="docs-list">
                <li><strong>USD pricing:</strong> Nodes are priced per hour in USD (1 USDC = $1.00 USD). No exchange rate volatility.</li>
                <li><strong>Charged once:</strong> Usage is tracked per second but charged exactly once when the lease closes.</li>
                <li><strong>Grace window:</strong> If your prepaid balance runs out mid-session, Tendril gives you a $1.00 goodwill runtime window to save work before terminating the sandbox.</li>
                <li><strong>Negative balance policy:</strong> A one-shot script is never killed mid-run; if it overdraws by pennies, your balance reflects the negative amount until topped up.</li>
                <li><strong>Contributor payout:</strong> Contributors receive USDC payouts on-chain minus a 5% platform protocol fee.</li>
              </ul>

              {/* Security */}
              <h2 id="safety-isolation" className="docs-h2">Container Safety &amp; Isolation</h2>
              <ul className="docs-list">
                <li>No host filesystem mounts and no host network bridge access.</li>
                <li>Linux capabilities dropped (<code>CAP_DROP=ALL</code>) and <code>no-new-privileges</code> enforced.</li>
                <li>Hard cgroup limits on CPU cores, RAM consumption, and maximum PID count.</li>
                <li>Sandboxes are destroyed immediately upon lease closure — zero state persistence.</li>
              </ul>
            </article>
          )}

          {activeTab === "build" && (
            <article className="docs-article">
              <div className="docs-eyebrow">Developer &amp; Builder Guides</div>
              <h1 id="build-welcome" className="docs-title">Build on Tendril</h1>
              <p className="docs-lead">
                Integrate autonomous AI agents, execute headless Python sandboxes, or monetize idle GPU/CPU hardware by
                running the Tendril contributor daemon.
              </p>

              {/* 3 Build Summary Cards */}
              <div className="docs-feature-cards-grid">
                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <h3 className="dfc-title">AGENTIC RUNTIME</h3>
                  <span className="dfc-subtitle">Autonomous loops</span>
                  <p className="dfc-desc">
                    AI agents query `/explorer`, lease machines, run code, and teardown automatically.
                  </p>
                </div>

                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <h3 className="dfc-title">PROVIDER DAEMON</h3>
                  <span className="dfc-subtitle">Zero-config hosting</span>
                  <p className="dfc-desc">
                    Turn any PC or server into a node. Outbound bore tunnels punch through NATs seamlessly.
                  </p>
                </div>

                <div className="docs-feature-card">
                  <div className="dfc-logo-wrap">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <h3 className="dfc-title">MCP INTEGRATION</h3>
                  <span className="dfc-subtitle">Model Context Protocol</span>
                  <p className="dfc-desc">
                    Connect Claude Desktop, Cursor, or langchain agents directly to real execution sandboxes.
                  </p>
                </div>
              </div>

              {/* Serverless Python */}
              <h2 id="serverless-python" className="docs-h2">Serverless Python Execution</h2>
              <p>
                Call <code>POST /x402/run</code> from Python with standard HTTP requests:
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>PYTHON</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `import requests\n\nresp = requests.post(\n    "http://localhost:4000/x402/run",\n    json={"payload": "import math; print(math.factorial(20))"}\n)\nprint(resp.json())`,
                        "py-code"
                      )
                    }
                  >
                    {copiedId === "py-code" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`import requests

resp = requests.post(
    "http://localhost:4000/x402/run",
    json={"payload": "import math; print(math.factorial(20))"}
)
print("Execution Result:", resp.json()["stdout"])`}</code></pre>
              </div>

              {/* Best Value Scoring */}
              <h2 id="best-value" className="docs-h2">Best-Value Scoring Algorithm</h2>
              <p>
                Tendril does not blindly select the cheapest node. A box at half the price that takes three times as long
                is more expensive in total. Nodes are ranked automatically using the efficiency formula:
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>FORMULA</span>
                  <button
                    className="dcb-copy"
                    onClick={() => copyText("score = (cpu_cores + (ram_gb / 4)) / price_per_hour_usd", "score-math")}
                  >
                    {copiedId === "score-math" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>score = (cores + (ram_gb / 4.0)) / price_per_hour_usd</code></pre>
              </div>

              {/* Contributor Setup */}
              <h2 id="contributor-setup" className="docs-h2">Become a Provider</h2>
              <p>
                Share spare CPU or GPU compute and earn USDC continuously. The provider daemon holds zero wallet private
                keys. The wallet that minted your API key on the <strong>Contribute</strong> page owns the node and collects earnings.
              </p>

              <h2 id="daemon-install" className="docs-h2">Installing &amp; Running the Daemon</h2>
              <p>Clone the repository and launch the contributor daemon with your key and target price:</p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>BASH</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `git clone https://github.com/HimanshuM685/Tendril.git\ncd Tendril/contributor\nnpm install\nTENDRIL_API_KEY="<your-api-key>" PRICE_PER_HOUR_USD=0.20 npm run contributor`,
                        "daemon-cmd"
                      )
                    }
                  >
                    {copiedId === "daemon-cmd" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`# 1. Clone repository & install dependencies
git clone https://github.com/HimanshuM685/Tendril.git
cd Tendril/contributor && npm install

# 2. Start daemon with your pricing
TENDRIL_API_KEY="<your-api-key>" PRICE_PER_HOUR_USD=0.20 npm run contributor`}</code></pre>
              </div>

              {/* Payouts */}
              <h2 id="payouts" className="docs-h2">Earnings &amp; On-Chain Payouts</h2>
              <p>
                Whenever a renter releases a lease on your node, earnings credit to your contributor balance immediately.
                You can withdraw your accumulated USDC balance directly to your Algorand wallet from the <strong>Contribute</strong> page
                once earnings exceed the $5.00 USDC minimum threshold.
              </p>

              {/* MCP Tooling */}
              <h2 id="mcp-setup" className="docs-h2">Model Context Protocol (MCP)</h2>
              <p>
                Stdio server. No clone. <code>npx -y @tendril/mcp-server</code> talks to{" "}
                <code>{REGISTRY_URL}</code>. Paid tools sign with <code>AVM_PRIVATE_KEY</code> (base64
                64-byte secret, wallet opted into USDC). A contributor API key cannot pay. Restart the
                client after saving.
              </p>

              <h2 id="claude-config" className="docs-h2">Claude Desktop, Cursor, Claude Code, VS Code</h2>
              <p>
                Claude Desktop: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
                (Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code>). Cursor:{" "}
                <code>~/.cursor/mcp.json</code>. Same JSON. Cline and Roo use that object too.
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>claude_desktop_config.json / mcp.json</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `{\n  "mcpServers": {\n    "tendril": {\n      "command": "npx",\n      "args": ["-y", "@tendril/mcp-server"],\n      "env": {\n        "REGISTRY_URL": "${REGISTRY_URL}",\n        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"\n      }\n    }\n  }\n}`,
                        "mcp-cfg"
                      )
                    }
                  >
                    {copiedId === "mcp-cfg" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "${REGISTRY_URL}",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}`}</code></pre>
              </div>

              <p>
                Claude Code:
              </p>
              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>claude mcp add</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `claude mcp add --transport stdio tendril \\\n  --env REGISTRY_URL=${REGISTRY_URL} \\\n  --env AVM_PRIVATE_KEY=<base64 64-byte secret> \\\n  -- npx -y @tendril/mcp-server`,
                        "mcp-claude"
                      )
                    }
                  >
                    {copiedId === "mcp-claude" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`claude mcp add --transport stdio tendril \\
  --env REGISTRY_URL=${REGISTRY_URL} \\
  --env AVM_PRIVATE_KEY=<base64 64-byte secret> \\
  -- npx -y @tendril/mcp-server`}</code></pre>
              </div>

              <p>
                VS Code uses <code>servers</code> and requires <code>type</code>. File:{" "}
                <code>.vscode/mcp.json</code>.
              </p>
              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>.vscode/mcp.json</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `{\n  "servers": {\n    "tendril": {\n      "type": "stdio",\n      "command": "npx",\n      "args": ["-y", "@tendril/mcp-server"],\n      "env": {\n        "REGISTRY_URL": "${REGISTRY_URL}",\n        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"\n      }\n    }\n  }\n}`,
                        "mcp-vscode"
                      )
                    }
                  >
                    {copiedId === "mcp-vscode" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`{
  "servers": {
    "tendril": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "${REGISTRY_URL}",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}`}</code></pre>
              </div>

              {/* Agent Loop */}
              <h2 id="agent-loop" className="docs-h2">Autonomous Agent Tool Loop</h2>
              <p>
                A minimal autonomous loop: (1) check wallet balance, (2) survey available hardware, (3) execute sandbox job:
              </p>

              <div className="docs-code-block">
                <div className="dcb-header">
                  <span>PYTHON SCRIPT</span>
                  <button
                    className="dcb-copy"
                    onClick={() =>
                      copyText(
                        `import requests\n\nAPI = "http://localhost:4000"\nnodes = requests.get(f"{API}/explorer").json()["nodes"]\nprint(f"Discovered {len(nodes)} live nodes.")\n\nresult = requests.post(f"{API}/x402/run", json={"payload": "print('Agent compute successful')"}).json()\nprint(result["stdout"])`,
                        "loop-py"
                      )
                    }
                  >
                    {copiedId === "loop-py" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre><code>{`import requests

API = "http://localhost:4000"

# 1. Survey available hardware
nodes = requests.get(f"{API}/explorer").json()["nodes"]
print(f"Discovered {len(nodes)} active machines.")

# 2. Execute ephemeral compute job
job = requests.post(f"{API}/x402/run", json={
    "payload": "import sys; print(f'Running on Python {sys.version}')"
}).json()

print("Job stdout:", job["stdout"])`}</code></pre>
              </div>
            </article>
          )}

          {activeTab === "api" && (
            <article className="docs-article">
              <div className="docs-eyebrow">REST &amp; X402 SPEC</div>
              <h1 id="api-reference" className="docs-title">Tendril API Reference</h1>
              <p className="docs-lead">
                Tendril is an API first and a website second. Everything this app does, a script can do —
                the browser is just another x402 client with no privileged access.
              </p>

              {/* Base URL Box with Copy button */}
              <div className="docs-base-url-box">
                <div className="dbu-left">
                  <span className="dbu-label">Base URL</span>
                  <code className="dbu-code">{REGISTRY_URL}</code>
                </div>
                <button
                  type="button"
                  className="dbu-copy-btn"
                  onClick={() => copyText(`export API=${REGISTRY_URL}`, "base-export")}
                >
                  {copiedId === "base-export" ? "Copied!" : "Copy export API"}
                </button>
              </div>

              {/* Rendered Markdown from api.md / x402-api.md */}
              <div
                ref={apiBodyRef}
                className="docs-markdown-body"
                dangerouslySetInnerHTML={{ __html: apiHtml }}
              />
            </article>
          )}
        </main>

        {/* ================= COLUMN 3: RIGHT TABLE OF CONTENTS ================= */}
        <aside className="docs-toc-rail">
          <div className="docs-toc-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>On this page</span>
          </div>

          {activeTab === "docs" && (
            <div className="docs-toc-links">
              <a
                href="#welcome"
                className={`docs-toc-item ${activeHeadingId === "welcome" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("welcome"); }}
              >
                Welcome to Tendril
              </a>
              <a
                href="#get-started"
                className={`docs-toc-item ${activeHeadingId === "get-started" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("get-started"); }}
              >
                Get started
              </a>
              <a
                href="#architecture"
                className={`docs-toc-item ${activeHeadingId === "architecture" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("architecture"); }}
              >
                Architecture &amp; Flow
              </a>
              <a
                href="#algorand-layer"
                className={`docs-toc-item ${activeHeadingId === "algorand-layer" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("algorand-layer"); }}
              >
                Algorand Settlement
              </a>
              <a
                href="#x402-protocol"
                className={`docs-toc-item ${activeHeadingId === "x402-protocol" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("x402-protocol"); }}
              >
                USDC with x402
              </a>
              <a
                href="#sandboxes"
                className={`docs-toc-item ${activeHeadingId === "sandboxes" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("sandboxes"); }}
              >
                Docker &amp; Bore
              </a>
              <a
                href="#ssh-access"
                className={`docs-toc-item ${activeHeadingId === "ssh-access" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("ssh-access"); }}
              >
                SSH Access &amp; Keys
              </a>
              <a
                href="#serverless-jobs"
                className={`docs-toc-item ${activeHeadingId === "serverless-jobs" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("serverless-jobs"); }}
              >
                One-shot Jobs
              </a>
              <a
                href="#metering-billing"
                className={`docs-toc-item ${activeHeadingId === "metering-billing" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("metering-billing"); }}
              >
                Billing &amp; Grace Period
              </a>
              <a
                href="#safety-isolation"
                className={`docs-toc-item ${activeHeadingId === "safety-isolation" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("safety-isolation"); }}
              >
                Safety &amp; Isolation
              </a>
            </div>
          )}

          {activeTab === "build" && (
            <div className="docs-toc-links">
              <a
                href="#build-welcome"
                className={`docs-toc-item ${activeHeadingId === "build-welcome" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("build-welcome"); }}
              >
                Build on Tendril
              </a>
              <a
                href="#serverless-python"
                className={`docs-toc-item ${activeHeadingId === "serverless-python" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("serverless-python"); }}
              >
                Serverless Python
              </a>
              <a
                href="#best-value"
                className={`docs-toc-item ${activeHeadingId === "best-value" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("best-value"); }}
              >
                Best-Value Scoring
              </a>
              <a
                href="#contributor-setup"
                className={`docs-toc-item ${activeHeadingId === "contributor-setup" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("contributor-setup"); }}
              >
                Become a Provider
              </a>
              <a
                href="#daemon-install"
                className={`docs-toc-item ${activeHeadingId === "daemon-install" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("daemon-install"); }}
              >
                Installing Daemon
              </a>
              <a
                href="#payouts"
                className={`docs-toc-item ${activeHeadingId === "payouts" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("payouts"); }}
              >
                Earnings &amp; Payouts
              </a>
              <a
                href="#mcp-setup"
                className={`docs-toc-item ${activeHeadingId === "mcp-setup" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("mcp-setup"); }}
              >
                Model Context Protocol
              </a>
              <a
                href="#claude-config"
                className={`docs-toc-item ${activeHeadingId === "claude-config" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("claude-config"); }}
              >
                Claude Desktop Config
              </a>
              <a
                href="#agent-loop"
                className={`docs-toc-item ${activeHeadingId === "agent-loop" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); scrollToAnchor("agent-loop"); }}
              >
                Autonomous Agent Loop
              </a>
            </div>
          )}

          {activeTab === "api" && (
            <div className="docs-toc-links">
              {apiToc
                .filter((h) => h.depth === 2)
                .map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`docs-toc-item ${activeHeadingId === h.id ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToAnchor(h.id);
                    }}
                  >
                    {h.text}
                  </a>
                ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
