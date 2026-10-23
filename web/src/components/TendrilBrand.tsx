import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import { useNavigate } from "react-router-dom";
import { writeClipboard } from "../clipboard";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#095D3B"/><g fill="#F4F1EA"><rect x="5" y="7" width="22" height="4"/><rect x="5" y="7" width="2" height="3"/><rect x="25" y="7" width="2" height="3"/><rect x="14" y="7" width="4" height="17"/><rect x="10" y="22" width="12" height="3"/></g></svg>`;
const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40"><text x="0" y="29" fill="#171815" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="-1.1">Tendril</text></svg>`;

type CopyTarget = "logo" | "wordmark";

type TendrilBrandProps = {
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

function MenuIcon({ type }: { type: "image" | "type" | "book" }) {
  if (type === "image") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-image preview-icon"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    );
  }

  if (type === "type") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-type preview-icon"
        aria-hidden="true"
      >
        <path d="M12 4v16" />
        <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
        <path d="M9 20h6" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-book-open preview-icon"
      aria-hidden="true"
    >
      <path d="M12 5v16" />
      <path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z" />
    </svg>
  );
}

export function TendrilMark() {
  return (
    <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#095D3B" />
      <g fill="#F4F1EA">
        <rect x="5" y="7" width="22" height="4" />
        <rect x="5" y="7" width="2" height="3" />
        <rect x="25" y="7" width="2" height="3" />
        <rect x="14" y="7" width="4" height="17" />
        <rect x="10" y="22" width="12" height="3" />
      </g>
    </svg>
  );
}

export function TendrilBrand({ href = "#top", onClick }: TendrilBrandProps) {
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | "failed" | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!anchorRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const handleCopy = (target: CopyTarget) => async () => {
    const ok = await writeClipboard(target === "logo" ? LOGO_SVG : WORDMARK_SVG);
    setCopied(ok ? target : "failed");
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="brand-menu-anchor" ref={anchorRef}>
      <a
        href={href}
        className="brand"
        onClick={onClick}
        onContextMenu={(event) => {
          event.preventDefault();
          setCopied(null);
          setMenuOpen(true);
        }}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="brand-flower"><TendrilMark /></span>
        <span className="brand-text">Tendril</span>
      </a>

      {menuOpen && (
        <div className="brand-context-menu" role="menu" aria-label="Tendril brand menu">
          <button type="button" role="menuitem" onClick={handleCopy("logo")}>
            <MenuIcon type="image" />
            <span>{copied === "logo" ? "Copied!" : copied === "failed" ? "Copy failed" : "Copy Logo as SVG"}</span>
          </button>
          <button type="button" role="menuitem" onClick={handleCopy("wordmark")}>
            <MenuIcon type="type" />
            <span>{copied === "wordmark" ? "Copied!" : copied === "failed" ? "Copy failed" : "Copy Wordmark as SVG"}</span>
          </button>
          <div className="brand-context-divider" />
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/brand"); }}>
            <MenuIcon type="book" />
            <span>Brand Guidelines</span>
          </button>
        </div>
      )}
    </div>
  );
}
