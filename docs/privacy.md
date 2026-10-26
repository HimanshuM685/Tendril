# Tendril Privacy Policy

Last updated: 2026-10-20

This Privacy Policy explains how Tendril ("Tendril", "we", "our", or "the
platform") collects, uses, retains, and protects information when you use our
website, compute marketplace, APIs, CLI, contributor daemon, and related
services. It describes current application behavior; deployment providers and
legal requirements may add obligations. It is not legal advice.

## 1. Overview and scope

Tendril is designed as a developer-first compute network with limited
application retention. We do not sell your personal data, and the web
application contains no third-party advertising or analytics trackers.
Hosting, identity, payment, and execution providers may process information as
described below.

## 2. Information we collect

Depending on how you interact with Tendril, we collect the following categories
of information:

- **Public blockchain data:** When you connect a non-custodial wallet (such as
  Pera, Defly, or Lute), your Algorand wallet address, transaction IDs, payment
  amounts, and on-chain timestamps are processed to verify payments and credit
  balances. Because blockchains are public ledgers, this data is public by
  nature.
- **Account information:** If you register using email or Google sign-in, we
  store your email address, display name, account creation timestamp, and
  platform-managed Algorand address. Passwords are cryptographically hashed;
  plain-text passwords are never stored.
- **Prepaid ledger and usage records:** We record your off-chain prepaid credit
  balance, top-up history, active leases, one-shot run jobs, execution
  durations, gate fees, and compute charges. Live leases and some run results
  are held in memory and are not durable database records.
- **Workload inputs and outputs:** To run your workloads, our servers and
  contributor nodes receive the code, container commands, notebook cells,
  environment variables, and output streams you submit. Workloads run inside
  ephemeral sandboxes and outputs are retained temporarily for retrieval.
- **Contributor daemon data:** If you run a contributor node, we receive daemon
  heartbeat status, advertised hardware specifications (CPU, RAM, and GPU),
  node identity, tunnel connection details, and uptime information while the
  daemon is connected. The live node registry is in memory.
- **Technical and diagnostic logs:** Depending on deployment, reverse proxies,
  hosting providers, and application infrastructure may log request or
  connection metadata such as IP address, user-agent string, request path,
  timestamp, node connection details, and error information for performance
  monitoring and threat prevention. Exact fields and retention depend on
  deployment configuration.

## 3. How we use your information

We use the collected information to operate and secure the compute marketplace:

- Authenticating your identity and managing sessions;
- Crediting settled Algorand USDC payments to your Tendril balance;
- Routing compute jobs to available contributor nodes or hosted sandboxes;
- Calculating per-second usage and settling lease closures;
- Processing contributor withdrawal requests to opted-in Algorand addresses;
- Preventing abuse, denial-of-service attacks, fraudulent payments, and Terms
  violations; and
- Diagnosing technical issues and improving service performance.

## 4. Workload isolation and infrastructure sharing

Tendril coordinates compute between renters and independent contributor nodes or
hosted providers:

- **Contributor sandboxes:** Contributor nodes execute workloads inside
  isolated, unprivileged Docker containers with restricted capabilities,
  resource caps (CPU, memory, PID), and no host filesystem mounts. However,
  code and inputs you send to a contributor node are processed on hardware
  owned by that contributor. Do not include unencrypted private keys, sensitive
  secrets, or proprietary data in workloads sent to third-party nodes.
- **Hosted runners:** Where configured, workloads may run on automated hosted
  infrastructure such as Modal or E2B, governed by their respective
  operational controls and terms.
- **Tunneling:** When interactive ports or notebook servers are exposed through
  a tunneling tool such as Bore, traffic passes through the configured Bore
  relay. The default deployment uses the public `bore.pub` relay; operators may
  configure a self-hosted relay. Do not send sensitive data through third-party
  relay infrastructure unless you accept that risk.

## 5. Information sharing and disclosure

We do not sell, rent, or trade your personal information. We disclose or
transmit information only as needed to operate the service, under applicable
law, or in the following circumstances:

- **Public ledger records:** Any on-chain payment, top-up transaction, or
  contributor withdrawal is recorded immutably on the Algorand blockchain.
- **Service providers:** Depending on deployment and selected execution lane,
  information may be processed by Neon/Postgres, Google OAuth, Modal, E2B, an
  x402 payment facilitator, Bore relay infrastructure, and hosting providers.
  Their own terms and privacy practices may also apply. Do not treat a provider
  as acting solely on Tendril's behalf unless the applicable deployment
  agreement says so.
- **Contributor nodes:** When you rent a contributor's node, that node receives
  the necessary execution payload (container image, commands, environment
  variables) to perform the requested compute task.
- **Legal and safety requirements:** We may disclose information if required by
  valid law, subpoena, regulation, or legal process, or to investigate and
  prevent imminent harm, fraud, or violations of our Terms of Service.

## 6. Cookies and local storage

Tendril does not use third-party tracking, analytics, or behavioral advertising
cookies.

We use browser **Local Storage** for functional session management:

- `tendril.session`: Stores your local authentication token, active address, and
  session metadata so you remain signed in across page reloads;
- Client-side UI state or preferences where implemented.

You can clear your browser storage at any time through your browser settings,
which will sign you out of your current session.

## 7. Data retention and deletion

- **Prepaid ledger and billing history:** Maintained as long as the account
  remains active or as required for accounting, tax, fraud-prevention, and audit
  purposes.
- **Workload outputs and artifacts:** Retained in memory for a limited polling
  and download window following job completion. Current run-result retention is
  approximately one hour, subject to bounded cache limits, after which results
  are purged.
- **Server logs:** Retention and rotation of technical and diagnostic logs
  depend on the hosting and deployment configuration.
- **Account closure and deletion requests:** You may contact us to ask about
  closing a custodial account and deleting eligible personal data. Tendril
  currently has no self-service account-deletion endpoint. Financial, security,
  fraud-prevention, tax, and audit records may need to be retained, and public
  blockchain transactions cannot be modified or deleted.

## 8. Security measures

We implement reasonable technical and organizational measures to safeguard your
data, including deployment-dependent TLS encryption in transit, cryptographic
password hashing, owner-bound and revocable API keys, and container capability
restrictions for contributor sandbox workloads. Hosted execution providers and
relay operators apply their own controls. However, no internet transmission or
distributed system is completely secure, and we cannot guarantee absolute
security.

## 9. Your rights and choices

Depending on your jurisdiction, you may have rights under applicable privacy
laws (such as GDPR or CCPA), including the right to:

- Access and inspect personal data we hold about you;
- Request correction of inaccurate information;
- Ask us to review deletion of eligible custodial account records, subject to
  retention requirements;
- Disconnect your Algorand wallet at any time; and
- Export recovery credentials for platform-managed accounts where that feature
  is enabled.

To exercise these rights, contact our support team. Confirm the applicable
deployment and account type when making a request.

## 10. Changes and contact

We may update this Privacy Policy periodically to reflect changes in our
service, legal obligations, or technical architecture. The revised policy will
be posted with an updated "Last updated" date.

Contact: **privacy@tendrilhq.com** or reach out via the [Tendril GitHub
repository](https://github.com/HimanshuM685/Tendril). Confirm that this mailbox
is monitored before publication.
