import { Suspense, lazy, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArchDiagram } from "./ArchDiagram";
import type { MdDocId } from "./ApiDocs";

const MarkdownDocs = lazy(() => import("./ApiDocs").then((m) => ({ default: m.ApiDocs })));

type DocTab = "manual" | MdDocId;

const REFERENCE_DOCS: { id: MdDocId; label: string }[] = [
  { id: "api", label: "HTTP" },
  { id: "x402", label: "x402 (paid)" },
  { id: "mcp", label: "MCP" },
];

const MANUAL_TOC = [
  { id: "architecture", text: "Architecture" },
  { id: "connect-sign-in", text: "Connect & sign in" },
  { id: "top-up", text: "Top up" },
  { id: "rent-ssh", text: "Rent & connect over SSH" },
  { id: "run-one-job", text: "Run one job, no lease" },
  { id: "billing", text: "Billing" },
  { id: "for-agents", text: "For agents" },
  { id: "contributing-compute", text: "Contributing compute" },
  { id: "safety", text: "Safety" },
  { id: "notes-limits", text: "Notes & limits" },
];

function parseDoc(raw: string | null): DocTab {
  if (raw === "api" || raw === "x402" || raw === "mcp" || raw === "manual") return raw;
  return "manual";
}

function BrandFlower() {
  return (
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
  );
}

/** Docs portal: human manual + HTTP / x402 / MCP markdown reference. */
export function Docs() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const active = parseDoc(params.get("doc"));

  function select(id: DocTab) {
    const search = id === "manual" ? "" : `?doc=${id}`;
    navigate({ pathname: "/docs", search }, { replace: true });
  }

  return (
    <div className="docs-page-wrapper">
      <header className="docs-top-header">
        <div className="docs-header-inner">
          <div className="docs-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
            <span className="docs-brand-flower">
              <BrandFlower />
            </span>
            <span className="docs-brand-text">Tendril</span>
            <span className="docs-subdomain-badge">docs</span>
          </div>
          <div className="docs-header-actions">
            <button type="button" className="docs-launch-btn" onClick={() => navigate("/explore")}>
              Launch App
            </button>
          </div>
        </div>
      </header>

      <div className="docs-main-shell">
        <nav className="docs-sidebar-nav" aria-label="Sections">
          <div className="docs-nav-group-list">
            <div className="docs-nav-group">
              <div className="docs-nav-group-title">Guide</div>
              <a
                href="/docs"
                className={`docs-nav-link-item${active === "manual" ? " active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  select("manual");
                }}
              >
                Manual
              </a>
            </div>

            <div className="docs-nav-group">
              <div className="docs-nav-group-title">API reference</div>
              {REFERENCE_DOCS.map((d) => (
                <a
                  key={d.id}
                  href={`/docs?doc=${d.id}`}
                  className={`docs-nav-link-item${active === d.id ? " active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    select(d.id);
                  }}
                >
                  {d.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {active === "manual" ? (
          <Manual />
        ) : (
          <Suspense
            fallback={
              <div className="docs-main-content">
                <p className="muted dash-note">Loading reference…</p>
              </div>
            }
          >
            <MarkdownDocs docId={active} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="docs-code-block">
      <div className="dcb-header">
        <span>{lang}</span>
        <button type="button" className="dcb-copy" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Manual() {
  return (
    <>
      <div className="docs-main-content">
        <article className="docs-article">
          <p className="docs-eyebrow">Guide</p>
          <h1 className="docs-title">How Tendril works</h1>
          <p className="docs-lead">
            Tendril rents real machines by the second, paid in <strong>USDC over x402</strong> on
            Algorand. Top up once, then either rent a box and SSH into it, or skip renting entirely
            and throw a script at <code>POST /x402/run</code>. You pay for the seconds you actually
            use, billed at the end — never for a block of time you booked and didn't need. The
            facilitator sponsors the network fee, so a payer needs USDC and <strong>zero ALGO</strong>.
          </p>

          <div className="docs-steps-grid">
            <div className="docs-step-card">
              <div className="step-num">01</div>
              <h4>Connect &amp; sign in</h4>
              <p>Wallet signature or Google custodial — either mints a session.</p>
            </div>
            <div className="docs-step-card">
              <div className="step-num">02</div>
              <h4>Top up</h4>
              <p>One x402 payment credits your prepaid USDC balance.</p>
            </div>
            <div className="docs-step-card">
              <div className="step-num">03</div>
              <h4>Rent or run</h4>
              <p>SSH into a leased box, or fire a one-shot job with no lease.</p>
            </div>
          </div>

          <h2 className="docs-h2" id="architecture">
            Architecture
          </h2>
          <p>
            Three independent pieces talk to one central registry. A <strong>consumer</strong> (a
            person in this UI, or a headless agent) tops up and rents. The <strong>registry</strong>{" "}
            holds the off-chain balance ledger in Neon, verifies payments through the x402
            facilitator and pays out on Algorand, and brokers leases to{" "}
            <strong>contributors</strong> over a WebSocket. The rented box itself is reached
            directly — the renter's SSH traffic rides a bore tunnel straight into the sandbox.
          </p>

          <div className="arch-tiers-grid">
            <div className="arch-tier-card">
              <div className="atc-tag">CONSUMER</div>
              <h4>Person or agent</h4>
              <p>Tops up USDC, rents a node or fires a one-shot job.</p>
            </div>
            <div className="arch-tier-card">
              <div className="atc-tag">REGISTRY</div>
              <h4>Balance &amp; broker</h4>
              <p>Verifies x402 payments, holds the ledger, brokers leases over WebSocket.</p>
            </div>
            <div className="arch-tier-card">
              <div className="atc-tag">CONTRIBUTOR</div>
              <h4>Machine owner</h4>
              <p>Runs the daemon, launches sandboxes, gets paid out on-chain.</p>
            </div>
          </div>

          <div className="docs-arch-wrap">
            <ArchDiagram />
          </div>

          <h2 className="docs-h2" id="connect-sign-in">
            1 · Connect &amp; sign in
          </h2>
          <p>
            Two paths: connect Pera, Lute, or Defly from the top bar and <strong>Sign in</strong>{" "}
            (one-time wallet signature), or choose <strong>Continue with Google</strong> to get a
            custodial Algorand wallet provisioned for your account. Either way mints a session so
            only you can spend your balance. Google users must send ALGO to their deposit address
            for on-chain fees and opt in to USDC before topping up; every custodial transaction
            requires an explicit approval dialog.
          </p>

          <h2 className="docs-h2" id="top-up">
            2 · Top up
          </h2>
          <p>
            Open the wallet panel and deposit any amount of USDC. You sign one x402 payment to the
            platform address; the facilitator settles it and the registry credits your prepaid
            balance. Crediting is idempotent per transaction id — a deposit can never be counted
            twice. Every deposit is kept as history.
          </p>

          <h2 className="docs-h2" id="rent-ssh">
            3 · Rent &amp; connect over SSH
          </h2>
          <p>
            Pick a node in <strong>Explore</strong> and hit Rent. You pay a small flat{" "}
            <strong>gate fee</strong> (0.01 USDC) that opens the session; that is the only thing
            that goes on-chain up front. The session then runs open-ended for as long as your
            credit covers the node's hourly rate. You get a copyable SSH command; your{" "}
            <strong>wallet address is the password</strong> unless you hand over a public key:
          </p>
          <CodeBlock lang="bash" code={"ssh root@<host> -p <port>   # password = your wallet address"} />
          <p>
            The host and port resolve through a bore tunnel that runs inside the sandbox, so the
            contributor never opens a port on their own host. The sandbox is a throwaway, hardened
            Docker container — destroyed the moment the lease ends.
          </p>

          <h2 className="docs-h2" id="run-one-job">
            Or: run one job, no lease
          </h2>
          <p>
            Renting is overkill for a single script. <code>POST /x402/run</code> takes Python,
            finds the best-value idle machine, runs it in a throwaway sandbox, hands back stdout
            and destroys the box. No node to choose, nothing to release.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl -X POST $API/x402/run -H 'content-type: application/json' \\\n  -d '{"payload":"print(sum(range(100)))"}'`}
          />
          <p>
            <strong>Best value, not cheapest.</strong> Nodes are scored{" "}
            <code>(cores + RAM_GB / 4) / pricePerHourUsd</code>, highest first. A machine at half
            the rate that takes three times as long is not a saving, and you have no way to see
            that happen.
          </p>

          <h2 className="docs-h2" id="billing">
            Billing
          </h2>
          <ul className="docs-list">
            <li>
              Nodes are priced per <strong>hour</strong> in USD. USDC is a dollar, so there is no
              exchange rate anywhere.
            </li>
            <li>
              Usage is metered continuously but <strong>charged once</strong>, when the lease
              closes — prorated to the exact seconds used.
            </li>
            <li>
              <strong>Run out mid-session and you get a grace window</strong> — one dollar of
              runtime at your own node's rate, so it is the same goodwill on a cheap box as an
              expensive one. Save your work; then the sandbox is destroyed. The platform absorbs
              it.
            </li>
            <li>
              A one-shot <code>/x402/run</code> is never killed part-way, so it can take you{" "}
              <strong>negative</strong>: 0.50 USDC of credit against a 0.60 job finishes, and you
              owe 0.10. A negative balance blocks renting until you top up by at least what you
              owe.
            </li>
            <li>The contributor is paid on-chain in USDC when the lease ends, minus a small platform fee.</li>
          </ul>

          <h2 className="docs-h2" id="for-agents">
            For agents
          </h2>
          <p>
            Use the <strong>MCP</strong> tab for every client file. The server is{" "}
            <code>npx -y @tendril/mcp-server</code>. It pays x402 with <code>AVM_PRIVATE_KEY</code>{" "}
            — a contributor API key cannot. Raw HTTP is on the <strong>HTTP</strong> and{" "}
            <strong>x402</strong> tabs.
          </p>
          <CodeBlock
            lang="json"
            code={`{
  "mcpServers": {
    "tendril": {
      "command": "npx",
      "args": ["-y", "@tendril/mcp-server"],
      "env": {
        "REGISTRY_URL": "https://tendrilregister.007575.xyz",
        "AVM_PRIVATE_KEY": "<base64 64-byte secret>"
      }
    }
  }
}`}
          />
          <p className="muted small">
            Claude Desktop and Cursor use that object. VS Code uses <code>servers</code> plus{" "}
            <code>&quot;type&quot;: &quot;stdio&quot;</code>. Paths and the Claude Code command are on
            the MCP tab.
          </p>
          <ul className="docs-list">
            <li>
              <code>tendril_list_nodes</code> / <code>GET /explorer</code> — live machines.
            </li>
            <li>
              <code>tendril_run</code> / <code>POST /x402/run</code> — one job, no lease.
            </li>
            <li>
              <code>tendril_rent</code> / <code>POST /x402/rent</code> — metered SSH session.
            </li>
          </ul>

          <h2 className="docs-h2" id="contributing-compute">
            Contributing compute
          </h2>
          <p>
            Mint an API key on the <strong>Contribute</strong> page (or{" "}
            <code>tendril_mint_key</code>), then run the daemon on the machine you want to share —
            it advertises specs, heartbeats, and launches sandboxes on demand:
          </p>
          <CodeBlock lang="bash" code={"TENDRIL_API_KEY=<your-key> PRICE_PER_HOUR_USD=1.0 npm run contributor"} />
          <p>
            The machine holds no wallet key: the wallet that minted the API key owns the node and
            collects its earnings. Renters reach the box through a bore tunnel that runs inside the
            sandbox — nothing to open on your host.
          </p>

          <h2 className="docs-h2" id="safety">
            Safety
          </h2>
          <ul className="docs-list">
            <li>No host filesystem mounts, no host network, nearly all Linux capabilities dropped.</li>
            <li>Hard CPU / memory / PID caps.</li>
            <li>The container is destroyed when the lease ends — every time.</li>
          </ul>

          <h2 className="docs-h2" id="notes-limits">
            Notes &amp; limits
          </h2>
          <ul className="docs-list">
            <li>
              <strong>Custodial:</strong> top-ups pool at one platform address and balances live as
              an off-chain ledger in Neon. Renter credit has no withdrawal path — it is spent on
              compute. Contributor earnings do: withdraw them to your wallet, $5 minimum.
            </li>
            <li>
              <strong>Metering granularity:</strong> charges land at close; a depleted balance is
              caught on the next watchdog tick, so worst-case over-use is one tick of compute.
            </li>
            <li>
              <strong>One job is capped</strong> at <code>RUN_TIMEOUT_MS</code> (120s by default),
              which is also the cap on how far a single run can overdraw you.
            </li>
          </ul>
        </article>
      </div>

      <aside className="docs-toc-rail" aria-label="On this page">
        <div className="docs-toc-header">On this page</div>
        <div className="docs-toc-links">
          {MANUAL_TOC.map((h) => (
            <a key={h.id} href={`#${h.id}`} className="docs-toc-item">
              {h.text}
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}
