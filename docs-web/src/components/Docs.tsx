import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { DOC_PAGES, renderDoc, resolveDocsLocation, type DocHeading } from "../lib/docs";
import { APP_ORIGIN, DOCS_ORIGIN, REGISTRY_URL } from "../lib/site";
import { ArchDiagram } from "./ArchDiagram";

// All content is repository-owned Markdown compiled into the Next.js client bundle, never runtime input.
const pages = DOC_PAGES.map((page) => ({ ...page, ...renderDoc(page) }));
const groups = [...new Set(pages.map((page) => page.group))];
const searchIndex = pages.flatMap((page) => [
  { title: page.title, category: page.group, href: page.path },
  ...page.toc.map((heading) => ({
    title: heading.text,
    category: `${page.group} / ${page.title}`,
    href: `${page.path}#${heading.id}`,
  })),
]);

function Toc({ headings, path, active, onSelect }: {
  headings: DocHeading[];
  path: string;
  active: string;
  onSelect?: () => void;
}) {
  return (
    <nav className="docs-toc-links" aria-label="Page subsections">
      {headings.map((heading) => (
        <Link key={heading.id} to={`${path}#${heading.id}`} onClick={onSelect}
          className={`docs-toc-item${heading.depth === 3 ? " docs-toc-subitem" : ""}${active === heading.id ? " active" : ""}`}
          aria-current={active === heading.id ? "location" : undefined}>
          {heading.text}
        </Link>
      ))}
    </nav>
  );
}

function FeatureCards({ build = false }: { build?: boolean }) {
  const cards = build ? [
    { title: "Agentic runtime", subtitle: "Autonomous loops", text: "Discover machines, execute code, and release compute from your agent.", href: "/docs/build#agent-loop", icon: "bolt" },
    { title: "Provider daemon", subtitle: "Share spare compute", text: "Turn a PC or server into a node with outbound bore tunnels.", href: "/docs/build#contributor-setup", icon: "box" },
    { title: "MCP integration", subtitle: "Model Context Protocol", text: "Connect Claude, Cursor, and other agent clients to execution sandboxes.", href: "/docs/build/mcp", icon: "globe" },
  ] : [
    { title: "Algorand", subtitle: "Settlement layer", text: "Deterministic finality, with payment fees sponsored by the facilitator.", href: "/docs/concepts/algorand-settlement", icon: "globe" },
    { title: "USDC with x402", subtitle: "Payments & credit", text: "USD-denominated settlement, idempotent deposits, and prepaid credit.", href: "/docs/concepts/usdc-with-x402", icon: "bolt" },
    { title: "Docker & bore", subtitle: "Sandboxes & tunnels", text: "Disposable Linux containers with outbound tunnels and instant teardown.", href: "/docs/concepts/sandboxes-bore-tunnels", icon: "box" },
  ];
  return (
    <div className="docs-feature-cards-grid">
      {cards.map((card) => (
        <Link className="docs-feature-card" to={card.href} key={card.title}>
          <svg className="dfc-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {card.icon === "bolt" ? <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> : card.icon === "box" ? <><path d="m12 2 9 5v10l-9 5-9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></> : <><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="4" ry="10" /><path d="M2 12h20" /></>}
          </svg>
          <span className="dfc-title">{card.title}</span>
          <span className="dfc-subtitle">{card.subtitle}</span>
          <span className="dfc-desc">{card.text}</span>
        </Link>
      ))}
    </div>
  );
}

export function Docs() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirect = resolveDocsLocation(location.pathname, location.search, location.hash);
  const page = pages.find((entry) => entry.path === location.pathname);
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [baseCopied, setBaseCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const mobileTocRef = useRef<HTMLDetailsElement>(null);
  const previousPath = useRef(location.pathname);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return searchIndex.filter((entry) => `${entry.title} ${entry.category}`.toLowerCase().includes(term)).slice(0, 12);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setNavOpen(false);
        setSearchOpen(false);
        if (mobileTocRef.current) mobileTocRef.current.open = false;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setNavOpen(false);
    setQuery("");
    setSearchOpen(false);
    setBaseCopied(false);
    setCopyStatus("");
    if (mobileTocRef.current) mobileTocRef.current.open = false;
  }, [location.pathname]);

  useEffect(() => {
    if (redirect) return;
    const title = page ? `${page.title} · Tendril Docs` : "Page not found · Tendril Docs";
    document.title = title;
    const canonical = `${DOCS_ORIGIN}${page?.path ?? "/"}`;
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    const description = page?.source.split("\n\n").find((text) => text && !text.startsWith("#"))?.replace(/[*`]/g, "") ?? "Browse Tendril documentation.";
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
  }, [page, redirect]);

  // Direct hash loads, TOC clicks, and browser history all use the same scroll path.
  useEffect(() => {
    if (redirect) return;
    const frame = requestAnimationFrame(() => {
      let id = "";
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* malformed fragment */ }
      const target = id ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "instant" });
        target.focus({ preventScroll: true });
        setActiveHeading(target.id);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
        setActiveHeading(page?.toc[0]?.id ?? "");
        if (previousPath.current !== location.pathname) document.getElementById("docs-page-title")?.focus({ preventScroll: true });
      }
      previousPath.current = location.pathname;
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key, page, redirect]);

  useEffect(() => {
    const headings = [...(contentRef.current?.querySelectorAll<HTMLElement>("h2[id], h3[id]") ?? [])];
    let frame = 0;
    const measure = () => {
      frame = 0;
      const readingLine = (document.querySelector(".docs-subnav-bar")?.getBoundingClientRect().bottom ?? 110) + 28;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > readingLine) break;
        current = heading;
      }
      setActiveHeading(current?.id ?? "");
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [page]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  async function copy(text: string, button?: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied to clipboard.");
      if (button) {
        button.textContent = "Copied!";
        button.setAttribute("aria-label", "Code copied");
      } else setBaseCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => {
        setBaseCopied(false);
        setCopyStatus("");
        contentRef.current?.querySelectorAll<HTMLButtonElement>("[data-copy-code]").forEach((entry) => {
          entry.textContent = "Copy";
          entry.setAttribute("aria-label", "Copy code");
        });
      }, 1800);
    } catch {
      setCopyStatus("Copy unavailable. Select the code and copy it manually.");
    }
  }

  function onContentClick(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("[data-copy-code]");
    if (button) {
      void copy(button.closest(".docs-code-block")?.querySelector("pre")?.textContent ?? "", button);
      return;
    }
    const anchor = target.closest("a");
    const href = anchor?.getAttribute("href");
    if (!href || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor?.target === "_blank") return;
    if (href.startsWith("#") || href === "/" || href === "/docs" || href.startsWith("/docs/")) {
      event.preventDefault();
      navigate(href.startsWith("#") ? `${location.pathname}${href}` : href);
    }
  }

  if (redirect) return <Navigate to={redirect} replace />;
  const pageIndex = pages.findIndex((entry) => entry === page);
  const parts = page?.html.split("<!-- architecture-diagram -->") ?? [];
  const showSearch = searchOpen && query.trim().length > 0;

  return (
    <div className="docs-page-wrapper">
      <a className="docs-skip-link" href="#docs-main">Skip to content</a>
      <header className="docs-top-header">
        <div className="docs-header-inner">
          <a className="docs-brand" href={APP_ORIGIN} aria-label="Tendril home">
            <img src="/favicon.svg" alt="" width="24" height="24" />
            <span className="docs-brand-text">Tendril</span>
          </a>
          <div className="docs-search-container" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchOpen(false);
          }}>
            <div className="docs-search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></svg>
              <input ref={searchRef} className="docs-search-input" placeholder="Search documentation…" aria-label="Search documentation"
                role="combobox" aria-autocomplete="list" aria-expanded={showSearch} aria-controls="docs-search-results"
                aria-activedescendant={showSearch && results[selectedResult] ? `docs-search-result-${selectedResult}` : undefined}
                value={query} onFocus={() => setSearchOpen(true)} onChange={(event) => { setQuery(event.target.value); setSelectedResult(0); setSearchOpen(true); }}
                onKeyDown={(event) => {
                  if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
                    event.preventDefault();
                    setSearchOpen(true);
                    setSelectedResult((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
                  } else if (event.key === "Enter" && showSearch && results[selectedResult]) {
                    event.preventDefault();
                    navigate(results[selectedResult].href);
                    setSearchOpen(false);
                    setQuery("");
                    searchRef.current?.blur();
                  }
                }} />
              <kbd className="docs-search-kbd">⌘ / Ctrl K</kbd>
            </div>
            {showSearch && <div id="docs-search-results" className="docs-search-dropdown" role="listbox" aria-label="Search results">
              {!results.length && <p className="docs-search-empty" role="status">No results for “{query}”.</p>}
              {results.map((result, index) => <Link key={result.href} id={`docs-search-result-${index}`} role="option" aria-selected={selectedResult === index}
                className="docs-search-item" to={result.href} onClick={() => { setSearchOpen(false); setQuery(""); }}>
                <span className="ds-item-title">{result.title}</span><span className="ds-item-cat">{result.category}</span>
              </Link>)}
            </div>}
          </div>
          <div className="docs-header-actions">
            <a className="docs-nav-link" href="https://github.com/HimanshuM685/Tendril" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="docs-launch-btn" href={`${APP_ORIGIN}/explore`}>Launch App <span aria-hidden="true">›</span></a>
          </div>
        </div>
      </header>
      <nav className="docs-subnav-bar" aria-label="Documentation areas">
        <div className="docs-subnav-inner">
          {([{ title: "Docs", path: "/", tab: "docs" }, { title: "Build", path: "/docs/build", tab: "build" }, { title: "API", path: "/docs/api", tab: "api" }] as const).map((tab) => (
            <Link key={tab.tab} to={tab.path} className={`docs-subnav-tab${page?.tab === tab.tab ? " active" : ""}`} aria-current={page?.tab === tab.tab ? "page" : undefined}>{tab.title}</Link>
          ))}
          <button className="docs-browse-btn" type="button" aria-expanded={navOpen} aria-controls="docs-sidebar" onClick={() => setNavOpen((open) => !open)}>{navOpen ? "Close menu" : "Browse docs"}</button>
        </div>
      </nav>
      <div className="docs-main-shell">
        <aside id="docs-sidebar" className="docs-sidebar-nav" data-open={navOpen} aria-label="Documentation navigation">
          <nav className="docs-nav-group-list" aria-label="Documentation pages">
            {groups.map((group) => <div className="docs-nav-group" key={group}>
              <div className="docs-nav-group-title">{group}</div>
              {pages.filter((entry) => entry.group === group).map((entry) => <Link key={entry.path} to={entry.path}
                className={`docs-nav-link-item${entry === page ? " active" : ""}`} aria-current={entry === page ? "page" : undefined} onClick={() => setNavOpen(false)}>{entry.title}</Link>)}
            </div>)}
          </nav>
        </aside>
        <main id="docs-main" className="docs-main-content" tabIndex={-1}>
          <article ref={contentRef} className="docs-article" onClick={onContentClick} key={location.pathname}>
            <p className="docs-eyebrow">{page?.group ?? "Documentation"}</p>
            <h1 id="docs-page-title" className="docs-title" tabIndex={-1}>{page?.title ?? "Page not found"}</h1>
            {page ? <>
              <details className="docs-mobile-toc" ref={mobileTocRef}>
                <summary>On this page</summary>
                <Toc headings={page.toc} path={page.path} active={activeHeading} onSelect={() => { if (mobileTocRef.current) mobileTocRef.current.open = false; }} />
              </details>
              {(page.path === "/" || page.path === "/docs/build") && <FeatureCards build={page.tab === "build"} />}
              {page.tab !== "docs" && <div className="docs-base-url-box" role="group" aria-label="API base URL">
                <div className="dbu-left"><span className="dbu-label">Base URL</span><code className="dbu-code">{REGISTRY_URL}</code></div>
                <button type="button" className="dbu-copy-btn" onClick={() => void copy(`export API=${REGISTRY_URL}`)}>{baseCopied ? "Copied!" : "Copy export API"}</button>
              </div>}
              <div className="docs-markdown-body" dangerouslySetInnerHTML={{ __html: parts[0] }} />
              {parts.length > 1 && <><div className="docs-arch-wrap"><ArchDiagram /></div><div className="docs-markdown-body" dangerouslySetInnerHTML={{ __html: parts.slice(1).join("") }} /></>}
              <nav className="docs-pagination" aria-label="Previous and next pages">
                {pageIndex > 0 ? <Link to={pages[pageIndex - 1].path}><span>Previous</span><strong>{pages[pageIndex - 1].title}</strong></Link> : <div />}
                {pageIndex < pages.length - 1 && <Link to={pages[pageIndex + 1].path}><span>Next</span><strong>{pages[pageIndex + 1].title}</strong></Link>}
              </nav>
            </> : <><p>This documentation page does not exist. Search above or choose a page from the navigation.</p><Link className="docs-launch-btn" to="/">Documentation home</Link></>}
          </article>
        </main>
        {page && <aside className="docs-toc-rail" aria-label="On this page"><div className="docs-toc-header">On this page</div><Toc headings={page.toc} path={page.path} active={activeHeading} /></aside>}
      </div>
      <p className="docs-copy-status" role="status" aria-live="polite">{copyStatus}</p>
    </div>
  );
}
