import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { writeClipboard } from "../clipboard";
import { LandingFooter } from "./LandingFooter";
import { TendrilBrand, TendrilMark } from "./TendrilBrand";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#095D3B"/><g fill="#F4F1EA"><rect x="5" y="7" width="22" height="4"/><rect x="5" y="7" width="2" height="3"/><rect x="25" y="7" width="2" height="3"/><rect x="14" y="7" width="4" height="17"/><rect x="10" y="22" width="12" height="3"/></g></svg>`;
const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40"><text x="0" y="29" fill="#171815" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="-1.1">Tendril</text></svg>`;

type CopyTarget = "logo" | "wordmark";

function DownloadTrayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-download preview-icon"
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function BrandGuidelinesPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<CopyTarget | null>(null);

  const copyAsset = async (target: CopyTarget) => {
    if (await writeClipboard(target === "logo" ? LOGO_SVG : WORDMARK_SVG)) {
      setCopied(target);
      window.setTimeout(() => setCopied(null), 1800);
    }
  };

  return (
    <div className="landing-wrapper brand-guidelines-page">
      <header className="topbar brand-guidelines-topbar">
        <div className="topbar-inner wrap">
          <TendrilBrand href="/" />
          <div className="topbar-actions">
            <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark btn-sm">
              Explore Marketplace
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="wrap brand-guidelines-content">
          <header className="brand-guidelines-intro">
            <h1>Brand Guidelines</h1>
            <p>The core elements of the Tendril visual identity. Use these assets to represent us accurately across digital and physical media.</p>
          </header>

          <section className="brand-guidelines-section" aria-labelledby="logomark-heading">
            <div className="brand-guidelines-section-heading">
              <h2 id="logomark-heading">Logomark &amp; Wordmark</h2>
            </div>
            <div className="brand-asset-grid">
              <article className="brand-asset-card">
                <div className="brand-asset-art brand-asset-art--mark"><TendrilMark /></div>
                <div className="brand-asset-copy">
                  <h3>Primary Logomark</h3>
                  <p>Our standalone icon, used for avatars, favicons, and tight spaces.</p>
                  <button type="button" className="brand-copy-button" onClick={() => copyAsset("logo")}>
                    {copied === "logo" ? <CheckIcon /> : <DownloadTrayIcon />}
                    <span>{copied === "logo" ? "Copied!" : "Copy SVG"}</span>
                  </button>
                </div>
              </article>

              <article className="brand-asset-card">
                <div className="brand-asset-art brand-asset-art--wordmark"><span>Tendril</span></div>
                <div className="brand-asset-copy">
                  <h3>Wordmark</h3>
                  <p>The typographic treatment of our name. Best used alongside the logomark.</p>
                  <button type="button" className="brand-copy-button" onClick={() => copyAsset("wordmark")}>
                    {copied === "wordmark" ? <CheckIcon /> : <DownloadTrayIcon />}
                    <span>{copied === "wordmark" ? "Copied!" : "Copy SVG"}</span>
                  </button>
                </div>
              </article>
            </div>
          </section>

          <section className="brand-guidelines-section" aria-labelledby="palette-heading">
            <div className="brand-guidelines-section-heading">
              <h2 id="palette-heading">Color Palette</h2>
            </div>
            <div className="brand-color-grid">
              <div className="brand-color-swatch brand-color-swatch--lime" />
              <div className="brand-color-swatch brand-color-swatch--forest" />
              <div className="brand-color-swatch brand-color-swatch--foreground" />
              <div className="brand-color-swatch brand-color-swatch--background" />
              <div className="brand-color-label"><strong>Tendril Lime</strong><code>#84CC16</code></div>
              <div className="brand-color-label"><strong>Forest Green</strong><code>#095D3B</code></div>
              <div className="brand-color-label"><strong>Foreground</strong><code>#171815</code></div>
              <div className="brand-color-label"><strong>Background</strong><code>#FBFBF9</code></div>
            </div>
          </section>

          <section className="brand-guidelines-section" aria-labelledby="typography-heading">
            <div className="brand-guidelines-section-heading">
              <h2 id="typography-heading">Typography</h2>
            </div>
            <div className="brand-type-grid">
              <article>
                <span className="brand-type-label">PRIMARY SERIF</span>
                <h3 className="brand-type-serif">Newsreader</h3>
                <p>Used strictly for headings, display text, and pull quotes to give the brand an editorial, high-trust feel.</p>
              </article>
              <article>
                <span className="brand-type-label">PRIMARY SANS</span>
                <h3 className="brand-type-sans">Inter</h3>
                <p>Used for all body copy, UI elements, buttons, and navigation. Inter provides extreme legibility.</p>
              </article>
            </div>
          </section>

          <section className="brand-questions" aria-labelledby="questions-heading">
            <h2 id="questions-heading">Questions</h2>
            <p>Please <a href="mailto:hello@tendrilhq.com">contact us</a> if you need additional assets or have a question about using the Tendril brand.</p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
