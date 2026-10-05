# P1: Linux microVM runtime

Contributor leases use Firecracker as isolation boundary. OCI images package guest
userspace; Docker export happens once during contributor startup, before listing.
Each paid lease copies a cached, immutable ext4 template and injects credentials
offline. Release deletes the writable clone, keys, chroot, cgroup, network
namespace/TAP, relay listeners and proxy mappings. Guest filesystems are never
shared with the host.

This boundary applies to `runtime=microvm` nodes. Legacy Docker uses the host kernel
and advertises SSH/Python only. Public SSH from both runtimes uses the same per-lease
TLS relay; `BORE_SERVER`/`BORE_SECRET` remain compatibility fields for older agents.

## Runtime selection and capabilities

`TENDRIL_RUNTIME=auto|docker|firecracker`:

- `auto`: successful preflight/cache build selects microVM; failure selects legacy
  Docker with SSH/Python only, outside Explore's default filter.
- `docker`: explicit legacy runtime.
- `firecracker`: missing prerequisites fail process startup. A lease never retries
  on Docker or Modal after Firecracker provisioning fails.

Orphan-recovery failure refuses registration even in auto mode, so incomplete
teardown cannot make a node available for new work. Known VM cleanup metadata also
blocks Docker fallback/switching when Firecracker prerequisites are unavailable;
restore prerequisites and restart to reconcile those resources.

Heartbeats publish `runtime`, strict boolean `kvm`, and `capabilities`:
`ssh`, `python`, `notebook`, `jupyter`. Missing fields in a capabilities map are
false. Agents without a map retain legacy SSH/Python support. Capability decides
eligibility; idle, connected microVMs have placement priority. Configured Modal
inventory stays listed and SKUs are not single-peer reservations.

## Native contributor prerequisites

Use a native Linux host with writable `/dev/kvm`, root-run agent/jailer, cgroup v2
CPU/memory/PID controllers, Docker for image packaging, and these host tools:

```sh
sudo apt-get install iproute2 iptables e2fsprogs binutils file openssh-client util-linux python3
sudo sysctl -w net.ipv4.ip_forward=1
sudo useradd --system --no-create-home --shell /usr/sbin/nologin tendril-vmm
id -u tendril-vmm
id -g tendril-vmm
```

Reserve `10.201.0.0/16` for guest uplinks and `10.202.0.0/16` on relay host. Each
guest namespace has its own `10.200.0.0/30` TAP subnet. Namespace-local NAT and
forwarding permit ordinary outbound downloads. Explicit lease-owned host NAT/
forwarding rules connect the namespace to host uplink; teardown removes them.
TAPs are not LAN bridges. Contributor agent opens no inbound TCP ports.

Install matching **Firecracker and jailer v1.12.1**, statically linked musl builds,
from the upstream release and verify its published checksum. Use absolute paths
in `FIRECRACKER_BIN` and `JAILER_BIN`.

Build pinned guest kernel from Linux **v6.1.128** and Firecracker **v1.12.1** source:

```sh
KERNEL_SOURCE=/opt/build/linux \
FIRECRACKER_SOURCE=/opt/build/firecracker \
KERNEL_OUTPUT=/opt/tendril-kernel/vmlinux \
  sh deploy/contributor/build-kernel.sh
```

Script uses architecture-specific upstream guest config and `LOCALVERSION=-tendril`.
Guest `uname -r` must end in `-tendril` and differ from host. x86_64 uses vmlinux;
aarch64 uses Image. No GPU passthrough is configured.

Create `/etc/tendril/contributor.env`, mode 0600, with API key and runtime paths:

```dotenv
TENDRIL_API_KEY=<minted key>
TENDRIL_RUNTIME=firecracker
GUEST_KERNEL=/opt/tendril-kernel/vmlinux
FIRECRACKER_BIN=/usr/local/bin/firecracker
JAILER_BIN=/usr/local/bin/jailer
JAILER_UID=<id -u tendril-vmm>
JAILER_GID=<id -g tendril-vmm>
```

`deploy/contributor/tendril-contributor.service` targets systemd >=254 and checkout
at `/opt/tendril`. `DelegateSubgroup=agent` places daemon processes separately
from `/vms` so cgroup v2's no-internal-process rule holds. `KillMode=control-group`
also covers VMMs. For manual execution, use `TENDRIL_CGROUP_PARENT=tendril`.

State defaults to root-owned mode-0700 `/var/lib/tendril`: immutable templates in
`cache/`, cleanup metadata/private keys in `leases/`, per-lease disks in `jail/`.
Host disk inode belongs to jailer UID. Guest files retain guest ownership; init
runs as UID 0. CPU quota, VMM memory plus `VMM_OVERHEAD_MIB` (128 default), host
PID/FD caps, guest ulimits, and fixed disk size bound resources. Host `pids.max`
limits VMM threads, not guest tasks.

Template identity includes OCI image ID, format, architecture and size. Bundled
OCI image tag also hashes guest scripts. Restart picks up image/script changes.
Explicit custom `SANDBOX_IMAGE` must already contain guest init, Jupyter and runner.
An unprepared image requested during a paid lease fails rather than exporting.

## Platform bore/TLS relay

Run relay manager as a separate native service beside backend. Backend controls it
through Unix IPC; no public HTTP administration endpoint is added. Use a dedicated
unprivileged bore account and **bore 0.5.1**. Manager creates isolated per-lease
bore servers with unique secrets, exact listener ports and network namespaces.

Configure wildcard DNS pointing to relay host:

- `*.control.example.com`: TLS-wrapped bore control/data connections, port 9443.
- `*.ssh.example.com`: SSH, ports 20000–24999.
- `*.lab.example.com`: HTTPS/WSS Jupyter, port 443, `base_url=/`.

Provide trusted TLS certificate covering control and lab wildcards. Private key
stays on relay. Guest TLS bridge verifies certificate chain and hostname using
guest CA store. Notebook raw listener ports 25000–29999 exist only in private
relay namespaces; backend accesses them directly on the same host.

Copy `deploy/bore-relay/relay.env.example` to `/etc/tendril/relay.env` (0600), fill
domains/certificate paths/account IDs, and install accompanying systemd unit.
Give backend group traverse permission on `/run/tendril-relay` and access to
mode-0660 control socket (`RELAY_BACKEND_GID`). Set backend `RELAY_SOCKET` to same
path. Domain wildcard and certificate renewals are operator-managed; restart relay
after certificate renewal, which reconciles old allocations.

Backend must share the relay host's network namespace to reach private notebook
listeners. Stock Compose/PaaS backend examples do not configure this topology.
The contributor container includes Docker CLI and OpenSSH client, but remains legacy
Docker; deploy the native contributor service for Firecracker.

Both SSH and Jupyter run inside guest. SSH commands retain host-key checking.
Interactive Jupyter uses an explicit Open notebook click after renting. Notebook
uploads/results use existing guest Jupyter Contents HTTP API, not agent Socket.IO.
Agent receives job references and executes papermill over private TAP. One-shot
Python opens no public tunnel; one-shot notebooks use backend-only transport.
Jupyter token is in memory/ephemeral guest disk, never logged or stored in Neon.

## Release and failures

First Release/watchdog close signal freezes `endedAt` and status becomes `stopping`.
Peer remains reserved until guest **and relay** acknowledge destruction. Teardown
latency does not increase billed seconds. Cleanup failure returns `503
cleanup_pending`; retry joins/resumes close without changing cutoff. Charge and
earnings idempotency keys are lease ID. `payoutBlocked` skips earnings credit only;
402 payment recipient remains `PLATFORM_PAYTO`.

SSH authentication or authenticated Jupyter status plus kernel WebSocket roundtrip
must pass before activation/settlement. Late readiness is destroyed. Abandoned or
unstarted attempts create no usage charge. Agent disconnect destroys guests
locally and replays cleanup receipts on reconnect. Agent/relay startup reconcile
orphan metadata before accepting work.

## Verification

Default CI needs no KVM, database, funded wallet, or privileged networking:

```sh
npm run typecheck
npm run test:p1
npm run build -w web
docker build -t tendril-p1-guest contributor/sandbox-ssh
docker run --rm -i --entrypoint python3 tendril-p1-guest < tests/guest-smoke.py
docker build -f contributor/Dockerfile -t tendril-p1-agent .
docker run --rm --entrypoint ssh tendril-p1-agent -V
```

OCI smoke checks Python/deadline cleanup, notebook/artifacts, Jupyter kernel WebSocket
roundtrip and real legacy SSH key/password authentication. Socket tests cover owner
checks, large bounded stdout, late readiness and reconnect cleanup receipts.

Real-kernel gate is opt-in. Run on dedicated native Linux/KVM test host with relay
running locally, trusted wildcard DNS/TLS, matching binaries and pinned kernel:

```sh
sudo env TENDRIL_KVM_TEST=1 TENDRIL_RUNTIME=firecracker \
  GUEST_KERNEL=/opt/tendril-kernel/vmlinux \
  FIRECRACKER_BIN=/usr/local/bin/firecracker JAILER_BIN=/usr/local/bin/jailer \
  JAILER_UID=<uid> JAILER_GID=<gid> TENDRIL_CGROUP_PARENT=tendril-tests \
  RELAY_SOCKET=/run/tendril-relay/control.sock npm run test:p1:kvm
```

Harness uses real HTTP/agent sockets, guest kernel/disks/jailer/networking and relay.
Payment/ledger fixtures spend no real funds. Dedicated state is deleted after test.
It asserts distinct kernel, startup-only export, disk ownership/caps, SSH/Jupyter/
notebook artifacts, concurrent Release cutoff, failed-boot no-fallthrough,
Release-during-copy cancellation, disconnect receipts, and listener/resource removal.
Without opt-in, command reports skipped; this is not a passed kernel gate.

PostgreSQL charge/earnings replay is separately covered by `backend/src/db.test.ts`.
It can run against disposable local PostgreSQL as well as a Neon test database;
initialize both network schemas with `initDb()` before running the isolation check.
Run `ALGORAND_NETWORK=testnet npx tsx backend/src/db.test.ts` with that test
`DATABASE_URL`. KVM harness does not certify on-chain settlement.
