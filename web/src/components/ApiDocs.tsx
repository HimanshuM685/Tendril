import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Marked } from "marked";
// The docs in /docs are the single source of truth — imported raw and rendered
// here, so this page cannot drift from the files that ship with the repo.
import apiMd from "../../../docs/api.md?raw";
import x402Md from "../../../docs/x402-api.md?raw";
import mcpMd from "../../../docs/mcp.md?raw";
import { REGISTRY_URL } from "../api";

export type MdDocId = "api" | "x402" | "mcp";

/** One sidebar-worthy heading. `depth` mirrors the markdown level. */
type Heading = { id: string; text: string; depth: number };
/** h2 endpoint/topic with its h3 detail headings. */
type Section = Heading & { subs: Heading[] };
/** An `# h1` divider ("Endpoints", "Free / read") and the sections under it. */
type Group = { label: string | null; sections: Section[] };

const DOCS: { id: MdDocId; label: string; blurb: string; source: string }[] = [
  {
    id: "api",
    label: "HTTP",
    blurb: "The plain HTTP endpoints — discovery, sign-in, wallet, leases. Every one has a curl.",
    source: apiMd,
  },
  {
    id: "x402",
    label: "X402 (PAID)",
    blurb: "The endpoints that move money, and how to pay one from a terminal.",
    source: x402Md,
  },
  {
    id: "mcp",
    label: "MCP",
    blurb: "Stdio MCP tools for agents: compute, credit, contributor keys. Pays x402 for you.",
    source: mcpMd,
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
function render(markdown: string): { html: string; toc: Heading[] } {
  const toc: Heading[] = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, "");
        const id = slugify(plain);
        // h1 divides the doc into groups, h2 is a topic, h3 its detail; h4+ is
        // too fine to navigate by. The doc's own "Table of contents" is dropped
        // because the sidebar it would link to is this one.
        if (depth <= 3 && id !== "table-of-contents") toc.push({ id, text: plain, depth });
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

/**
 * Flat heading list → the two-level sidebar.
 *
 * Flat, every h3 in the document was on screen at once, which is how you end up
 * with "Query parameters", "Request body" and "200 OK" listed five times each
 * with nothing saying which endpoint any of them belongs to.
 */
function groupToc(toc: Heading[]): Group[] {
  // The leading h1 is the document title, not a divider.
  const rest = toc[0]?.depth === 1 ? toc.slice(1) : toc;
  // Sections before the first divider (or a doc with none) need a home.
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

function docsPath(docId: MdDocId, hash = ""): string {
  return `/docs?doc=${docId}${hash}`;
}

export function ApiDocs({ docId }: { docId: MdDocId }) {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [here, setHere] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  const doc = DOCS.find((d) => d.id === docId) ?? DOCS[0];
  // Parsing ~30KB of markdown is not free; only redo it when the tab changes.
  const { html, toc } = useMemo(() => render(doc.source), [doc.source]);
  const groups = useMemo(() => groupToc(toc), [toc]);

  // Which h2 to expand: the one you are reading, or the one owning the h3 you
  // are reading. Everything else stays collapsed.
  const openSection = useMemo(() => {
    for (const g of groups) {
      for (const s of g.sections) {
        if (s.id === here || s.subs.some((h) => h.id === here)) return s.id;
      }
    }
    return groups[0]?.sections[0]?.id ?? "";
  }, [groups, here]);

  // Deep links (/docs?doc=api#get-explorer) and sidebar clicks both land here. The
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
      navigate(docsPath(docId, href), { replace: true });
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [navigate, html, docId]);

  // Track the heading you are actually reading, so the sidebar shows where you
  // are instead of the same wall of links whatever the scroll position.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const heads = [...root.querySelectorAll<HTMLElement>("h1[id],h2[id],h3[id]")];
    let frame = 0;
    const measure = () => {
      frame = 0;
      // The last heading whose top has crossed the reading line near the top of
      // the viewport — the section whose body fills the screen right now.
      let current = heads[0];
      for (const h of heads) {
        if (h.getBoundingClientRect().top > 120) break;
        current = h;
      }
      setHere(current?.id ?? "");
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [html]);

  function copyBase() {
    void navigator.clipboard?.writeText(`export API=${REGISTRY_URL}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <>
      <p className="muted">{doc.blurb}</p>

      <div className="topup" role="group" aria-label="API base URL">
        <span className="muted small">Base URL</span>
        <code className="ssh-code">{REGISTRY_URL}</code>
        <button className="btn ghost" onClick={copyBase}>
          {copied ? "Copied!" : "Copy export"}
        </button>
      </div>

      <div className="doc-layout">
        <nav className="doc-toc" aria-label="On this page">
          <span className="toc-head">On this page</span>
          {groups.map((g, i) => (
            <div className="toc-group" key={g.label ?? `g${i}`}>
              {g.label && <span className="toc-group-label">{g.label}</span>}
              {g.sections.map((s) => (
                <div key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`toc-link${s.id === here ? " current" : ""}${
                      s.id === openSection ? " open" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(docsPath(docId, `#${s.id}`), { replace: true });
                    }}
                  >
                    {s.text}
                  </a>
                  {s.id === openSection &&
                    s.subs.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className={`toc-link toc-sub${h.id === here ? " current" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(docsPath(docId, `#${h.id}`), { replace: true });
                        }}
                      >
                        {h.text}
                      </a>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div
          ref={bodyRef}
          className="prose panel doc-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
}
