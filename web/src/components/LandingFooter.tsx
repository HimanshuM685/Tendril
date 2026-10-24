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
            <a href="https://github.com/HimanshuM685/Tendril" target="_blank" rel="noopener" aria-label="GitHub">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
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
            <li><a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate("/dashboard"); }}>Active Leases</a></li>
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
        <div className="footer-bottom-actions">
          <a href="/explore" onClick={(event) => { event.preventDefault(); navigate("/explore"); }}>Connect Wallet</a>
          <a href="/explore" className="footer-cta-link" onClick={(event) => { event.preventDefault(); navigate("/explore"); }}>Explore Nodes →</a>
        </div>
      </div>

      <div className="footer-landscape-banner wrap">
        <img src="/assets/countryside-meadow-panorama.jpg" alt="Panoramic field painting with village and countryside" loading="lazy" />
      </div>
    </footer>
  );
}
