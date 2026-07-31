# Tendril SSH sandbox image. A renter gets a plain SSH shell here — no Jupyter.
# The container dials OUT to a bore server (so no inbound port needs publishing
# on the contributor's host) and the renter connects with the printed host:port.
#
# Build (from the repo root or this dir):
#   docker build -t tendril-ssh-sandbox:latest contributor/sandbox-ssh
#
# Python 3 is included so the autonomous buyer's `docker exec python3 -` jobs
# still run against this image.
FROM python:3.12-slim

ARG BORE_VERSION=0.5.1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssh-server curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Static bore client, matched to the image arch. Use `uname -m` (the real arch of
# the image being built) rather than TARGETARCH — a plain `docker build` on the
# legacy builder never sets TARGETARCH, so the old amd64 fallback shipped an
# x86_64 binary into arm64 images → "exec format error" → the container died
# before bore could announce its endpoint.
RUN set -eux; \
    case "$(uname -m)" in \
      x86_64)        BARCH=x86_64 ;; \
      aarch64|arm64) BARCH=aarch64 ;; \
      *)             BARCH=x86_64 ;; \
    esac; \
    curl -fsSL "https://github.com/ekzhang/bore/releases/download/v${BORE_VERSION}/bore-v${BORE_VERSION}-${BARCH}-unknown-linux-musl.tar.gz" \
      | tar -xz -C /usr/local/bin bore; \
    chmod +x /usr/local/bin/bore

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# The renter's Algorand address is injected as the root password at runtime.
ENV SSH_PASSWORD=tendril
ENV BORE_SERVER=bore.pub

EXPOSE 22
ENTRYPOINT ["/entrypoint.sh"]
