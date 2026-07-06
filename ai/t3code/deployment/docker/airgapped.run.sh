#!/usr/bin/env bash
# Offline host. Loads image from a local tar, never pulls.
# Prep on an online host: docker save ghcr.io/hambn/t3code:node-slim-agents -o t3code.tar
set -euo pipefail

TAR="${1:-t3code.tar}"
[ -f "$TAR" ] || { echo "missing $TAR — docker save it on an online host first" >&2; exit 1; }

docker load -i "$TAR"
docker run -it --rm \
  --pull=never \
  -p 3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:node-slim-agents
