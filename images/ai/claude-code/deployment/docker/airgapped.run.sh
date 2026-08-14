#!/usr/bin/env bash
# Offline host. Loads image from a local tar, never pulls.
# Prep on an online host: docker save ghcr.io/hambn/claude-code:latest -o claude-code.tar
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

TAR="${1:-claude-code.tar}"
[ -f "$TAR" ] || { echo "missing $TAR — docker save it on an online host first" >&2; exit 1; }

docker load -i "$TAR"
docker run -it --rm \
  --pull=never \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest
