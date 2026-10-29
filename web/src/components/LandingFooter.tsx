import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { docsUrl } from "../lib/docsLinks";
import { TendrilBrand } from "./TendrilBrand";

type LandingFooterProps = {
  onScrollToSection?: (id: string) => void;
};

export function LandingFooter({ onScrollToSection }: LandingFooterProps) {
  const navigate = useNavigate();

  const handleSectionLink = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onScrollToSection) return;
    event.preventDefault();
    onScrollToSection(id);
  };

  return (
    <footer className="site-footer">
      <div className="wrap footer-main-grid">
        <div className="footer-brand-col">
          <TendrilBrand onClick={(event) => handleSectionLink(event, "top")} />
          <p className="footer-tagline">
            A pay-per-call compute marketplace for individual contributors. Ephemeral sandboxes, metered in USDC over x402
            on Algorand.
          </p>
          <div className="footer-social-links">
            <a href="https://x.com/tendrilhq" target="_blank" rel="noopener" aria-label="X (formerly Twitter)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/tendrilcompute/" target="_blank" rel="noopener" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2a2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6M2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </g>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-nav-col">
          <h4 className="footer-nav-heading">MARKETPLACE</h4>
          <ul className="footer-link-list">
            <li><a href="/explore" onClick={(event) => { event.preventDefault(); navigate("/explore"); }}>Explore Nodes</a></li>
            <li><a href="#how-it-works" onClick={(event) => handleSectionLink(event, "how-it-works")}>How It Works</a></li>
            <li><a href="/contribute" onClick={(event) => { event.preventDefault(); navigate("/contribute"); }}>Contribute Compute</a></li>
            <li><a href={docsUrl("/docs/guides-access/one-shot-jobs")}>Run Script (/run)</a></li>
            <li><a href="#faq" onClick={(event) => handleSectionLink(event, "faq")}>FAQ</a></li>
          </ul>
        </div>

        <div className="footer-nav-col">
          <h4 className="footer-nav-heading">PROTOCOL</h4>
          <ul className="footer-link-list">
            <li><a href={docsUrl("/docs/api/x402")}>x402 Specification</a></li>
            <li><a href={docsUrl("/docs/concepts/algorand-settlement")}>Algorand Settlement</a></li>
            <li><a href={docsUrl("/docs/concepts/sandboxes-bore-tunnels")}>Bore Tunneling</a></li>
            <li><a href={docsUrl("/docs/guides-access/security-sandboxes")}>Docker Sandboxes</a></li>
          </ul>
        </div>

        <div className="footer-nav-col">
          <h4 className="footer-nav-heading">RESOURCES</h4>
          <ul className="footer-link-list">
            <li><a href="https://github.com/HimanshuM685/Tendril" target="_blank" rel="noopener">GitHub Repository</a></li>
            <li><a href={docsUrl("/docs/build#daemon-install")}>Contributor Daemon</a></li>
            <li><a href="/privacy" onClick={(event) => { event.preventDefault(); navigate("/privacy"); }}>Privacy Policy</a></li>
            <li><a href="/terms" onClick={(event) => { event.preventDefault(); navigate("/terms"); }}>Terms of Service</a></li>
            <li><a href="/refunds" onClick={(event) => { event.preventDefault(); navigate("/refunds"); }}>Refund Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="wrap footer-bottom-bar">
        <div className="footer-copyright">© 2026 Tendril Compute.</div>
      </div>

      <div className="footer-landscape-banner wrap">
        <img src="/assets/countryside-meadow-panorama.jpg" alt="Panoramic field painting with village and countryside" loading="lazy" />
      </div>
    </footer>
  );
}
