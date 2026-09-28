import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../landing.css";

const SAMPLE_PROMPT =
  "How does Tendril work for decentralized pay-per-second compute? Compare Tendril with Akash and io.net for renting sandboxed GPU and CPU machines over x402 on Algorand.";

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });
  const [copyPromptText, setCopyPromptText] = useState("Copy prompt");
  const [showToast, setShowToast] = useState(false);
  const [searchStatus, setSearchStatus] = useState("Polling live nodes...");

  const scrollToSection = (id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleFaq = (index: number, isOpen: boolean) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: isOpen }));
  };

  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(SAMPLE_PROMPT);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = SAMPLE_PROMPT;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShowToast(true);
      setCopyPromptText("Copied!");
      setTimeout(() => setShowToast(false), 3200);
      setTimeout(() => setCopyPromptText("Copy prompt"), 2500);
    } catch (err) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleAiClick = (aiType: string) => {
    const encoded = encodeURIComponent(SAMPLE_PROMPT);
    let targetUrl = "";
    switch (aiType) {
      case "chatgpt":
        targetUrl = `https://chatgpt.com/?q=${encoded}`;
        break;
      case "claude":
        targetUrl = `https://claude.ai/new?q=${encoded}`;
        break;
      case "gemini":
        targetUrl = "https://gemini.google.com/app";
        break;
      case "perplexity":
        targetUrl = `https://www.perplexity.ai/search?q=${encoded}`;
        break;
      case "grok":
        targetUrl = `https://x.com/i/grok?text=${encoded}`;
        break;
    }
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const triggerSearchDemo = () => {
    setSearchStatus("Querying active compute nodes...");
    setTimeout(() => {
      setSearchStatus("Polling live nodes...");
    }, 2200);
  };

  return (
    <div className="landing-wrapper">
<header className="topbar">
    <div className="topbar-inner wrap">
      <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollToSection("top"); }}>
        <span className="brand-flower">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <rect width="32" height="32" fill="#0B5D3A" />
            <g fill="#F4F1EA">
              <rect x="5" y="7" width="22" height="4" />
              <rect x="5" y="7" width="2" height="3" />
              <rect x="25" y="7" width="2" height="3" />
              <rect x="14" y="7" width="4" height="17" />
              <rect x="10" y="22" width="12" height="3" />
            </g>
          </svg>
        </span>
        <span className="brand-text">Tendril</span>
      </a>

      <nav className="desktop-nav" aria-label="Main Navigation">
        <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>How it works</a>
        <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>FAQ</a>
        <a href="/docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }}>Docs</a>
        <a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }}>About</a>
      </nav>

      <div className="topbar-actions">
        <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark btn-sm">Explore Marketplace</button>
        <button className="menu-toggle" aria-label="Toggle navigation menu" id="menuToggle">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    {/*  Mobile Drawer  */}
    <div className="mobile-nav" id="mobileNav">
      <a href="#how-it-works">How it works</a>
      <a href="#faq">FAQ</a>
      <a href="#explore" className="btn btn-dark">Explore Marketplace</a>
    </div>
  </header>

  <main id="top">

    {/*  ================= 1. HERO SECTION =================  */}
    <section className="hero-section wrap">
      <div className="hero-grid">
        {/*  Left Hero Copy  */}
        <div className="hero-content">
          <h1 className="hero-title">
            Rent real compute.<br />
            Pay by the<br />
            exact second.
          </h1>
          <p className="hero-subtitle">
            Tendril turns personal PCs into sandboxed, high-performance compute nodes. Rent CPU, GPU, and RAM via
            metered SSH leases or run instant jobs over x402 on Algorand.
          </p>
          <div className="hero-cta-group">
            <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark btn-lg">
              Explore the marketplace
              <span className="btn-arrow">→</span>
            </button>
          </div>
          <div className="hero-perks">
            <span className="perk-item">
              <svg className="check-icon" viewBox="0 0 16 16" width="14" height="14" fill="none">
                <circle cx="8" cy="8" r="7" fill="#eaf3dc" />
                <path d="M5 8.2l2.2 2.2 4-4.4" stroke="#5b8c1a" strokeWidth="1.8" strokeLinecap="round"
                  strokeLinejoin="round" />
              </svg>
              No subscription or lock-in
            </span>
            <span className="perk-item">
              <svg className="check-icon" viewBox="0 0 16 16" width="14" height="14" fill="none">
                <circle cx="8" cy="8" r="7" fill="#eaf3dc" />
                <path d="M5 8.2l2.2 2.2 4-4.4" stroke="#5b8c1a" strokeWidth="1.8" strokeLinecap="round"
                  strokeLinejoin="round" />
              </svg>
              Zero ALGO needed (fees sponsored)
            </span>
          </div>
        </div>

        {/*  Right Hero Mockup with hills-smudge-art.jpg  */}
        <div className="hero-visual">
          <div className="hero-art-frame">
            <img  src="/assets/hills-smudge-art.jpg" alt="Painted green landscape" className="hero-art-img" />

            {/*  Floating Node Explorer Card  */}
            <div className="hero-floating-card">
              <div className="card-search-header">
                <div className="card-title-row">
                  <span className="card-badge-target">
                    <svg className="sparkle-icon" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                    LIVE COMPUTE REGISTRY
                  </span>
                  <span className="card-sub-label">ALGORAND MAINNET / TESTNET</span>
                </div>
                <div className="search-input-pill">
                  <span className="search-domain">RTX 4090 · 24 Cores · 64GB RAM</span>
                  <button type="button" className="search-pill-btn" aria-label="Search nodes" onClick={triggerSearchDemo}>
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                      <path fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="search-status-row">
                  <span className="extracting-pill">
                    <svg className="gear-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path
                        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
                      </path>
                    </svg>
                    {searchStatus}
                  </span>
                  <span className="search-action-btn" role="button" tabIndex={0} onClick={triggerSearchDemo}>Filter</span>
                </div>
              </div>

              <div className="card-results-section">
                <div className="results-header-bar">
                  <div>
                    <h4 className="results-heading">Available Nodes</h4>
                    <span className="results-sub">Total Online: 142 Sandboxed Machines</span>
                  </div>
                  <button type="button" className="btn-export-csv" onClick={() => navigate("/explore")}>Launch SSH</button>
                </div>

                <div className="matches-table">
                  <div className="table-header-row">
                    <span>NODE</span>
                    <span>HARDWARE SPECS</span>
                    <span>RATE / STATUS</span>
                  </div>

                  <div className="lead-row">
                    <div className="lead-meta">
                      <div className="lead-avatar av-1">US</div>
                      <div className="lead-info">
                        <strong>node-us-west-4090</strong>
                        <small>Ubuntu 22.04 · bore tunnel</small>
                      </div>
                    </div>
                    <div className="company-name">24C · 64GB · RTX 4090</div>
                    <div><span className="status-pill status-qualified">0.24 USDC/hr</span></div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-meta">
                      <div className="lead-avatar av-2">EU</div>
                      <div className="lead-info">
                        <strong>node-eu-a100-80g</strong>
                        <small>Debian 12 · PyTorch 2.4</small>
                      </div>
                    </div>
                    <div className="company-name">32C · 128GB · A100 80G</div>
                    <div><span className="status-pill status-qualified">0.78 USDC/hr</span></div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-meta">
                      <div className="lead-avatar av-3">AP</div>
                      <div className="lead-info">
                        <strong>node-ap-east-cpu</strong>
                        <small>Arch Linux · Baremetal</small>
                      </div>
                    </div>
                    <div className="company-name">16C · 32GB · Ryzen 9</div>
                    <div><span className="status-pill status-contacted">Leased</span></div>
                  </div>

                  <div className="lead-row">
                    <div className="lead-meta">
                      <div className="lead-avatar av-4">CA</div>
                      <div className="lead-info">
                        <strong>node-ca-central-4080</strong>
                        <small>Ubuntu 24.04 · CUDA 12</small>
                      </div>
                    </div>
                    <div className="company-name">16C · 64GB · RTX 4080</div>
                    <div><span className="status-pill status-qualified">0.18 USDC/hr</span></div>
                  </div>
                </div>
              </div>
            </div>
            {/*  End hero floating card  */}

          </div>
        </div>
      </div>
    </section>

    {/*  ================= FEATURED & TRUSTED BY =================  */}
    <section className="trusted-bar">
      <div className="wrap trusted-inner">
        <span className="trusted-label">ECOSYSTEM</span>
        <div className="trusted-logos">
          <div className="partner-logo">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M13.874 0h3.673l1.61 5.963h3.789l-2.588 4.5 3.624 13.533h-3.757l-2.44-9.077-5.247 9.079H8.345l8.107-14.051-1.304-4.878L4.215 24H.018Z" />
            </svg>
            <span>Algorand</span>
          </div>

          <div className="partner-logo">
            <svg viewBox="0 0 96 96" width="18" height="18" fill="currentColor">
              <path d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z" fillRule="evenodd" />
            </svg>
            <span>USDC with x402</span>
          </div>

          <div className="partner-logo">
            <svg viewBox="2 5 58 44" width="20" height="16" fill="currentColor">
              <path d="M52.62 7.75 L52.00 7.25 L51.38 7.25 L49.50 7.88 L48.25 8.62 L44.88 9.75 L41.38 11.50 L38.50 12.38 L38.25 12.62 L38.25 13.50 L38.50 13.88 L40.38 14.50 L40.75 15.00 L40.75 15.50 L38.88 17.88 L38.38 19.12 L36.88 21.38 L36.38 22.62 L35.88 23.25 L35.62 24.00 L34.88 24.88 L34.62 25.75 L34.12 26.50 L33.75 26.50 L33.50 26.25 L32.12 23.00 L31.50 22.38 L31.12 21.25 L29.50 18.62 L28.88 17.00 L28.38 16.38 L28.12 15.62 L27.62 15.12 L27.00 13.75 L26.00 12.50 L24.75 11.75 L22.25 11.50 L20.88 11.75 L19.38 12.88 L18.75 13.50 L18.38 14.38 L17.75 15.12 L17.50 16.25 L15.75 19.38 L15.50 20.50 L13.75 23.50 L13.62 24.38 L11.88 27.62 L11.75 28.25 L10.00 31.75 L9.88 32.38 L9.00 34.00 L9.00 34.38 L8.12 36.00 L7.88 36.88 L7.25 37.75 L6.88 39.12 L6.12 40.25 L5.00 43.25 L4.12 44.62 L3.38 46.62 L3.50 47.25 L9.00 47.50 L10.00 47.25 L10.50 46.50 L10.75 45.62 L11.62 44.50 L11.88 43.62 L12.75 42.00 L13.75 40.88 L14.25 40.62 L15.50 40.38 L19.12 40.38 L21.75 40.12 L24.38 39.62 L26.00 38.88 L27.00 38.88 L27.50 39.25 L27.62 40.00 L29.25 43.38 L31.25 46.62 L32.62 47.62 L33.38 47.75 L35.12 47.62 L36.12 47.00 L36.88 46.25 L40.00 40.50 L42.75 36.12 L44.12 33.25 L44.50 32.88 L45.00 32.75 L45.50 33.25 L45.88 34.75 L46.75 36.12 L52.38 47.38 L53.38 47.88 L59.75 47.62 L59.88 46.88 L59.25 45.88 L58.75 44.12 L58.00 43.00 L56.88 40.12 L56.12 39.00 L54.88 35.88 L54.25 35.00 L53.88 33.75 L53.12 32.62 L53.00 32.00 L52.25 30.75 L51.12 28.00 L50.12 26.38 L49.00 25.25 L49.38 24.00 L49.75 23.62 L50.88 21.38 L51.38 20.88 L52.00 20.88 L53.38 21.75 L54.00 21.75 L54.38 21.38 L54.00 16.88 L53.12 12.00 L53.00 8.75 Z M30.12 36.50 L30.88 36.38 L31.25 36.75 L31.38 37.50 L32.25 39.38 L32.88 40.12 L33.38 41.38 L34.00 42.25 L34.25 43.12 L35.12 44.38 L35.00 45.12 L34.25 45.62 L33.50 45.62 L33.00 45.25 L32.25 44.25 L31.62 42.88 L31.00 42.00 L30.62 40.88 L30.12 40.38 L29.62 39.38 L28.50 38.62 L28.75 37.75 Z M25.12 35.62 L25.25 36.50 L24.88 36.88 L23.25 37.50 L20.12 38.12 L15.75 38.25 L13.00 39.12 L11.12 41.00 L10.62 42.25 L10.25 42.62 L9.75 44.25 L8.75 45.62 L7.00 46.00 L6.38 46.00 L5.88 45.62 L6.00 44.62 L7.00 42.62 L7.62 41.88 L7.88 41.00 L8.50 40.12 L8.62 39.62 L9.62 38.12 L10.75 37.12 L13.62 36.25 L21.88 35.75 L22.50 35.50 L23.50 34.50 L24.38 34.88 Z M47.38 27.75 L47.75 27.75 L48.12 28.12 L48.88 30.12 L49.62 31.25 L49.88 32.25 L50.62 33.38 L52.12 36.62 L53.88 39.62 L54.00 40.25 L55.25 42.75 L56.00 43.88 L56.38 45.25 L55.88 45.75 L54.50 45.62 L53.75 45.00 L52.88 42.88 L52.38 42.25 L51.88 40.88 L51.12 39.62 L50.88 38.62 L50.12 37.50 L50.00 36.75 L49.12 35.38 L48.75 34.12 L48.00 32.62 L46.38 30.38 L46.38 29.50 Z M20.62 27.62 L21.12 28.12 L21.25 28.88 L22.38 31.12 L22.88 31.75 L23.12 32.75 L22.75 33.25 L21.00 33.12 L18.12 33.50 L17.75 33.12 L17.75 32.50 L18.88 30.62 L19.75 28.38 L20.25 27.75 Z M22.75 22.88 L23.12 22.88 L23.62 23.38 L24.12 24.75 L24.50 25.12 L25.25 26.88 L25.62 27.25 L27.12 30.25 L27.88 31.25 L28.25 32.12 L29.12 33.12 L29.00 34.00 L28.12 34.88 L27.38 35.00 L27.00 34.62 L26.88 33.88 L26.12 32.62 L25.88 31.75 L25.12 30.62 L25.00 30.00 L24.38 29.25 L24.00 28.12 L23.38 27.38 L22.88 26.25 L22.00 25.50 L21.88 25.12 L22.00 24.00 L22.25 23.38 Z M23.88 14.88 L24.62 15.62 L26.00 18.62 L26.62 19.38 L28.12 22.50 L29.62 24.88 L30.00 25.88 L30.62 26.62 L31.00 27.75 L32.12 29.12 L32.25 29.75 L31.75 31.12 L31.25 31.62 L30.88 31.62 L30.50 31.25 L30.12 29.88 L28.88 27.38 L28.50 27.00 L27.88 25.38 L27.38 24.88 L26.88 23.50 L25.38 21.25 L25.12 20.25 L24.50 19.38 L24.00 18.00 L23.12 17.12 L22.38 17.12 L21.88 17.50 L21.50 18.75 L20.88 19.62 L20.25 21.25 L19.88 21.62 L19.62 22.75 L18.38 25.25 L17.88 25.88 L17.50 27.38 L17.12 27.75 L16.62 29.12 L16.00 30.00 L15.75 31.12 L14.88 32.62 L14.75 33.25 L14.25 33.75 L13.12 34.25 L11.75 35.25 L11.50 34.75 L12.12 32.88 L13.75 30.12 L14.00 29.25 L15.75 26.25 L16.38 24.75 L16.75 24.38 L17.25 22.88 L17.75 22.25 L18.12 21.25 L18.75 20.50 L19.25 18.88 L19.75 18.25 L21.12 15.38 L22.25 14.50 L23.12 14.50 Z M50.38 13.25 L50.75 13.62 L51.00 16.88 L50.50 17.38 L49.88 17.50 L48.88 19.00 L48.38 20.25 L47.88 20.75 L47.50 21.75 L46.88 22.50 L46.38 23.88 L45.00 26.00 L44.62 27.12 L44.00 27.88 L43.50 29.12 L43.00 29.62 L42.38 31.25 L42.00 31.62 L41.50 32.88 L41.00 33.38 L39.62 36.38 L39.00 37.12 L38.75 38.00 L38.00 39.00 L37.12 41.00 L36.38 41.62 L35.38 40.25 L35.25 39.38 L36.62 37.25 L38.12 34.38 L38.75 33.62 L40.25 30.75 L40.88 30.00 L42.12 27.38 L42.75 26.62 L43.12 25.62 L43.75 24.88 L45.12 22.12 L46.00 21.00 L46.50 19.75 L47.75 17.75 L48.38 16.38 L48.75 16.00 L49.50 14.38 Z M47.38 12.12 L47.62 12.38 L47.50 12.88 L45.88 15.00 L45.38 16.12 L44.88 16.62 L44.50 17.75 L43.88 18.50 L43.50 19.50 L42.75 20.50 L42.50 21.38 L41.00 23.62 L40.50 25.00 L38.88 27.50 L38.62 28.38 L38.00 29.12 L37.50 30.38 L37.00 31.00 L34.62 35.75 L33.75 36.50 L33.25 36.25 L32.25 35.25 L32.25 34.62 L34.88 31.12 L37.38 26.50 L37.75 26.12 L38.12 25.12 L39.75 22.62 L40.25 21.38 L42.00 18.75 L43.38 15.88 L44.00 15.25 L44.12 13.62 L44.75 13.12 L45.38 13.00 L47.00 12.12 Z" fill="currentColor" fillRule="evenodd" />
            </svg>
            <span>AgentMesh</span>
          </div>

          <div className="partner-logo">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
            </svg>
            <span className="font-bold">Bore SSH Tunnels</span>
          </div>

          <div className="partner-logo">
            <svg viewBox="0 0 400 447" width="18" height="18" fill="currentColor">
              <path d="M178 290 L172 295 L169 301 L167 311 L167 342 L172 371 L181 400 L194 426 L206 439 L210 441 L215 441 L221 436 L226 421 L226 389 L222 364 L215 339 L201 308 L191 295 L183 290 Z M248 274 L251 283 L261 293 L270 299 L294 311 L317 319 L350 326 L375 327 L387 325 L397 318 L398 314 L396 308 L382 294 L354 279 L325 269 L294 263 L273 262 L257 265 L253 267 Z M122 244 L117 240 L106 240 L99 242 L81 251 L57 269 L37 289 L22 309 L13 328 L13 341 L19 346 L30 346 L39 343 L53 336 L81 315 L102 293 L116 273 L123 256 Z M0 123 L0 128 L3 134 L17 147 L39 159 L64 168 L100 175 L121 175 L136 170 L141 163 L136 151 L120 138 L96 126 L68 117 L46 113 L24 112 L9 115 L5 117 Z M378 95 L367 89 L355 86 L342 86 L331 88 L322 91 L303 101 L282 120 L272 134 L265 148 L260 169 L260 181 L263 193 L269 204 L276 211 L289 218 L299 220 L313 220 L323 218 L348 207 L359 199 L372 186 L386 165 L392 149 L394 138 L394 125 L391 113 L385 102 Z M183 0 L176 7 L172 21 L172 52 L178 83 L187 109 L198 129 L210 141 L219 142 L226 135 L230 120 L230 93 L225 64 L215 34 L205 15 L194 3 L188 0 Z" />
            </svg>
            <span>Pera Wallet</span>
          </div>

          <div className="partner-logo">
            <svg viewBox="80 80 287 270" width="18" height="18" fill="currentColor">
              <path d="M96 313 L223 240 L351 313 L224 98 Z M121 335 L224 301 L326 335 L224 281 Z" />
            </svg>
            <span>Defly Wallet</span>
          </div>
        </div>
      </div>
    </section>

    {/*  ================= 2. THREE STEPS (painting1, painting2, painting3) =================  */}
    <section className="steps-section wrap" id="how-it-works">
      <div className="section-title-center">
        <span className="section-eyebrow">HOW IT WORKS</span>
        <h2 className="serif-title">Three steps between you and raw compute.</h2>
      </div>

      <div className="steps-grid">
        {/*  Step 1: painting1.jpg  */}
        <article className="step-card">
          <div className="step-card-media">
            <img  src="/assets/painting1.jpg" alt="Cozy painted cottage with lush garden" loading="lazy" />
          </div>
          <div className="step-card-content">
            <h3 className="step-title">Connect &amp; Top Up USDC</h3>
            <p className="step-desc">Connect Pera, Lute, Defly or sign in with Google. Deposit USDC once with zero ALGO
              network fees required.</p>
          </div>
        </article>

        {/*  Step 2: painting2.jpg  */}
        <article className="step-card">
          <div className="step-card-media">
            <img  src="/assets/painting2.jpg" alt="Vibrant landscape with rolling greens" loading="lazy" />
          </div>
          <div className="step-card-content">
            <h3 className="step-title">Pick Node or Run Script</h3>
            <p className="step-desc">Select an idle GPU/CPU machine from the registry or throw Python code at POST /x402/run
              for instant execution.</p>
          </div>
        </article>

        {/*  Step 3: painting3.jpg  */}
        <article className="step-card">
          <div className="step-card-media">
            <img  src="/assets/painting3.jpg" alt="Scenic mountain valley in paint texture" loading="lazy" />
          </div>
          <div className="step-card-content">
            <h3 className="step-title">SSH In &amp; Pay by Second</h3>
            <p className="step-desc">Get an instant copyable SSH command. Metered continuously against your credit and
              billed only when released.</p>
          </div>
        </article>
      </div>
    </section>

    {/*  ================= 3. DASHBOARD SHOWCASE (field-paint.jpg) & 6 FEATURES =================  */}
    <section className="platform-section wrap" id="explore">
      <div className="section-title-center">
        <span className="section-eyebrow">A COMPLETE DECENTRALIZED PLATFORM</span>
        <h2 className="serif-title">Everything you need to rent or provide compute.</h2>
        <div className="section-cta-row">
          <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark">Explore live nodes</button>
        </div>
      </div>

      {/*  App Backdrop with field-paint.jpg  */}
      <div className="app-stage-wrapper">
        <div className="app-stage-backdrop">
          <img  src="/assets/field-paint.jpg" alt="Painted green landscape meadow" className="stage-bg-img" loading="lazy" />
        </div>

        {/*  Realistic Web App Dashboard Mockup  */}
        <div className="app-dashboard-window">
          {/*  Sidebar  */}
          <aside className="app-sidebar">
            <div className="sidebar-brand">
              <span className="brand-flower-sm">
                <svg viewBox="0 0 32 32" width="16" height="16">
                  <rect width="32" height="32" fill="#0B5D3A" />
                  <g fill="#F4F1EA">
                    <rect x="5" y="7" width="22" height="4" />
                    <rect x="5" y="7" width="2" height="3" />
                    <rect x="25" y="7" width="2" height="3" />
                    <rect x="14" y="7" width="4" height="17" />
                    <rect x="10" y="22" width="12" height="3" />
                  </g>
                </svg>
              </span>
              <span className="sidebar-brand-name">Tendril</span>
            </div>

            <nav className="sidebar-menu">
              <a href="#explore" onClick={(e) => { e.preventDefault(); navigate("/explore"); }} className="sidebar-item active">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <path
                    d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Explore</span>
              </a>
              <a href="#leases" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="sidebar-item">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <path
                    d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                <span>Active Leases</span>
              </a>
              <a href="#contribute" onClick={(e) => { e.preventDefault(); navigate("/contribute"); }} className="sidebar-item">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd" />
                </svg>
                <span>Contribute</span>
              </a>
              <a href="#keys" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="sidebar-item">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <path fillRule="evenodd"
                    d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                    clipRule="evenodd" />
                </svg>
                <span>API Keys</span>
              </a>
            </nav>

            <div className="sidebar-usage-box">
              <span className="usage-title">PREPAID BALANCE</span>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: "49%" }}></div>
              </div>
              <div className="usage-stats">
                <span>24.50 USDC</span>
                <span>Funds ~102h</span>
              </div>
            </div>

            <div className="sidebar-footer-links">
              <a href="#mcp" onClick={(e) => { e.preventDefault(); navigate("/docs"); }} className="sf-item">
                <span className="sf-icon">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <span>Connect MCP</span>
              </a>
              <a href="#docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }} className="sf-item">
                <span className="sf-icon">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </span>
                <span>CLI &amp; Docs</span>
              </a>
            </div>

            <div className="sidebar-user">
              <div className="user-avatar">AL</div>
              <div className="user-info">
                <strong>0x7F2...3B9</strong>
                <small>Mainnet Wallet</small>
              </div>
            </div>
          </aside>

          {/*  Main App Area  */}
          <div className="app-main-content">
            {/*  App Topbar  */}
            <div className="app-header-row">
              <div>
                <h3 className="app-greeting">Good afternoon, Alex!</h3>
                <p className="app-greeting-sub">Here's your live compute fleet and balance at a glance.</p>
              </div>
              <div className="app-header-controls">
                <span className="pill-badge pill-green">
                  <span className="indicator-dot"></span>
                  Registry Online
                </span>
              </div>
            </div>

            {/*  4 Metric Cards  */}
            <div className="app-metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Credit Balance</span>
                <b className="metric-value">24.50</b>
                <span className="metric-delta">USDC available</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Online Nodes</span>
                <b className="metric-value">142</b>
                <span className="metric-delta">18 global regions</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Metered Runtime</span>
                <b className="metric-value">3h 42m</b>
                <span className="metric-delta delta-up">Billed to exact second</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Contributor Earnings</span>
                <b className="metric-value">148.80</b>
                <span className="metric-delta">USDC ready to withdraw</span>
              </div>
            </div>

            {/*  Quick Actions  */}
            <div className="quick-actions-bar">
              <span className="qa-title">Compute Actions</span>
              <div className="qa-buttons">
                <button type="button" className="qa-btn" onClick={() => navigate("/explore")}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Explore Nodes
                </button>
                <button className="qa-btn">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Mint Contributor Key
                </button>
                <button type="button" className="qa-btn qa-btn-accent" onClick={() => navigate("/explore")}>+ Top Up USDC</button>
              </div>
            </div>

            {/*  Two App Columns: Active Leases & Live Hardware Marketplace  */}
            <div className="app-panels-grid">
              {/*  Left: Active & Recent Leases  */}
              <div className="app-panel">
                <div className="panel-header">
                  <div>
                    <strong>Active &amp; Recent Leases</strong>
                    <small>2 active metered sessions</small>
                  </div>
                  <a href="#leases" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} className="panel-link">View all leases →</a>
                </div>
                <div className="panel-list">
                  <div className="panel-list-item">
                    <div className="item-dot dot-active"></div>
                    <div className="item-details">
                      <strong>node-us-west-4090</strong>
                      <span>ssh root@tunnel.tendril.work -p 22419 · 0.24 USDC/hr</span>
                    </div>
                    <span className="match-score">Running</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-dot dot-active"></div>
                    <div className="item-details">
                      <strong>node-eu-a100-80g</strong>
                      <span>ssh root@tunnel.tendril.work -p 22894 · 0.78 USDC/hr</span>
                    </div>
                    <span className="match-score">Running</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-dot"></div>
                    <div className="item-details">
                      <strong>POST /x402/run job #8412</strong>
                      <span>Python 3.11 script · matrix_mult.py · 14.2s runtime</span>
                    </div>
                    <span className="match-score">0.02 USDC</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-dot"></div>
                    <div className="item-details">
                      <strong>node-ca-rtx4080</strong>
                      <span>Session closed · 1h 14m · released cleanly</span>
                    </div>
                    <span className="match-score">0.22 USDC</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-dot"></div>
                    <div className="item-details">
                      <strong>node-ap-ryzen9</strong>
                      <span>Session closed · 48m · released cleanly</span>
                    </div>
                    <span className="match-score">0.06 USDC</span>
                  </div>
                </div>
              </div>

              {/*  Right: Live Hardware Marketplace  */}
              <div className="app-panel">
                <div className="panel-header">
                  <div>
                    <strong>Live Hardware Pool</strong>
                    <small>Scored by (cores + RAM/4) / price</small>
                  </div>
                  <a href="#nodes" onClick={(e) => { e.preventDefault(); navigate("/explore"); }} className="panel-link">View all 142 nodes →</a>
                </div>
                <div className="panel-list">
                  <div className="panel-list-item">
                    <div className="item-avatar-icon">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    </div>
                    <div className="item-details">
                      <strong>NVIDIA RTX 4090 · 24GB VRAM</strong>
                      <span>24 Cores · 64GB DDR5 · San Jose, CA</span>
                    </div>
                    <span className="status-pill status-qualified">Available</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-avatar-icon">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path
                          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
                        </path>
                      </svg>
                    </div>
                    <div className="item-details">
                      <strong>NVIDIA A100 · 80GB SXM4</strong>
                      <span>32 Cores · 128GB RAM · Frankfurt, DE</span>
                    </div>
                    <span className="status-pill status-qualified">Available</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-avatar-icon">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div className="item-details">
                      <strong>AMD Ryzen 9 7950X</strong>
                      <span>16 Cores · 64GB DDR5 · Toronto, CA</span>
                    </div>
                    <span className="status-pill status-qualified">Available</span>
                  </div>
                  <div className="panel-list-item">
                    <div className="item-avatar-icon">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                    </div>
                    <div className="item-details">
                      <strong>Apple M3 Max · 36GB Unified</strong>
                      <span>14 Cores · Metal Compute · London, UK</span>
                    </div>
                    <span className="status-pill status-contacted">In Use</span>
                  </div>
                </div>
              </div>
            </div>
            {/*  End app panels grid  */}

          </div>
        </div>
        {/*  End app dashboard window  */}
      </div>

      {/*  6 Feature Cards Below Mockup  */}
      <div className="features-six-grid">
        {/*  1. Per-Second Metering  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-blue">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="feature-card-title">Per-Second Metering</h3>
          <p className="feature-card-desc">No multi-hour minimums or unneeded blocks. Pay strictly for the exact seconds
            your SSH lease runs.</p>
          <a href="#how-it-works" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>

        {/*  2. Ephemeral Docker Sandboxes  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-blue-subtle">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <h3 className="feature-card-title">Ephemeral Sandboxes</h3>
          <p className="feature-card-desc">Hardened Docker containers with dropped capabilities, cgroups caps, and no host
            filesystem mounts.</p>
          <a href="#how-it-works" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>

        {/*  3. x402 Native Protocol  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-purple">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h3 className="feature-card-title">x402 Protocol on Algorand</h3>
          <p className="feature-card-desc">HTTP 402 responses name an exact price in USDC. Facilitator-sponsored fees mean
            zero ALGO is needed.</p>
          <a href="#how-it-works" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>

        {/*  4. Direct Bore Tunnels  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-coral">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
          </div>
          <h3 className="feature-card-title">Encrypted Bore Tunnels</h3>
          <p className="feature-card-desc">SSH connects dial out directly from sandboxes. Contributors never open ports on
            their local firewalls.</p>
          <a href="#how-it-works" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>

        {/*  5. Instant Script Runs  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-orange">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h3 className="feature-card-title">One-Shot Script Execution</h3>
          <p className="feature-card-desc">Skip renting. Throw Python code at POST /x402/run to execute on the highest-value
            idle node instantly.</p>
          <a href="#how-it-works" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>

        {/*  6. Zero-Risk Hardware Sharing  */}
        <article className="feature-card">
          <div className="feature-icon-bubble icon-green">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 className="feature-card-title">Safe Hardware Earning</h3>
          <p className="feature-card-desc">Contribute idle GPU/CPU cycles with lightweight daemons and API keys. Withdraw
            USDC directly on-chain.</p>
          <a href="#contribute" className="feature-link">Learn more <span className="arrow">→</span></a>
        </article>
      </div>
    </section>

    {/*  ================= 4. BUILT ON ACCURACY / TRUST (field-paint.jpg & hills-smudge-art.jpg) =================  */}
    <section className="accuracy-section wrap" id="contribute">
      <div className="section-title-center">
        <span className="section-eyebrow">WHY TENDRIL</span>
        <h2 className="serif-title">Built on trust, not centralized clouds.</h2>
        <p className="section-subtitle-max">Big clouds charge heavy markups and lock you into monthly plans. Tendril
          connects you directly to bare-metal individual compute.</p>
      </div>

      <div className="comparison-dual-grid">
        {/*  Card 1: field-paint.jpg  */}
        <div className="comparison-card">
          <div className="comparison-visual-frame">
            <img  src="/assets/field-paint.jpg" alt="Painted green landscape" className="comparison-bg-art" loading="lazy" />
            <div className="comparison-ui-overlay">
              <div className="filter-checklist">
                <div className="check-pill">
                  <span className="check-mark">
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 7 5.5 10 11.5 4" />
                    </svg>
                  </span>
                  <span>Ephemeral Docker</span>
                </div>
                <div className="check-pill">
                  <span className="check-mark">
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 7 5.5 10 11.5 4" />
                    </svg>
                  </span>
                  <span>No Host Mounts</span>
                </div>
                <div className="check-pill">
                  <span className="check-mark">
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 7 5.5 10 11.5 4" />
                    </svg>
                  </span>
                  <span>Dropped Capabilities</span>
                </div>
                <div className="check-pill">
                  <span className="check-mark">
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 7 5.5 10 11.5 4" />
                    </svg>
                  </span>
                  <span>Hard cgroup caps</span>
                </div>
              </div>

              <div className="sample-lead-rows">
                <div className="sample-lead-item">
                  <span className="sample-name">Isolated Sandbox</span>
                  <span className="match-badge match-high">
                    Secure Sandbox
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2.5 7 5.5 10 11.5 4" />
                    </svg>
                  </span>
                </div>
                <div className="sample-lead-item">
                  <span className="sample-name">Host Filesystem</span>
                  <span className="match-badge match-low">
                    Access Denied
                    <svg viewBox="0 0 14 14" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="3" x2="11" y2="11" />
                      <line x1="11" y1="3" x2="3" y2="11" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="comparison-content">
            <div className="comparison-title-row">
              <span className="comparison-icon">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </span>
              <h3 className="comparison-heading">Isolated, not exposed</h3>
            </div>
            <p className="comparison-desc">
              Contributors share isolated compute capacity without ever exposing host filesystems, network interfaces,
              or sensitive personal data.
            </p>
          </div>
        </div>

        {/*  Card 2: hills-smudge-art.jpg  */}
        <div className="comparison-card">
          <div className="comparison-visual-frame">
            <img  src="/assets/hills-smudge-art.jpg" alt="Painted mountain slopes" className="comparison-bg-art"
              loading="lazy" />
            <div className="comparison-ui-overlay">
              <div className="sync-status-bar">
                <span className="pulse-indicator"></span>
                <span className="sync-text">METERING ACTIVE...</span>
                <span className="sync-timestamp">SYNCED BY SECOND</span>
              </div>

              <div className="sample-lead-rows">
                <div className="sample-lead-item">
                  <span className="sample-name">node-us-west-4090</span>
                  <span className="sync-badge syncing">Lease Active</span>
                </div>
                <div className="sample-lead-item">
                  <span className="sample-name">Gate Fee: 0.01 USDC</span>
                  <span className="sync-badge ready">Settled</span>
                </div>
                <div className="sample-lead-item">
                  <span className="sample-name">Watchdog Guard</span>
                  <span className="sync-badge ready">Armed</span>
                </div>
                <div className="sample-lead-item">
                  <span className="sample-name">On-Chain Payout</span>
                  <span className="sync-badge ready">Ready</span>
                </div>
              </div>
            </div>
          </div>
          <div className="comparison-content">
            <div className="comparison-title-row">
              <span className="comparison-icon">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <h3 className="comparison-heading">Pay-as-you-use, not pre-committed</h3>
            </div>
            <p className="comparison-desc">
              Your prepaid balance ticks down by the second. If credit runs out mid-session, a grace window lets you
              save work before clean teardown.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/*  ================= 5. DARK AI-NATIVE MCP SECTION (PRESERVED AS REQUESTED) =================  */}
    <section className="mcp-section">
      <div className="wrap mcp-container">
        <div className="mcp-intro">
          <span className="mcp-eyebrow">AI-NATIVE</span>
          <h2 className="mcp-title">Built for humans and agents.</h2>
          <p className="mcp-desc">
            You can connect Tendril MCP with Claude, ChatGPT or any AI agent of your choice. Use plain English to
            trigger actions like finding verified leads, analyzing ICP data, and pushing them to your CRM. No complex
            API integrations.
          </p>
          <div className="mcp-cta-row">
            <button type="button" onClick={() => navigate("/explore")} className="btn btn-white">Start free trial</button>
          </div>
        </div>

        {/*  MCP Chat Card Mockup  */}
        <div className="mcp-card-mockup">
          <div className="mcp-card-topbar">
            <span className="mcp-tag">
              <svg className="sparkle-icon" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              Tendril MCP
            </span>
          </div>

          <div className="mcp-card-body">
            <h3 className="mcp-greeting">
              <svg className="sparkle-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
              Good evening
            </h3>

            <div className="mcp-prompt-bar">
              <input  type="text" className="mcp-input" value="Find me 100 founders in AI developer tools!" readOnly />
              <div className="mcp-model-selector">
                <span className="model-name">Claude Opus 4.5</span>
                <span className="selector-chevron">▾</span>
              </div>
              <button className="mcp-send-btn" aria-label="Submit prompt">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <path fillRule="evenodd"
                    d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="mcp-quick-tags">
              <button className="mcp-tag-pill">+ Create</button>
              <button className="mcp-tag-pill">&lt;&gt; Code</button>
              <button className="mcp-tag-pill">Learn</button>
              <button className="mcp-tag-pill">Write</button>
              <button className="mcp-tag-pill">Life stuff</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/*  ================= 6. TESTIMONIAL & RELATABLE CTA =================  */}
    <section className="testimonial-section wrap">
      <blockquote className="founder-quote">
        “Every cloud platform out there was expensive, rigid, and bureaucratically bloated. Tendril lets our autonomous
        agents spin up isolated GPU sandboxes and pay in seconds over x402 with zero hassle.”
      </blockquote>

      <div className="founder-profile">
        <div className="founder-avatar-frame">
          <div className="founder-avatar-img">
            <span>A</span>
          </div>
        </div>
        <div className="founder-meta">
          <strong className="founder-name">Alex S.</strong>
          <span className="founder-title">Core Contributor, Tendril</span>
        </div>
      </div>

      <div className="relatable-box">
        <p className="relatable-text">Need bare-metal compute for your next model or agent?</p>
        <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark">
          Explore the marketplace
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </section>

    {/*  NOTE: "Simple, transparent pricing" section is EXCLUDED as requested  */}

    {/*  ================= 7. COMMON QUESTIONS (FAQ) =================  */}
    <section className="faq-section" id="faq">
      <div className="wrap faq-layout">
        <div className="faq-header">
          <span className="section-eyebrow">FAQ</span>
          <h2 className="serif-title">Common questions</h2>
        </div>

        <div className="faq-accordion-list">
          {/*  Q1 (Open by default)  */}
          <details className="faq-item" open={openFaqs[0]} onToggle={(e) => handleToggleFaq(0, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>What is Tendril, exactly?</span>
              <span className="faq-toggle-icon">{openFaqs[0] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Tendril is a lean, agent-first compute marketplace that lets individuals rent out their PC's CPU, GPU,
                and RAM, and allows developers or autonomous AI agents to rent sandboxed machines by the second using
                USDC over x402 on Algorand.</p>
            </div>
          </details>

          {/*  Q2  */}
          <details className="faq-item" open={openFaqs[1]} onToggle={(e) => handleToggleFaq(1, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>How does prepaid and per-second metering work?</span>
              <span className="faq-toggle-icon">{openFaqs[1] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>You deposit USDC to your credit balance once. When you rent a machine, a small 0.01 USDC gate fee opens
                the session, and your balance is billed to the exact second when you release the box. You never pay for
                unneeded booked blocks.</p>
            </div>
          </details>

          {/*  Q3  */}
          <details className="faq-item" open={openFaqs[2]} onToggle={(e) => handleToggleFaq(2, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>Is it safe to contribute my PC's compute?</span>
              <span className="faq-toggle-icon">{openFaqs[2] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Yes. Safety is enforced by an ephemeral Docker sandbox: zero host filesystem mounts, no inbound host
                ports (SSH dials out via a bore tunnel), all root capabilities dropped, and hard cgroup caps. The
                container is completely destroyed upon lease end.</p>
            </div>
          </details>

          {/*  Q4  */}
          <details className="faq-item" open={openFaqs[3]} onToggle={(e) => handleToggleFaq(3, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>Do I need ALGO to pay for compute?</span>
              <span className="faq-toggle-icon">{openFaqs[3] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>No! The facilitator sponsors all on-chain network transaction fees. You only need USDC on Algorand and
                zero ALGO to top up and rent.</p>
            </div>
          </details>

          {/*  Q5  */}
          <details className="faq-item" open={openFaqs[4]} onToggle={(e) => handleToggleFaq(4, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>How do I connect to a rented machine?</span>
              <span className="faq-toggle-icon">{openFaqs[4] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Once you start a lease, the dashboard provides a copyable SSH command. Your wallet address acts as your
                default authentication password, or you can provide your own public SSH key.</p>
            </div>
          </details>

          {/*  Q6  */}
          <details className="faq-item" open={openFaqs[5]} onToggle={(e) => handleToggleFaq(5, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>What is POST /x402/run?</span>
              <span className="faq-toggle-icon">{openFaqs[5] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>If you only need to run a single script or Python workload without managing an SSH session, send your
                payload directly to POST /x402/run. Tendril automatically selects the highest-value idle node, executes
                the job, returns stdout, and destroys the sandbox.</p>
            </div>
          </details>

          {/*  Q7  */}
          <details className="faq-item" open={openFaqs[6]} onToggle={(e) => handleToggleFaq(6, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>How are nodes scored and matched?</span>
              <span className="faq-toggle-icon">{openFaqs[6] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Nodes are scored by true value: (cores + RAM_GB / 4) / pricePerHourUsd. We route jobs to the most
                cost-effective hardware rather than artificially slow, cheap instances.</p>
            </div>
          </details>

          {/*  Q8  */}
          <details className="faq-item" open={openFaqs[7]} onToggle={(e) => handleToggleFaq(7, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>What happens if my balance runs out mid-session?</span>
              <span className="faq-toggle-icon">{openFaqs[7] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Tendril provides an automatic grace window equal to $1.00 of runtime at your node's rate so you can
                save your artifacts and work. The platform absorbs this cost before the container is cleanly terminated.
              </p>
            </div>
          </details>

          {/*  Q9  */}
          <details className="faq-item" open={openFaqs[8]} onToggle={(e) => handleToggleFaq(8, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>How do contributors earn and get paid?</span>
              <span className="faq-toggle-icon">{openFaqs[8] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Contributors mint an API key in the web app, run our lightweight daemon, and earn USDC directly for
                every lease second served. Earnings accumulate in their balance and can be withdrawn on-chain to their
                Algorand wallet at any time.</p>
            </div>
          </details>

          {/*  Q10  */}
          <details className="faq-item" open={openFaqs[9]} onToggle={(e) => handleToggleFaq(9, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>Does my machine need a public IP or open router ports?</span>
              <span className="faq-toggle-icon">{openFaqs[9] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>No. Contributor nodes establish an outbound tunnel to our bore relay. You never have to configure port
                forwarding, dynamic DNS, or expose your local network.</p>
            </div>
          </details>

          {/*  Q11  */}
          <details className="faq-item" open={openFaqs[10]} onToggle={(e) => handleToggleFaq(10, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>Can autonomous AI agents rent machines without humans?</span>
              <span className="faq-toggle-icon">{openFaqs[10] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Yes! The x402 protocol and HTTP 402 endpoints allow autonomous headless agents to discover nodes via
                GET /explorer, pay via signed atomic transactions, and run workloads with zero human intervention.</p>
            </div>
          </details>

          {/*  Q12  */}
          <details className="faq-item" open={openFaqs[11]} onToggle={(e) => handleToggleFaq(11, e.currentTarget.open)}>
            <summary className="faq-question">
              <span>Can I cancel or release a lease at any time?</span>
              <span className="faq-toggle-icon">{openFaqs[11] ? "−" : "+"}</span>
            </summary>
            <div className="faq-answer">
              <p>Yes, immediately. Clicking Release in the dashboard or sending a DELETE request stops billing instantly
                and destroys the remote sandbox.</p>
            </div>
          </details>
        </div>
      </div>
    </section>

    {/*  ================= 8. ASK AI SECTION (Still not sure?) =================  */}
    <section className="ask-ai-section wrap">
      <div className="ask-ai-card">
        <div className="ask-ai-left">
          <span className="ask-ai-eyebrow">ASK AI</span>
          <h3 className="ask-ai-title">Still not sure?</h3>
          <p className="ask-ai-desc">Don't just take our word for it. See what your favorite AI says about Tendril DePIN
            compute</p>
        </div>

        <div className="ask-ai-right">
          <div className="ai-buttons-grid">
            {/*  ChatGPT  */}
            <button type="button" className="btn-ai" onClick={() => handleAiClick("chatgpt")} title="Ask ChatGPT">
              <svg viewBox="299 299 1808 1808" width="18" height="18" fill="currentColor">
                <defs>
                  <path id="gpt-petal" d="M1107.3 299.1c-198 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.5V833.3v-27.9L1372.7 604c33.7-19.5 70.4-32.9 108.5-39.8L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5l-.6.6c79.7 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.1 151.6-338.9 339-339.2z"/>
                </defs>
                <use href="#gpt-petal"/>
                <use href="#gpt-petal" transform="rotate(60 1203 1203)"/>
                <use href="#gpt-petal" transform="rotate(120 1203 1203)"/>
                <use href="#gpt-petal" transform="rotate(180 1203 1203)"/>
                <use href="#gpt-petal" transform="rotate(240 1203 1203)"/>
                <use href="#gpt-petal" transform="rotate(300 1203 1203)"/>
              </svg>
              <span>Ask ChatGPT</span>
            </button>

            {/*  Claude  */}
            <button type="button" className="btn-ai" onClick={() => handleAiClick("claude")} title="Ask Claude">
              <svg viewBox="0 0 100 100" width="18" height="18" fill="currentColor">
                <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
              </svg>
              <span>Ask Claude</span>
            </button>

            {/*  Gemini  */}
            <button type="button" className="btn-ai" onClick={() => handleAiClick("gemini")} title="Ask Gemini">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path
                  d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
              </svg>
              <span>Ask Gemini</span>
            </button>

            {/*  Perplexity  */}
            <button type="button" className="btn-ai" onClick={() => handleAiClick("perplexity")} title="Ask Perplexity">
              <svg viewBox="106 70 342 386" width="18" height="18" fill="currentColor">
                <path d="M159.25 75.50 L158.25 89.25 L157.50 116.25 L156.75 183.50 L155.00 184.50 L111.50 186.00 L111.00 186.50 L111.00 351.00 L111.50 351.50 L157.25 351.50 L158.25 352.25 L158.25 431.75 L159.50 450.75 L160.00 450.75 L185.25 428.50 L266.50 353.50 L267.50 354.25 L268.75 445.50 L269.25 451.00 L284.75 450.75 L285.00 374.50 L285.75 362.75 L286.75 359.75 L288.00 358.50 L288.75 358.50 L296.50 364.75 L372.50 432.50 L393.75 450.75 L394.50 450.75 L395.50 435.50 L395.50 352.25 L397.00 351.25 L442.50 351.50 L442.75 351.00 L442.75 186.25 L442.25 185.75 L407.75 186.00 L406.75 185.25 L406.50 98.25 L405.50 80.25 L404.50 75.75 L403.25 76.25 L390.50 86.25 L320.50 145.00 L288.50 171.00 L287.50 171.25 L286.50 170.00 L285.75 164.00 L285.00 144.75 L284.50 75.00 L269.00 75.25 L267.50 171.50 L266.50 172.00 L178.25 91.25 L160.25 75.50 Z M287.25 218.50 L288.25 218.75 L292.50 222.50 L319.75 248.75 L379.25 308.50 L379.75 309.50 L379.25 326.25 L379.00 378.75 L378.25 412.25 L377.75 412.75 L377.25 412.75 L285.50 331.25 L285.00 330.25 L284.75 257.25 L285.75 225.75 L286.50 219.25 Z M266.50 218.50 L267.25 219.25 L268.25 231.50 L268.50 328.00 L176.50 412.25 L176.00 412.25 L175.50 411.75 L174.75 378.75 L174.50 326.25 L174.00 309.50 L174.50 308.50 L239.00 243.75 L265.50 218.75 Z M251.50 203.50 L252.25 204.50 L251.00 206.25 L231.25 227.25 L158.25 300.25 L158.00 332.00 L157.50 332.50 L130.25 332.50 L129.75 332.00 L129.75 202.25 L130.25 201.75 L212.50 201.75 L241.50 202.50 Z M302.25 203.50 L312.25 202.50 L341.25 201.75 L423.50 201.75 L424.00 202.25 L424.00 332.00 L423.50 332.50 L396.25 332.50 L395.75 332.00 L395.50 300.25 L337.75 242.75 L317.50 222.00 L301.75 205.00 L301.50 204.25 Z M386.50 113.75 L387.50 152.75 L387.50 181.00 L387.25 184.50 L386.75 185.00 L336.75 185.25 L304.50 184.50 L303.50 183.75 L304.00 182.75 L314.25 174.50 L385.25 113.50 Z M174.00 112.75 L174.75 112.75 L228.25 161.50 L252.00 183.75 L253.00 185.00 L252.75 186.00 L238.50 185.25 L176.00 184.25 L175.50 183.75 L174.75 161.00 L174.50 133.25 L173.75 116.75 Z" fillRule="evenodd" />
              </svg>
              <span>Ask Perplexity</span>
            </button>

            {/*  Grok  */}
            <button type="button" className="btn-ai" onClick={() => handleAiClick("grok")} title="Ask Grok">
              <svg viewBox="0 0 34 33" width="18" height="18" fill="currentColor">
                <path d="M13.2371 21.0407L24.3186 12.8506C24.8619 12.4491 25.6384 12.6057 25.8973 13.2294C27.2597 16.5185 26.651 20.4712 23.9403 23.1851C21.2297 25.8989 17.4581 26.4941 14.0108 25.1386L10.2449 26.8843C15.6463 30.5806 22.2053 29.6665 26.304 25.5601C29.5551 22.3051 30.562 17.8683 29.6205 13.8673L29.629 13.8758C28.2637 7.99809 29.9647 5.64871 33.449 0.844576C33.5314 0.730667 33.6139 0.616757 33.6964 0.5L29.1113 5.09055V5.07631L13.2343 21.0436 M10.9503 23.0313C7.07343 19.3235 7.74185 13.5853 11.0498 10.2763C13.4959 7.82722 17.5036 6.82767 21.0021 8.2971L24.7595 6.55998C24.0826 6.07017 23.215 5.54334 22.2195 5.17313C17.7198 3.31926 12.3326 4.24192 8.67479 7.90126C5.15635 11.4239 4.0499 16.8403 5.94992 21.4622C7.36924 24.9165 5.04257 27.3598 2.69884 29.826C1.86829 30.7002 1.0349 31.5745 0.36364 32.5L10.9474 23.0341" />
              </svg>
              <span>Ask Grok</span>
            </button>

            {/*  Copy Prompt  */}
            <button type="button" className="btn-ai btn-copy-prompt" id="copyPromptBtn" title="Copy Prompt" onClick={handleCopyPrompt}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span id="copyPromptText">{copyPromptText}</span>
            </button>
          </div>

          <div className="ask-human-row">
            <a href="#explore" className="link-talk-human">Join Discord &amp; Community →</a>
          </div>
        </div>
      </div>
    </section>

    {/*  ================= 9. PRE-FOOTER CTA (clouds-painting.jpg) =================  */}
    <section className="final-cta-section">
      <div className="final-cta-bg-frame">
        <img  src="/assets/clouds-painting.jpg" alt="Painted green landscape with clouds" className="final-cta-img"
          loading="lazy" />
        <div className="final-cta-overlay"></div>
      </div>

      <div className="wrap final-cta-content">
        <h2 className="final-cta-title">
          Real compute is now<br />
          simpler than ever.
        </h2>
        <p className="final-cta-subtitle">
          Spin up a sandboxed GPU or CPU node in seconds. Pay strictly for what you use, powered by USDC on Algorand.
        </p>
        <div className="final-cta-action">
          <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark btn-lg">
            Explore the marketplace
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </section>

  </main>

  {/*  ================= 10. FOOTER (lime-field-paint.jpg) =================  */}
  <footer className="site-footer">
    <div className="wrap footer-main-grid">
      {/*  Brand & Mission  */}
      <div className="footer-brand-col">
        <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollToSection("top"); }}>
          <span className="brand-flower">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <rect width="32" height="32" fill="#0B5D3A" />
              <g fill="#F4F1EA">
                <rect x="5" y="7" width="22" height="4" />
                <rect x="5" y="7" width="2" height="3" />
                <rect x="25" y="7" width="2" height="3" />
                <rect x="14" y="7" width="4" height="17" />
                <rect x="10" y="22" width="12" height="3" />
              </g>
            </svg>
          </span>
          <span className="brand-text">Tendril</span>
        </a>
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

      {/*  Links: Product  */}
      <div className="footer-nav-col">
        <h4 className="footer-nav-heading">MARKETPLACE</h4>
        <ul className="footer-link-list">
          <li><a href="/explore" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Explore Nodes</a></li>
          <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>How It Works</a></li>
          <li><a href="/contribute" onClick={(e) => { e.preventDefault(); navigate("/contribute"); }}>Contribute Compute</a></li>
          <li><a href="/docs" onClick={(e) => { e.preventDefault(); navigate("/docs"); }}>Run Script (/run)</a></li>
          <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>FAQ</a></li>
          <li><a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Active Leases</a></li>
        </ul>
      </div>

      {/*  Links: Protocol  */}
      <div className="footer-nav-col">
        <h4 className="footer-nav-heading">PROTOCOL</h4>
        <ul className="footer-link-list">
          <li><a href="#protocol">x402 Specification</a></li>
          <li><a href="#protocol">Algorand Settlement</a></li>
          <li><a href="#protocol">Bore Tunneling</a></li>
          <li><a href="#protocol">Docker Sandboxes</a></li>
        </ul>
      </div>

      {/*  Links: Resources  */}
      <div className="footer-nav-col">
        <h4 className="footer-nav-heading">RESOURCES</h4>
        <ul className="footer-link-list">
          <li><a href="https://github.com/HimanshuM685/Tendril" target="_blank" rel="noopener">GitHub Repository</a></li>
          <li><a href="#contribute">Contributor Daemon</a></li>
          <li><a href="#privacy">Privacy Policy</a></li>
          <li><a href="#terms">Terms of Service</a></li>
        </ul>
      </div>
    </div>

    {/*  Copyright and Sub-actions  */}
    <div className="wrap footer-bottom-bar">
      <div className="footer-copyright">
        © 2026 Tendril Compute. Crafted with
        <svg className="heart-icon" viewBox="0 0 24 24" width="12" height="12" fill="#e11d48">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        for open compute
      </div>
      <div className="footer-bottom-actions">
        <a href="/explore" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Connect Wallet</a>
        <a href="/explore" className="footer-cta-link" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Explore Nodes →</a>
      </div>
    </div>

    {/*  Landscape banner at the very bottom: lime-field-paint.jpg  */}
    <div className="footer-landscape-banner">
      <img  src="/assets/lime-field-paint.jpg" alt="Panoramic field painting with village and countryside" loading="lazy" />
    </div>
  </footer>

  {/*  Toast Notification for Prompt Copying  */}
  <div className={`toast-popup ${showToast ? "show" : ""}`} id="toastNotification" role="alert" aria-live="polite">
    Prompt copied to clipboard!
  </div>
    </div>
  );
}
