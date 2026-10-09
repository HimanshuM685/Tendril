# Security & Sandboxes

Tendril separates renter workloads from contributor hosts using constrained, disposable Docker containers.

## Isolation controls

- No host filesystem mounts.
- Linux capabilities dropped with `CAP_DROP=ALL`.
- `no-new-privileges` enforced.
- Hard cgroup CPU and RAM limits and a maximum PID count.
- No direct shell access to the contributor host.

## Network access

The sandbox's bore client creates an outbound relay connection. Renters use SSH into the sandbox through its allocated relay port. Contributors do not open incoming router ports for each lease.

## Credentials

Contributor daemons hold API keys rather than wallet private keys. The account that mints a key owns its registered nodes and accumulates their earnings. Session tokens, lease tokens, API keys, and x402 payment signatures have distinct purposes; see [Authentication](/docs/api#authentication).

## Teardown & persistence

Sandboxes are destroyed when the lease closes. Files inside them do not persist across sessions. Save outputs before release or the end of a grace window.
