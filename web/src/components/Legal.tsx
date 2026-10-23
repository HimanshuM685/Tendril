import { useMemo, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LandingFooter } from "./LandingFooter";
import { TendrilBrand } from "./TendrilBrand";

export type LegalDocument = "terms" | "privacy" | "refund";

export interface LegalProps {
  /** Select which local legal document to render. */
  document: LegalDocument;
}

type Block =
  | { kind: "heading"; level: 2 | 3; text: string; slug: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

const termsContent = String.raw`
## 1. Service

Tendril is a best-effort, per-second compute marketplace. Depending on the deployment, compute may come from hosted infrastructure such as Modal or from nodes operated by independent contributors. Hosted notebook capacity and contributor-run nodes may have different surfaces, availability, prices, and limits.

Tendril is not a bank, payment account, custodian of user investment funds, or provider of guaranteed compute capacity. The service does not pay interest on balances and a credit balance is not a deposit.

## 2. Identity and accounts

An Algorand wallet address is used as payment and credit identity for wallet flows. A settled payment credits the address that sent it; access to that address's credit requires the ability to sign for it. Where email or Google sign-in is enabled, Tendril creates a platform-managed Algorand wallet for the account. The platform may hold and sign with that wallet to perform actions you explicitly approve.

Do not send funds from an exchange or another address you cannot sign for: the resulting credit may not be spendable by you. Tendril does not promise that no identity, sanctions, tax, or other compliance checks will ever apply.

## 3. Prepaid credit and payments

USDC payments on Algorand buy prepaid, off-chain Tendril credit. The default top-up bounds are 0.10 USDC minimum and 1000 USDC maximum per top-up, subject to deployment configuration. Credit is recorded in Tendril's ledger and is usable for eligible Tendril services; it is not an on-chain deposit, does not earn interest, and is not itself a token or claim on a segregated account.

The same settled payment cannot be credited twice. Tendril records payment identity and rejects or idempotently handles replays according to the endpoint; a replay does not create duplicate credit or a second paid action.

On-chain transfers are made to the platform address shown in the payment request. Except where the Refund Policy expressly says otherwise, Tendril does not promise a chain-level refund or reversal of a settled transfer.

## 4. Prices and billing

Prices are shown by the applicable API response or UI and may vary by node, provider, deployment, and configuration. Current default examples are:

- 0.01 USDC on-chain gate fee to open a metered rent session;
- per-second rent at the selected contributor node's advertised rate;
- 0.01 USDC on-chain gate fee per one-shot run job, plus execution time from prepaid credit;
- 0.10 USDC on-chain fee to mint a contributor API key; and
- contributor node time at the node's advertised rate, less a 1% platform fee on collected usage by default.

For a metered session, the gate fee is separate from usage. Tendril starts the meter when the sandbox is ready and closes it on release, watchdog close, or another terminal event. The close calculation uses the seconds the sandbox actually ran, prorated at the node rate. A session charge is capped by available credit; a one-shot run can be charged for its actual execution and may leave a negative credit balance that must be topped up before further use.

When credit runs out, an idle watchdog may allow a grace window worth 1.00 USDC at that node's rate before force-closing the sandbox, subject to deployment configuration. Grace is not purchased credit or a promise of additional free capacity. It exists to save work. Only seconds the sandbox actually runs enter the close calculation, and a session cannot be charged beyond the credit the ledger permits.

## 5. Contributor earnings

For contributor-run nodes, collected usage is credited to the contributor's earnings ledger when the lease closes. Earnings are not sent on-chain per lease. The contributor may withdraw the full available balance once it reaches the 5.00 USDC minimum and the payout address has opted into the payment asset. A failed on-chain send restores the debited earnings balance; a successful send is recorded with its transaction id.

Contributors must operate only software and hardware they control, keep their daemon and runtime supported, accurately advertise capacity and price, protect their API key, maintain required network connectivity, and avoid tampering with or accessing renter workloads. Tendril may suspend a node or account for abuse, material misrepresentation, security risk, or non-payment risk.

## 6. Acceptable use

You may not use Tendril to violate law or third-party rights; distribute malware, credentials, or illegal content; attack, scan, or disrupt networks or systems without authorization; evade access controls; mine cryptocurrency; infringe intellectual property; process regulated data without an appropriate agreement; or interfere with another user's compute, privacy, or availability.

You are responsible for code, data, packages, secrets, credentials, outputs, and network activity you send through the service. Do not place secrets in workloads unless you accept the risks of shared or third-party infrastructure.

## 7. Availability and security

Tendril is provided on a best-effort basis with no uptime, performance, durability, backup, or availability SLA. Nodes can disappear, restart, become unreachable, or be reclaimed. Sandboxes are intended to provide isolation, but no hosted or contributor-run environment is guaranteed secure or error-free. Keep your own copies of important inputs and outputs.

## 8. Suspension and termination

Tendril may reject work, limit spend, suspend access, stop a node, or terminate a session when required for safety, capacity, maintenance, legal compliance, payment risk, or violation of these Terms. Closing a session does not reverse a settled on-chain gate fee. Any remaining eligible prepaid credit remains subject to the Refund Policy and applicable law.

## 9. Disclaimers and liability

To the maximum extent permitted by law, Tendril is provided as-is and as available, without implied warranties of merchantability, fitness, title, non-infringement, uninterrupted service, or suitability for a particular workload. You use third-party nodes and hosted providers at your own risk.

To the maximum extent permitted by law, Tendril and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or lost profit, revenue, data, goodwill, or business losses. The aggregate liability cap for claims arising from the service is the greater of the amount you paid Tendril for the affected service during the six months before the event or 100.00 USDC, except to the extent a limitation is prohibited by law.

## 10. Changes and contact

Tendril may change these Terms, prices, limits, providers, or features. The updated version will carry a new last-updated date. Continued use after an effective update means you accept the updated Terms to the extent allowed by law.

Contact: [legal@tendrilhq.com](mailto:legal@tendrilhq.com) or reach out via [GitHub](https://github.com/HimanshuM685/Tendril).
`;

const privacyContent = String.raw`
## 1. Overview and scope

This Privacy Policy explains how Tendril ("Tendril", "we", "our", or "the platform") collects, uses, retains, and protects information when you use our website, compute marketplace, APIs, CLI, contributor daemon, and related services.

Tendril is designed as a developer-first compute network with minimal data retention. We do not sell your personal data, and we do not run third-party advertising trackers.

## 2. Information we collect

Depending on how you interact with Tendril, we collect the following categories of information:

- **Public blockchain data:** When you connect a non-custodial wallet (such as Pera, Defly, or Lute), your Algorand wallet address, transaction IDs, payment amounts, and on-chain timestamps are processed to verify payments and credit balances. Because blockchains are public ledgers, this data is public by nature.
- **Account information:** If you register using email or Google sign-in, we store your email address, display name, account creation timestamp, and platform-managed Algorand address. Passwords are cryptographically hashed; plain-text passwords are never stored.
- **Prepaid ledger and usage records:** We record your off-chain prepaid credit balance, top-up history, active leases, one-shot run jobs, execution durations, gate fees, and compute charges.
- **Workload inputs and outputs:** To run your workloads, our servers and contributor nodes receive the code, container commands, notebook cells, environment variables, and output streams you submit. Workloads run inside ephemeral sandboxes and outputs are retained temporarily for retrieval.
- **Contributor daemon data:** If you run a contributor node, we receive daemon heartbeat status, advertised hardware specifications (CPU, RAM, GPU, disk), port tunnel bindings, and uptime statistics.
- **Technical and diagnostic logs:** When you access the platform, our infrastructure logs standard HTTP/WebSocket request details, including IP address, user-agent string, request path, timestamp, and error traces for performance monitoring and threat prevention.

## 3. How we use your information

We use the collected information exclusively to operate and secure the compute marketplace:

- Authenticating your identity and managing sessions;
- Crediting settled Algorand USDC payments to your Tendril balance;
- Routing compute jobs to available contributor nodes or hosted sandboxes;
- Calculating per-second usage and settling lease closures;
- Processing contributor withdrawal requests to opted-in Algorand addresses;
- Preventing abuse, denial-of-service attacks, fraudulent payments, and terms violations; and
- Diagnosing technical issues and improving service performance.

## 4. Workload isolation and infrastructure sharing

Tendril coordinates compute between renters and independent contributor nodes or hosted providers:

- **Contributor sandboxes:** Contributor nodes execute workloads inside isolated, unprivileged Docker containers with restricted capabilities, resource caps (CPU, memory, PID), and no host filesystem mounts. However, code and inputs you send to a contributor node are processed on hardware owned by that contributor. Do not include unencrypted private keys, sensitive secrets, or proprietary data in workloads sent to third-party nodes.
- **Hosted runners:** Where configured, workloads may run on automated hosted infrastructure (such as Modal or dedicated sandboxes) governed by their respective operational security controls.
- **Tunneling:** When interactive ports or notebook servers are exposed via tunneling tools (such as bore), network traffic through the tunnel is relayed through platform-managed endpoints to establish end-to-end connectivity.

## 5. Information sharing and disclosure

We do not sell, rent, or trade your personal information. We disclose information only under the following limited circumstances:

- **Public ledger records:** Any on-chain payment, top-up transaction, or contributor withdrawal is recorded immutably on the Algorand blockchain.
- **Service providers:** We use trusted infrastructure providers for cloud database hosting (such as Neon Postgres), cloud storage, and server hosting. These providers process data solely on our behalf and under confidentiality obligations.
- **Contributor nodes:** When you rent a contributor's node, that node receives the necessary execution payload (container image, commands, environment variables) to perform the requested compute task.
- **Legal and safety requirements:** We may disclose information if required by valid law, subpoena, regulation, or legal process, or to investigate and prevent imminent harm, fraud, or violations of our Terms of Service.

## 6. Cookies and local storage

Tendril does not use third-party tracking, analytics, or behavioral advertising cookies.

We use browser **Local Storage** (localStorage) strictly for functional session management:
- tendril.session: Stores your local authentication token, active address, and session metadata so you remain signed in across page reloads.
- Client-side UI preferences (such as dismissed notices or prompt templates).

You can clear your browser storage at any time through your browser settings, which will sign you out of your current session.

## 7. Data retention and deletion

- **Prepaid ledger and billing history:** Maintained as long as your account remains active or as required for accounting, tax, and audit compliance.
- **Workload outputs and artifacts:** Retained for a limited polling and download window following job completion, after which ephemeral sandbox files are purged.
- **Server logs:** Standard technical and diagnostic logs are rotated and deleted on a regular rolling schedule.
- **Account deletion:** You may request deletion of your custodial account and associated personal data by contacting us. Note that public blockchain transactions cannot be modified or deleted.

## 8. Security measures

We implement reasonable technical and organizational measures to safeguard your data, including TLS encryption in transit, cryptographic password hashing, scoped API tokens, and container capability restrictions for sandboxed workloads. However, no internet transmission or distributed system is completely secure, and we cannot guarantee absolute security.

## 9. Your rights and choices

Depending on your jurisdiction, you may have rights under applicable privacy laws (such as GDPR or CCPA), including the right to:
- Access and inspect personal data we hold about you;
- Request correction of inaccurate information;
- Request deletion of your custodial account records;
- Disconnect your Algorand wallet at any time; and
- Export cryptographic keys for platform-managed accounts.

To exercise these rights, please contact our support team.

## 10. Changes and contact

We may update this Privacy Policy periodically to reflect changes in our service, legal obligations, or technical architecture. The revised policy will be posted with an updated "Last updated" date.

Contact: [privacy@tendrilhq.com](mailto:privacy@tendrilhq.com) or reach out via [GitHub](https://github.com/HimanshuM685/Tendril).
`;

const refundContent = String.raw`
## 1. Prepaid credit

USDC top-ups become prepaid Tendril credit in an off-chain ledger. Credit is a usable service balance, not a refundable on-chain deposit, bank balance, or interest-bearing instrument. If you have not used eligible credit, it remains available for eligible Tendril services, subject to account limits, suspension, expiry rules if later disclosed, and applicable law.

Tendril does not claim to provide a chain-level refund path for a settled Algorand transfer. On-chain payments may be irreversible. Contact Tendril promptly about an error; do not assume that a wallet, facilitator, asset issuer, or blockchain can reverse a confirmed transfer.

## 2. Provisioning failures

For a metered rent session, Tendril verifies the payment, provisions the sandbox, and settles the 0.01 USDC gate fee only after the sandbox is ready. If provisioning fails before settlement, no gate fee settles and no usage credit is charged. Retry with another available node when the response says the request is safe to retry.

For a one-shot run without an existing lease, the 0.01 USDC job gate fee is settled before provisioning so the signed payment remains valid during a long startup. If provisioning then fails, the gate fee remains settled, but no execution seconds are billed because no execution window started.

For a notebook job, the same ordering means a provisioning failure after gate fee settlement leaves the gate fee settled and leaves execution-time credit uncharged. The job result reports the failure through its polling endpoint.

## 3. Run failures and actual usage

Execution failure, timeout, or a failed program is not automatically a refund when compute actually ran. Tendril closes the run and bills the seconds the sandbox actually ran at the selected node's rate. A failed result can therefore include an execution charge. A run that fails before execution starts does not receive an execution-time charge; its already-settled gate fee, if any, is not automatically reversed.

For a job executed inside an existing lease, the job's gate payment is settled after execution succeeds. If execution fails before that settlement, the job gate fee is not settled, while the existing lease remains governed by its own meter and close rules.

## 4. Grace and lease close

When prepaid credit runs out, the watchdog may provide a grace window worth the configured grace amount at the node's rate. Grace is an opportunity to save work, not a new credit grant. Only seconds the sandbox actually runs enter the close calculation, and the session charge is limited by the remaining ledger balance. There is no separate grace refund because unused grace was never charged.

Releasing a session bills actual elapsed sandbox seconds once. If nothing was taken up front for usage, there is no unused usage charge to refund. Duplicate close attempts do not create duplicate charges.

## 5. Contributor withdrawals

Contributor earnings accrue at lease close and are withdrawn in one on-chain transfer after the 5.00 USDC minimum is met. Tendril debits the earnings ledger before sending to prevent double payment. If the on-chain send is known to have failed, Tendril restores the debited balance and records the failed attempt.

If a transfer is confirmed on-chain, Tendril cannot promise reversal. Verify the destination address and asset opt-in before withdrawing.

## 6. Contact and disputes

For a suspected duplicate charge, incorrect usage duration, failed provisioning outcome, or withdrawal problem, preserve the request id, job or lease id, transaction id, and response, then contact [support@tendrilhq.com](mailto:support@tendrilhq.com) or reach out via [GitHub](https://github.com/HimanshuM685/Tendril). Do not send private keys, seed phrases, API keys, or other secrets in a support request.
`;

const documentContent: Record<LegalDocument, string> = {
  terms: termsContent,
  privacy: privacyContent,
  refund: refundContent,
};

const documentMeta: Record<LegalDocument, { title: string; eyebrow: string; updated: string }> = {
  terms: { title: "Terms of Service", eyebrow: "LEGAL", updated: "October 19, 2026" },
  privacy: { title: "Privacy Policy", eyebrow: "LEGAL", updated: "October 19, 2026" },
  refund: { title: "Refund Policy", eyebrow: "LEGAL", updated: "October 19, 2026" },
};

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parseDocument(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  for (const line of source.trim().split(/\r?\n/)) {
    const heading = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    const bullet = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+?)\s*$/.exec(line);
    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length === 2 ? 2 : 3,
        text: heading[2],
        slug: toSlug(heading[2]),
      });
    } else if (bullet || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (!list || list.ordered !== isOrdered) {
        flushList();
        list = { ordered: isOrdered, items: [] };
      }
      list.items.push((bullet ?? ordered)![1]);
    } else if (/^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function safeHref(href: string): string | null {
  return /^(?:https?:\/\/|mailto:|#|\/)/i.test(href.trim()) ? href.trim() : null;
}

function renderInline(text: string): ReactNode[] {
  const tokens = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^\s)]+\))/g;
  const result: ReactNode[] = [];
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(tokens)) {
    const start = match.index ?? 0;
    if (start > last) result.push(text.slice(last, start));
    const token = match[0];
    const key = `${start}-${index++}`;
    if (token.startsWith("**")) result.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("*")) result.push(<em key={key}>{token.slice(1, -1)}</em>);
    else if (token.startsWith("`")) result.push(<code key={key}>{token.slice(1, -1)}</code>);
    else {
      const link = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(token);
      const href = link ? safeHref(link[2]) : null;
      if (href && href.startsWith("/")) {
        result.push(<Link key={key} to={href}>{link![1]}</Link>);
      } else if (href) {
        result.push(
          <a
            key={key}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {link![1]}
          </a>
        );
      } else {
        result.push(token);
      }
    }
    last = start + token.length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

function renderBlock(block: Block, index: number): ReactNode {
  if (block.kind === "heading") {
    const Heading = block.level === 2 ? "h2" : "h3";
    const plainText = block.text.replace(/^\d+[.)]\s*/, "");
    const aliasSlug = plainText !== block.text ? toSlug(plainText) : null;
    return (
      <Heading key={index} id={block.slug} className={`legal-heading ${block.level === 2 ? "legal-h2" : "legal-h3"}`}>
        {aliasSlug && <span id={aliasSlug} className="heading-anchor-alias" aria-hidden="true" />}
        <span className="heading-text">{renderInline(block.text)}</span>
      </Heading>
    );
  }
  if (block.kind === "paragraph") return <p key={index}>{renderInline(block.text)}</p>;
  const List = block.ordered ? "ol" : "ul";
  return (
    <List key={index} className="legal-list">
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex}>{renderInline(item)}</li>
      ))}
    </List>
  );
}

/** Shared, dependency-free renderer for local legal markdown-like content. */
export function Legal({ document: docType }: LegalProps) {
  const navigate = useNavigate();
  const meta = documentMeta[docType];
  const location = useLocation();

  const blocks = useMemo(() => parseDocument(documentContent[docType]), [docType]);

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1));
      const el = window.document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 60);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [docType, location.hash]);

  return (
    <div className="landing-wrapper legal-page">
      <header className="topbar brand-guidelines-topbar">
        <div className="topbar-inner wrap">
          <TendrilBrand href="/" />
          <div className="topbar-actions">
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="btn btn-dark btn-sm"
            >
              Explore Marketplace
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="wrap legal-content">
          <header className="legal-intro">
            <span className="legal-eyebrow">{meta.eyebrow}</span>
            <h1 id="legal-title" className="legal-title">{meta.title}</h1>
            <p className="legal-updated">Last updated: <time dateTime="2026-10-19">{meta.updated}</time></p>
          </header>

          <article className="legal-body" aria-labelledby="legal-title">
            {blocks.map(renderBlock)}
          </article>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
