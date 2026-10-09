import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { docsUrl } from "../lib/docsLinks";
import "../landing.css";

const MCP_ANIMATED_PROMPTS = [
  "Find available GPU nodes for running my AI model",
  "Compare compute providers by hardware and price",
  "Run my workload on the most cost-effective node",
];

const SAMPLE_PROMPT =
  "How does Tendril work for decentralized pay-per-second compute? Compare Tendril with Akash and io.net for renting sandboxed GPU and CPU machines over x402 on Algorand.";

const FAQ_ITEMS = [
  {
    q: "What is Tendril, exactly?",
    a: "Tendril is a lean, agent-first compute marketplace that lets individuals rent out their PC's CPU, GPU, and RAM, and allows developers or autonomous AI agents to rent sandboxed machines by the second using USDC over x402 on Algorand.",
  },
  {
    q: "How does prepaid and per-second metering work?",
    a: "You deposit USDC to your credit balance once. When you rent a machine, a small 0.01 USDC gate fee opens the session, and your balance is billed to the exact second when you release the box. You never pay for unneeded booked blocks.",
  },
  {
    q: "Is it safe to contribute my PC's compute?",
    a: "Yes. Safety is enforced by an ephemeral Docker sandbox: zero host filesystem mounts, no inbound host ports (SSH dials out via a bore tunnel), all root capabilities dropped, and hard cgroup caps. The container is completely destroyed upon lease end.",
  },
  {
    q: "Do I need ALGO to pay for compute?",
    a: "No! The facilitator sponsors all on-chain network transaction fees. You only need USDC on Algorand and zero ALGO to top up and rent.",
  },
  {
    q: "How do I connect to a rented machine?",
    a: "Once you start a lease, the dashboard provides a copyable SSH command. Your wallet address acts as your default authentication password, or you can provide your own public SSH key.",
  },
  {
    q: "What is POST /x402/run?",
    a: "If you only need to run a single script or Python workload without managing an SSH session, send your payload directly to POST /x402/run. Tendril automatically selects the highest-value idle node, executes the job, returns stdout, and destroys the sandbox.",
  },
  {
    q: "How are nodes scored and matched?",
    a: "Nodes are scored by true value: (cores + RAM_GB / 4) / pricePerHourUsd. We route jobs to the most cost-effective hardware rather than artificially slow, cheap instances.",
  },
  {
    q: "What happens if my balance runs out mid-session?",
    a: "Tendril provides an automatic grace window equal to $1.00 of runtime at your node's rate so you can save your artifacts and work. The platform absorbs this cost before the container is cleanly terminated.",
  },
  {
    q: "How do contributors earn and get paid?",
    a: "Contributors mint an API key in the web app, run our lightweight daemon, and earn USDC directly for every lease second served. Earnings accumulate in their balance and can be withdrawn on-chain to their Algorand wallet at any time.",
  },
  {
    q: "Does my machine need a public IP or open router ports?",
    a: "No. Contributor nodes establish an outbound tunnel to our bore relay. You never have to configure port forwarding, dynamic DNS, or expose your local network.",
  },
  {
    q: "Can autonomous AI agents rent machines without humans?",
    a: "Yes! The x402 protocol and HTTP 402 endpoints allow autonomous headless agents to discover nodes via GET /explorer, pay via signed atomic transactions, and run workloads with zero human intervention.",
  },
  {
    q: "Can I cancel or release a lease at any time?",
    a: "Yes, immediately. Clicking Release in the dashboard or sending a DELETE request stops billing instantly and destroys the remote sandbox.",
  },
];

function TrustedMarquee({ children }: { children: ReactNode }) {
  return (
    <div className="trusted-marquee">
      <div className="trusted-logos">
        {[0, 1].map((copy) => (
          <div className="trusted-logo-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true });
  const [copyPromptText, setCopyPromptText] = useState("Copy prompt");
  const [showToast, setShowToast] = useState(false);
  const [searchStatus, setSearchStatus] = useState("Polling live nodes...");
  const [mcpInput, setMcpInput] = useState("");
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const mcpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mcpInput) return;

    let promptIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentPrompt = MCP_ANIMATED_PROMPTS[promptIndex];

      if (!isDeleting) {
        charIndex++;
        setAnimatedPlaceholder(currentPrompt.slice(0, charIndex));

        if (charIndex === currentPrompt.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, 2200);
          return;
        }
        timeoutId = setTimeout(tick, 50);
      } else {
        charIndex--;
        setAnimatedPlaceholder(currentPrompt.slice(0, charIndex));

        if (charIndex === 0) {
          isDeleting = false;
          promptIndex = (promptIndex + 1) % MCP_ANIMATED_PROMPTS.length;
          timeoutId = setTimeout(tick, 450);
          return;
        }
        timeoutId = setTimeout(tick, 28);
      }
    };

    timeoutId = setTimeout(tick, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mcpInput]);

  const handleMcpSubmit = () => {
    const query = mcpInput.trim() || animatedPlaceholder;
    if (query) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/explore");
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll(".reveal-on-scroll");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("revealed"));
      return;
    }

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

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

  const handleToggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
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
            <span className="brand-text">Tendril</span>
          </a>

          <nav className="desktop-nav" aria-label="Main Navigation">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>How it works</a>
            <a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>FAQ</a>
            <a href={docsUrl()}>Docs</a>
            {/* <a href="/about" onClick={(e) => { e.preventDefault(); navigate("/about"); }}>About</a> */}
          </nav>

          <div className="topbar-actions">
            <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark btn-sm">Explore Marketplace</button>
            <button
              type="button"
              className={`menu-toggle ${mobileNavOpen ? "open" : ""}`}
              aria-label="Toggle navigation menu"
              id="menuToggle"
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/*  Mobile Drawer  */}
        <div className={`mobile-nav ${mobileNavOpen ? "open" : ""}`} id="mobileNav">
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              setMobileNavOpen(false);
              scrollToSection("how-it-works");
            }}
          >
            How it works
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              setMobileNavOpen(false);
              scrollToSection("faq");
            }}
          >
            FAQ
          </a>
          <a
            href={docsUrl()}
            onClick={() => setMobileNavOpen(false)}
          >
            Docs
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileNavOpen(false);
              navigate("/explore");
            }}
            className="btn btn-dark"
          >
            Explore Marketplace
          </button>
        </div>
      </header>

      <main id="top">

        {/*  ================= 1. HERO SECTION =================  */}
        <section className="hero-section wrap">
          <div className="hero-grid">
            {/*  Left Hero Copy  */}
            <div className="hero-content reveal-on-scroll">
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
                <button type="button" onClick={() => navigate("/explore")} className="btn btn-dark">
                  Explore the marketplace
                  <span className="btn-arrow">→</span>
                </button>
              </div>
              <div className="hero-perks hero-perks-desktop">
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

            {/*  Right Hero Mockup with lake-Valley.jpg  */}
            <div className="hero-visual reveal-on-scroll reveal-stagger-1">
              <div className="hero-art-frame">
                <img src="/assets/lake-Valley.jpg" alt="Painted green landscape" className="hero-art-img" />

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
                      <button type="button" className="btn-export-csv" onClick={(e) => e.preventDefault()} tabIndex={-1}>Launch SSH</button>
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

            {/* Mobile and Tablet Hero Perks (below LIVE COMPUTE REGISTRY card) */}
            <div className="hero-perks hero-perks-mobile">
              <span className="perk-item">
                <svg className="check-icon" viewBox="0 0 16 16" width="14" height="14" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#eaf3dc" />
                  <path d="M5 8.2l2.2 2.2 4-4.4" stroke="#5b8c1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                No subscription or lock-in
              </span>
              <span className="perk-item">
                <svg className="check-icon" viewBox="0 0 16 16" width="14" height="14" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#eaf3dc" />
                  <path d="M5 8.2l2.2 2.2 4-4.4" stroke="#5b8c1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Zero ALGO needed (fees sponsored)
              </span>
            </div>
          </div>
        </section>

        {/*  ================= FEATURED & TRUSTED BY =================  */}
        <section className="trusted-bar reveal-on-scroll">
          <div className="wrap trusted-inner">
            <span className="trusted-label">FEATURED &amp; TRUSTED BY</span>
            <TrustedMarquee>
              <div className="partner-logo partner-logo--algorand">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M13.874 0h3.673l1.61 5.963h3.789l-2.588 4.5 3.624 13.533h-3.757l-2.44-9.077-5.247 9.079H8.345l8.107-14.051-1.304-4.878L4.215 24H.018Z" />
                </svg>
                <span>Algorand</span>
              </div>

              <div className="partner-logo partner-logo--usdc">
                <svg viewBox="0 0 96 96" width="18" height="18" fill="currentColor">
                  <path d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z" fillRule="evenodd" />
                </svg>
                <span>USDC with x402</span>
              </div>

              <div className="partner-logo partner-logo--color">
                <img src="/assets/agentmesh-color.png" alt="" width="32" height="32" />
                <span>AgentMesh</span>
              </div>

              <div className="partner-logo partner-logo--color">
                <img src="/assets/claude-wordmark.svg" alt="Claude" width="147" height="32" />
              </div>

              <div className="partner-logo">
                <img src="/assets/e2b-wordmark.svg" alt="E2B for Startups" width="256" height="32" />
              </div>

              <div className="partner-logo partner-logo--openai">
                <img src="/assets/OpenAI.svg" alt="OpenAI" width="118" height="32" />
              </div>
            </TrustedMarquee>
          </div>
        </section>

        {/*  ================= 2. THREE STEPS (countryside-cottages, meadow-path-and-hills, lake-and-Mountain-vista) =================  */}
        <section className="steps-section wrap" id="how-it-works">
          <div className="section-title-center reveal-on-scroll">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2 className="serif-title">Three steps between you and raw compute.</h2>
          </div>

          <div className="steps-grid">
            {/*  Step 1: countryside-cottages.jpg  */}
            <article className="step-card reveal-on-scroll">
              <div className="step-card-media">
                <img src="/assets/countryside-cottages.jpg" alt="Cozy painted cottage with lush garden" loading="lazy" />
              </div>
              <div className="step-card-content">
                <h3 className="step-title">Connect &amp; Top Up USDC</h3>
                <p className="step-desc">Connect Pera, Lute, Defly or sign in with Google. Deposit USDC once with zero ALGO
                  network fees required.</p>
              </div>
            </article>

            {/*  Step 2: lake-and-Mountain-vista.jpg  */}
            <article className="step-card reveal-on-scroll reveal-stagger-1">
              <div className="step-card-media">
                <img src="/assets/lake-and-Mountain-vista.jpg" alt="Vibrant landscape with rolling greens" loading="lazy" />
              </div>
              <div className="step-card-content">
                <h3 className="step-title">Pick Node or Run Script</h3>
                <p className="step-desc">Select an idle GPU/CPU machine from the registry or throw Python code at POST /x402/run
                  for instant execution.</p>
              </div>
            </article>

            {/*  Step 3: meadow-path-and-hills.jpg  */}
            <article className="step-card reveal-on-scroll reveal-stagger-2">
              <div className="step-card-media">
                <img src="/assets/meadow-path-and-hills.jpg" alt="Scenic mountain valley in paint texture" loading="lazy" />
              </div>
              <div className="step-card-content">
                <h3 className="step-title">SSH In &amp; Pay by Second</h3>
                <p className="step-desc">Get an instant copyable SSH command. Metered continuously against your credit and
                  billed only when released.</p>
              </div>
            </article>
          </div>
        </section>

        {/*  ================= 3. DASHBOARD SHOWCASE (meadow-under-cloudy-skies.jpg) & 6 FEATURES =================  */}
        <section className="platform-section wrap" id="explore">
          <div className="section-title-center reveal-on-scroll">
            <span className="section-eyebrow">A COMPLETE DECENTRALIZED PLATFORM</span>
            <h2 className="serif-title">Everything you need to rent or provide compute.</h2>
            <div className="section-cta-row">
              <button type="button" onClick={(e) => e.preventDefault()} className="btn btn-dark">Explore live nodes</button>
            </div>
          </div>

          {/*  App Backdrop with meadow-under-cloudy-skies.jpg  */}
          <div className="app-stage-wrapper reveal-on-scroll">
            <div className="app-stage-backdrop">
              <img src="/assets/meadow-under-cloudy-skies.jpg" alt="Painted green landscape meadow" className="stage-bg-img" loading="lazy" />
            </div>

            {/*  Realistic Web App Dashboard Mockup  */}
            <div className="app-dashboard-window">
              {/*  Sidebar  */}
              <aside className="app-sidebar">
                <div className="sidebar-brand">
                  <span className="brand-flower-sm">
                    <svg viewBox="0 0 32 32" width="16" height="16">
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
                  <span className="sidebar-brand-name">Tendril</span>
                </div>

                <nav className="sidebar-menu">
                  <a href="#explore" onClick={(e) => e.preventDefault()} className="sidebar-item active">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Explore</span>
                  </a>
                  <a href="#contribute" onClick={(e) => e.preventDefault()} className="sidebar-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Contribute</span>
                  </a>
                  <a href="#dashboard" onClick={(e) => e.preventDefault()} className="sidebar-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    <span>Dashboard</span>
                  </a>
                  <a href="#metrics" onClick={(e) => e.preventDefault()} className="sidebar-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    <span>Metrics</span>
                  </a>
                </nav>

                <div className="sidebar-usage-box">
                  <span className="usage-title">PREPAID BALANCE</span>
                  <div className="usage-stats">
                    <span>24.50 USDC</span>
                    <span>Funds ~102h</span>
                  </div>
                </div>

                <div className="sidebar-footer-links">
                  <a href={docsUrl("/docs/build/mcp")} className="sf-item">
                    <span className="sf-icon">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </span>
                    <span>Connect MCP</span>
                  </a>
                  <a href={docsUrl()} className="sf-item">
                    <span className="sf-icon">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
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
                    <button type="button" className="qa-btn" onClick={(e) => e.preventDefault()}>
                      <span className="qa-btn-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </span>
                      <span className="qa-btn-text">Explore Nodes</span>
                    </button>
                    <button type="button" className="qa-btn" onClick={(e) => e.preventDefault()}>
                      <span className="qa-btn-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="7.5" cy="15.5" r="5.5"></circle>
                          <path d="m21 2-9.6 9.6"></path>
                          <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
                        </svg>
                      </span>
                      <span className="qa-btn-text">Mint Contributor Key</span>
                    </button>
                    <button type="button" className="qa-btn qa-btn-accent" onClick={(e) => e.preventDefault()}>
                      <span className="qa-btn-icon">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"></line>
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                      </span>
                      <span className="qa-btn-text">Top Up USDC</span>
                    </button>
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
                      <a href="#leases" onClick={(e) => e.preventDefault()} className="panel-link">View all leases →</a>
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
                      <a href="#nodes" onClick={(e) => e.preventDefault()} className="panel-link">View all 142 nodes →</a>
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
            <article className="feature-card reveal-on-scroll">
              <div className="feature-icon-bubble icon-green">
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
            <article className="feature-card reveal-on-scroll reveal-stagger-1">
              <div className="feature-icon-bubble icon-green">
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
            <article className="feature-card reveal-on-scroll reveal-stagger-2">
              <div className="feature-icon-bubble icon-green">
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
            <article className="feature-card reveal-on-scroll">
              <div className="feature-icon-bubble icon-green">
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
            <article className="feature-card reveal-on-scroll reveal-stagger-1">
              <div className="feature-icon-bubble icon-green">
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
            <article className="feature-card reveal-on-scroll reveal-stagger-2">
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

        {/*  ================= 4. BUILT ON ACCURACY / TRUST (meadow-under-cloudy-skies.jpg & lake-Valley.jpg) =================  */}
        <section className="accuracy-section wrap" id="contribute">
          <div className="section-title-center reveal-on-scroll">
            <span className="section-eyebrow">WHY TENDRIL</span>
            <h2 className="serif-title">Built on trust, not centralized clouds.</h2>
            <p className="section-subtitle-max">Big clouds charge heavy markups and lock you into monthly plans. Tendril
              connects you directly to bare-metal individual compute.</p>
          </div>

          <div className="comparison-dual-grid">
            {/*  Card 1: meadow-under-cloudy-skies.jpg  */}
            <div className="comparison-card reveal-on-scroll">
              <div className="comparison-visual-frame">
                <img src="/assets/meadow-under-cloudy-skies.jpg" alt="Painted green landscape" className="comparison-bg-art" loading="lazy" />
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

            {/*  Card 2: lake-Valley.jpg  */}
            <div className="comparison-card reveal-on-scroll reveal-stagger-1">
              <div className="comparison-visual-frame">
                <img src="/assets/lake-Valley.jpg" alt="Painted mountain slopes" className="comparison-bg-art"
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
            <div className="mcp-intro reveal-on-scroll">
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
            <div className="mcp-card-mockup reveal-on-scroll reveal-stagger-1">
              <div className="mcp-badge-pill">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>Tendril MCP</span>
              </div>

              <h3 className="mcp-greeting">
                <svg className="mcp-greeting-sparkle" viewBox="0 0 24 24" width="18" height="18" fill="#c86d51">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                Good morning
              </h3>

              <div className="mcp-prompt-card" onClick={() => mcpInputRef.current?.focus()}>
                <div className="mcp-prompt-input-row">
                  <input
                    ref={mcpInputRef}
                    type="text"
                    className="mcp-real-input"
                    value={mcpInput}
                    onChange={(e) => setMcpInput(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleMcpSubmit();
                      }
                    }}
                    aria-label="Tendril MCP prompt input"
                  />
                  {!mcpInput && (
                    <div className={`mcp-animated-placeholder ${isInputFocused ? "is-focused" : ""}`} aria-hidden="true">
                      <span className="mcp-prompt-text">{animatedPlaceholder}</span>
                      {!isInputFocused && <span className="mcp-prompt-cursor">|</span>}
                    </div>
                  )}
                </div>
                <div className="mcp-prompt-toolbar">
                  <div className="mcp-prompt-tools-left">
                    <button type="button" className="mcp-tool-circle-btn" aria-label="Add attachment" onClick={(e) => { e.stopPropagation(); mcpInputRef.current?.focus(); }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <button type="button" className="mcp-tool-circle-btn" aria-label="Adjust parameters" onClick={(e) => { e.stopPropagation(); mcpInputRef.current?.focus(); }}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </button>
                  </div>
                  <div className="mcp-prompt-tools-right">
                    <div className="mcp-model-selector" onClick={(e) => e.stopPropagation()}>
                      <span className="model-name">Claude Opus 5</span>
                      <span className="selector-chevron">▾</span>
                    </div>
                    <button type="button" className="mcp-send-btn" aria-label="Submit prompt" onClick={(e) => { e.stopPropagation(); handleMcpSubmit(); }}>
                      <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                        <path fillRule="evenodd"
                          d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                          clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mcp-quick-tags">
                <button type="button" className="mcp-tag-pill" onClick={() => { setMcpInput("Create an automated GPU lease pipeline"); mcpInputRef.current?.focus(); }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" />
                  </svg>
                  <span>Create</span>
                </button>
                <button type="button" className="mcp-tag-pill" onClick={() => { setMcpInput("POST /x402/run Python matrix benchmark script"); mcpInputRef.current?.focus(); }}>
                  <span className="mcp-pill-code-sym">&lt;&gt;</span>
                  <span>Code</span>
                </button>
                <button type="button" className="mcp-tag-pill" onClick={() => { setMcpInput("Learn how Algorand settlement works with x402"); mcpInputRef.current?.focus(); }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <line x1="9" y1="7" x2="15" y2="7" />
                  </svg>
                  <span>Learn</span>
                </button>
                <button type="button" className="mcp-tag-pill" onClick={() => { setMcpInput("Write an MCP integration script for Claude Desktop"); mcpInputRef.current?.focus(); }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  <span>Write</span>
                </button>
                <button type="button" className="mcp-tag-pill" onClick={() => { setMcpInput("Monitor personal contributor node earnings"); mcpInputRef.current?.focus(); }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                    <line x1="6" y1="1" x2="6" y2="4" />
                    <line x1="10" y1="1" x2="10" y2="4" />
                    <line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                  <span>Life stuff</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/*  ================= 6. TESTIMONIAL & RELATABLE CTA =================  */}
        <section className="testimonial-section wrap">
          <blockquote className="founder-quote reveal-on-scroll">
            “Every cloud platform out there was expensive, rigid, and bureaucratically bloated. Tendril lets our autonomous
            agents spin up isolated GPU sandboxes and pay in seconds over x402 with zero hassle.”
          </blockquote>

          <div className="founder-profile reveal-on-scroll reveal-stagger-1">
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

          <div className="relatable-box reveal-on-scroll reveal-stagger-2">
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
            <div className="faq-header reveal-on-scroll">
              <span className="section-eyebrow">FAQ</span>
              <h2 className="serif-title">Common questions</h2>
            </div>

            <div className="faq-accordion-list reveal-on-scroll reveal-stagger-1">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = !!openFaqs[index];
                return (
                  <div
                    key={index}
                    className={`faq-item ${isOpen ? "is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => handleToggleFaq(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="faq-toggle-icon" aria-hidden="true">
                        <span className="faq-toggle-line-h" />
                        <span className="faq-toggle-line-v" />
                      </span>
                    </button>
                    <div className="faq-answer-wrapper">
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/*  ================= 8. ASK AI SECTION (Still not sure?) =================  */}
        <section className="ask-ai-section wrap">
          <div className="ask-ai-card reveal-on-scroll">
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
                      <path id="gpt-petal" d="M1107.3 299.1c-198 0-373.9 127.3-435.2 315.3L650 743.5v427.9c0 21.4 11 40.4 29.4 51.4l344.5 198.5V833.3v-27.9L1372.7 604c33.7-19.5 70.4-32.9 108.5-39.8L1447.6 450.3C1361 353.5 1237.1 298.5 1107.3 299.1zm0 117.5l-.6.6c79.7 0 156.3 27.5 217.6 78.4-2.5 1.2-7.4 4.3-11 6.1L952.8 709.3c-18.4 10.4-29.4 30-29.4 51.4V1248l-155.1-89.4V755.8c-.1-187.1 151.6-338.9 339-339.2z" />
                    </defs>
                    <use href="#gpt-petal" />
                    <use href="#gpt-petal" transform="rotate(60 1203 1203)" />
                    <use href="#gpt-petal" transform="rotate(120 1203 1203)" />
                    <use href="#gpt-petal" transform="rotate(180 1203 1203)" />
                    <use href="#gpt-petal" transform="rotate(240 1203 1203)" />
                    <use href="#gpt-petal" transform="rotate(300 1203 1203)" />
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

        {/*  ================= 9. PRE-FOOTER CTA (cloudscape.jpg) =================  */}
        <section className="final-cta-section">
          <div className="final-cta-bg-frame">
            <img src="/assets/cloudscape.jpg" alt="Painted green landscape with clouds" className="final-cta-img"
              loading="lazy" />
            <div className="final-cta-overlay"></div>
          </div>

          <div className="wrap final-cta-content reveal-on-scroll">
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

      {/*  ================= 10. FOOTER (countryside-meadow-panorama.jpg) =================  */}
      <footer className="site-footer">
        <div className="wrap footer-main-grid reveal-on-scroll">
          {/*  Brand & Mission  */}
          <div className="footer-brand-col">
            <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); scrollToSection("top"); }}>
              <span className="brand-flower">
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
              <li><a href={docsUrl("/docs/guides-access/one-shot-jobs")}>Run Script (/run)</a></li>
              <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection("faq"); }}>FAQ</a></li>
              <li><a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>Active Leases</a></li>
            </ul>
          </div>

          {/*  Links: Protocol  */}
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">PROTOCOL</h4>
            <ul className="footer-link-list">
              <li><a href={docsUrl("/docs/api/x402")}>x402 Specification</a></li>
              <li><a href={docsUrl("/docs/concepts/algorand-settlement")}>Algorand Settlement</a></li>
              <li><a href={docsUrl("/docs/concepts/sandboxes-bore-tunnels")}>Bore Tunneling</a></li>
              <li><a href={docsUrl("/docs/guides-access/security-sandboxes")}>Docker Sandboxes</a></li>
            </ul>
          </div>

          {/*  Links: Resources  */}
          <div className="footer-nav-col">
            <h4 className="footer-nav-heading">RESOURCES</h4>
            <ul className="footer-link-list">
              <li><a href="https://github.com/HimanshuM685/Tendril" target="_blank" rel="noopener">GitHub Repository</a></li>
              <li><a href={docsUrl("/docs/build#daemon-install")}>Contributor Daemon</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/*  Copyright and Sub-actions  */}
        <div className="wrap footer-bottom-bar">
          <div className="footer-copyright">
            © 2026 Tendril Compute.





          </div>
          <div className="footer-bottom-actions">
            <a href="/explore" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Connect Wallet</a>
            <a href="/explore" className="footer-cta-link" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>Explore Nodes →</a>
          </div>
        </div>

        {/*  Landscape banner at the very bottom: countryside-meadow-panorama.jpg  */}
        <div className="footer-landscape-banner wrap">
          <img src="/assets/countryside-meadow-panorama.jpg" alt="Panoramic field painting with village and countryside" loading="lazy" />
        </div>
      </footer>

      {/*  Toast Notification for Prompt Copying  */}
      <div className={`toast-popup ${showToast ? "show" : ""}`} id="toastNotification" role="alert" aria-live="polite">
        Prompt copied to clipboard!
      </div>
    </div>
  );
}
