# Privacy Policy

**Last updated:** October 19, 2026

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
