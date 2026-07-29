#!/usr/bin/env bash
# Offline host. Load agentimg from a local tar and never pull.
# Online prep: docker save ghcr.io/hambn/agentimg:latest -o agentimg.tar
set -euo pipefail

TAR="${1:-agentimg.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentimg:latest bash
