import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export type LegalDocument = "terms" | "refund";

export interface LegalProps {
  /** Select which local legal document to render. */
  document: LegalDocument;
}

type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
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

Contact: [legal contact to be added]. This placeholder must be replaced before publication.
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

For a suspected duplicate charge, incorrect usage duration, failed provisioning outcome, or withdrawal problem, preserve the request id, job or lease id, transaction id, and response, then contact [support contact to be added]. Do not send private keys, seed phrases, API keys, or other secrets in a support request.
`;

const documentContent: Record<LegalDocument, string> = {
  terms: termsContent,
  refund: refundContent,
};

const documentMeta: Record<LegalDocument, { title: string; eyebrow: string; updated: string }> = {
  terms: { title: "Terms of Service", eyebrow: "LEGAL / TERMS", updated: "2026-10-19" },
  refund: { title: "Refund Policy", eyebrow: "LEGAL / REFUNDS", updated: "2026-10-19" },
};

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
      blocks.push({ kind: "heading", level: heading[1].length === 2 ? 2 : 3, text: heading[2] });
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
  return /^(?:https?:\/\/|mailto:|#)/i.test(href.trim()) ? href.trim() : null;
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
      result.push(href ? <a key={key} href={href}>{link![1]}</a> : token);
    }
    last = start + token.length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

function renderBlock(block: Block, index: number): ReactNode {
  if (block.kind === "heading") {
    const Heading = block.level === 2 ? "h2" : "h3";
    return <Heading key={index}>{renderInline(block.text)}</Heading>;
  }
  if (block.kind === "paragraph") return <p key={index}>{renderInline(block.text)}</p>;
  const List = block.ordered ? "ol" : "ul";
  return <List key={index} className="docs-list">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</List>;
}

/** Shared, dependency-free renderer for local legal markdown-like content. */
export function Legal({ document }: LegalProps) {
  const meta = documentMeta[document];
  return (
    <main className="page docs-main-content" aria-labelledby="legal-title">
      <article className="docs-article">
        <p className="docs-eyebrow">{meta.eyebrow}</p>
        <h1 id="legal-title" className="docs-title">{meta.title}</h1>
        <p className="docs-lead">Last updated: <time dateTime={meta.updated}>{meta.updated}</time></p>
        <nav aria-label="Legal navigation" className="docs-header-actions">
          <Link className="docs-nav-link" to="/">← Home</Link>
          <Link className="docs-nav-link" to="/docs">Documentation →</Link>
        </nav>
        <div className="docs-markdown-body" aria-label={`${meta.title} content`}>
          {parseDocument(documentContent[document]).map(renderBlock)}
        </div>
      </article>
    </main>
  );
}
