# Security & Sandboxes

Tendril runs renter workloads in disposable Docker containers on contributor machines. Those machines are often personal laptops and desktops, so the sandbox is built on the assumption that the renter is hostile. This page lists the controls as they are actually applied by the contributor agent, and what they do not cover.

## Who the renter is

- The renter is the unprivileged user `tendril` (uid 1000) inside the container. There is no root inside the sandbox: even sshd runs as that user. A container escape would land on the host as uid 1000, not root.
- Every Linux capability is dropped (`--cap-drop ALL`) with none added back.
- `no-new-privileges` is set, so setuid binaries cannot raise privileges.
- Docker's default seccomp syscall filter applies. The agent checks the daemon reports one at start-up and warns if it does not.

## Filesystem

- The image is mounted read-only. The only writable paths are `/work` (home) and `/tmp`, which are RAM-backed `tmpfs` mounts with a size cap (`SANDBOX_DISK`, default 1 GiB, never more than the memory limit) and `nosuid,nodev`. Because they are RAM, what a renter writes there counts against the sandbox's memory limit; overfilling it gets the writing process killed, not the host's disk filled.
- Nothing the renter writes reaches the host disk, and nothing persists past the lease.
- No host directories are ever mounted into a sandbox.
- Container logs use the `local` driver with a size cap, so writing to the container's stdout cannot fill the host disk.

## Resources

- Hard cgroup limits for memory (swap disabled), CPU, and process count, plus a file-size rlimit.
- The registry asks for resources per lease, but the contributor's own `SANDBOX_MEMORY`, `SANDBOX_CPUS`, and `SANDBOX_GPUS` are ceilings. The registry can ask for less, never more.
- GPU passthrough is opt-in per contributor. It mounts driver libraries and device nodes into the sandbox, which widens the attack surface, so a machine advertises a GPU only when its operator sets `SANDBOX_GPUS`.

## Network

- Sandboxes attach to a private bridge network with inter-container communication disabled: one renter's sandbox cannot reach another's.
- A per-lease **guard** container, sharing only the sandbox's network namespace, installs netfilter rules before anything untrusted runs. From inside the sandbox, the contributor host, its LAN (`10/8`, `172.16/12`, `192.168/16`), link-local and cloud metadata addresses (`169.254/16`, `100.64/10`), multicast, and the IPv6 equivalents are refused. DNS and the bore relay are allowed; the public internet (package indexes, APIs) stays reachable.
- The sandbox has no `CAP_NET_ADMIN`, so it cannot change those rules. If the rules cannot be installed, the sandbox is torn down rather than started open. An operator on an isolated machine can disable this with `SANDBOX_NET_GUARD=off`, which the agent logs as a warning.
- The bore client that exposes SSH runs in the guard container as uid 1000 with no capabilities. The platform's relay secret (`BORE_SECRET`) is never present inside the sandbox.
- In bore mode no inbound port is published on the contributor's host; the guard dials out. In local mode SSH is published on `127.0.0.1` only.

## Images

- A contributor runs only the image it was configured with (`SANDBOX_IMAGE`, by default the bundled one built locally) or images it explicitly listed in `SANDBOX_ALLOWED_IMAGES`. A lease that names any other image is refused before `docker run`, so a compromised registry cannot make contributors pull arbitrary images.
- The bundled image's tag includes a content hash of its Dockerfile and entrypoint, so a change rebuilds it and a stale build is never used.

## SSH

- Public-key only. The renter's key is written to the sandbox at start; password authentication, PAM, X11 and agent forwarding, and tunnelling are disabled in sshd.
- Login is restricted to `tendril`. Root login is refused.
- Host keys are generated per sandbox and discarded with it.

## Credentials

Contributor daemons hold an API key rather than a wallet private key. The account that mints a key owns its registered nodes and accumulates their earnings. Session tokens, lease tokens, API keys, and x402 payment signatures have distinct purposes; see [Authentication](/docs/api#authentication).

## Teardown & persistence

Sandboxes and their guards are destroyed when the lease closes, and any left behind by an agent crash are removed when the agent next starts. Files inside them do not persist across sessions. Save outputs before release or the end of a grace window.

## What this does not cover

- **Shared kernel.** Containers share the host kernel. A kernel vulnerability can still escape a container; only a VM boundary (Firecracker, gVisor) closes that, and those need KVM, which many contributor machines lack. The controls above are there to make an escape land as an unprivileged user on an isolated network, not to make it impossible.
- **GPU passthrough** adds the driver stack to the attack surface. Opt in knowingly.
- **The agent itself** talks to the Docker daemon, which is equivalent to root on the host. Run it from a trusted checkout and keep `TENDRIL_API_KEY` private.
