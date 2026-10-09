# Contributor agent (Linux hosts only). Build from the REPO ROOT:
#   docker build -f contributor/Dockerfile -t tendril-contributor .
#
# TENDRIL_RUNTIME=firecracker boots one jailed Firecracker microVM per lease
# (needs /dev/kvm, a guest kernel and the privileged settings on the
# `contributor` service in docker-compose.yml); TENDRIL_RUNTIME=docker runs
# legacy sibling containers on the mounted host daemon. SSH leaves through a
# per-lease relay the guest dials OUT to, so the agent opens no inbound ports.
# Native systemd alternative: docs/runtime.md.
FROM node:20-slim

WORKDIR /app

# docker CLI only (talks to the mounted host daemon to launch sandboxes).
# NOTE: Debian's `docker.io` package ships an old client (API 1.41) that modern
# daemons reject ("client version too old, minimum supported API is 1.44"), so
# install the official STATIC docker client binary (CLI only, no daemon) instead.
# The rest is what the Firecracker driver shells out to (runtime/select.ts preflight).
ARG DOCKER_CLI_VERSION=27.3.1
ARG FIRECRACKER_VERSION=v1.12.1
ARG FIRECRACKER_SHA256_X86_64=0a75e67ef6e4c540a2cf248b06822b0be9820cbba9fe19f9e0321200fe76ff6b
ARG FIRECRACKER_SHA256_AARCH64=785bc9d30756bff0c03fb275baac957363f9ba98f78a2272405dcb6929ebb953
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl openssh-client \
       iproute2 iptables e2fsprogs binutils file util-linux python3 \
    && rm -rf /var/lib/apt/lists/* \
    && arch="$(uname -m)" \
    && curl -fsSL "https://download.docker.com/linux/static/stable/${arch}/docker-${DOCKER_CLI_VERSION}.tgz" \
         | tar -xz -C /usr/local/bin --strip-components=1 docker/docker \
    && fc="firecracker-${FIRECRACKER_VERSION}-${arch}.tgz" \
    && curl -fsSLo "/tmp/${fc}" "https://github.com/firecracker-microvm/firecracker/releases/download/${FIRECRACKER_VERSION}/${fc}" \
    && case "$arch" in x86_64) sum="$FIRECRACKER_SHA256_X86_64" ;; aarch64) sum="$FIRECRACKER_SHA256_AARCH64" ;; *) exit 1 ;; esac \
    && echo "${sum}  /tmp/${fc}" | sha256sum -c - \
    && tar -xzf "/tmp/${fc}" -C /tmp \
    && install -m 0755 "/tmp/release-${FIRECRACKER_VERSION}-${arch}/firecracker-${FIRECRACKER_VERSION}-${arch}" /usr/local/bin/firecracker \
    && install -m 0755 "/tmp/release-${FIRECRACKER_VERSION}-${arch}/jailer-${FIRECRACKER_VERSION}-${arch}" /usr/local/bin/jailer \
    && rm -rf /tmp/firecracker-* /tmp/release-*
ENV FIRECRACKER_BIN=/usr/local/bin/firecracker JAILER_BIN=/usr/local/bin/jailer

# Install only the workspaces the contributor needs (uses the root lockfile).
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY contributor/package.json contributor/
RUN npm ci --workspace contributor --include-workspace-root

# Copy sources.
COPY tsconfig.base.json ./
COPY shared shared
COPY contributor contributor

COPY contributor/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start", "-w", "contributor"]
