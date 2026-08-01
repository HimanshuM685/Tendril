import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Marked } from "marked";
// The docs in /docs are the single source of truth — imported raw and rendered
// here, so this page cannot drift from the files that ship with the repo.
import apiMd from "../../../docs/api.md?raw";
import x402Md from "../../../docs/x402-api.md?raw";
import { REGISTRY_URL } from "../api";

type DocId = "api" | "x402";

const DOCS: { id: DocId; label: string; blurb: string; source: string }[] = [
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

/**
 * GitHub's heading-slug algorithm. The docs' own tables of contents are written
 * against it, so anything else here leaves every in-page link dead.
 */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The markdown is repo content compiled into the bundle, never user input, so
 * rendering it as HTML introduces no injection surface — there is no untrusted
 * author. Keep it that way: do not feed anything fetched at runtime through here.
 */
function render(markdown: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        const id = slugify(plain);
        // Only h2/h3 reach the sidebar — h1 is the title and h4+ is detail.
        if (depth === 2 || depth === 3) toc.push({ id, text: plain });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
      table(token) {
        // These tables are wide (status/error/meaning). Wrapped so they scroll
        // inside their own box rather than making the whole page scroll sideways.
        const html = this.constructor.prototype.table.call(this, token);
        return `<div class="table-wrap">${html}</div>`;
      },
    },
  });
  return { html: marked.parse(markdown) as string, toc };
}

export function ApiDocs() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState<DocId>("api");
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const doc = DOCS.find((d) => d.id === active)!;
  // Parsing ~30KB of markdown is not free; only redo it when the tab changes.
  const { html, toc } = useMemo(() => render(doc.source), [doc.source]);

  // Deep links (/api#get-explorer) and sidebar clicks both land here. The
  // content is injected by hand, so React Router cannot scroll to it for us.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, html]);

  // Anchors inside the rendered HTML are plain <a href="#…">, which would make
  // the router treat them as navigations. Intercept and scroll instead.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!href?.startsWith("#")) return;
      e.preventDefault();
      navigate(`/api${href}`, { replace: true });
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [navigate, html]);

  function copyBase() {
    void navigator.clipboard?.writeText(`export API=${REGISTRY_URL}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="page">
      <div className="section-head">
        <p className="kicker">// INTEGRATE</p>
        <h2 className="display section-title">API</h2>
      </div>
      <div className="rule"></div>

      <p className="muted">
        Tendril is an API first and a website second. Everything this app does, a script can do —
        the browser is just another x402 client with no privileged access.
      </p>

      {/* The examples all use $API, so hand the reader the exact value. */}
      <div className="topup" role="group" aria-label="API base URL">
        <span className="muted small">Base URL</span>
        <code className="ssh-code">{REGISTRY_URL}</code>
        <button className="btn ghost" onClick={copyBase}>
          {copied ? "Copied!" : "Copy export"}
        </button>
      </div>

      <div className="topup" role="tablist" aria-label="Documents">
        {DOCS.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={active === d.id}
            className={`btn ghost${active === d.id ? " active" : ""}`}
            onClick={() => setActive(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="muted small">{doc.blurb}</p>

      <div className="doc-layout">
        <nav className="doc-toc" aria-label="On this page">
          {toc.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/api#${h.id}`, { replace: true });
              }}
            >
              {h.text}
            </a>
          ))}
        </nav>

        <div
          ref={bodyRef}
          className="prose panel doc-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}
