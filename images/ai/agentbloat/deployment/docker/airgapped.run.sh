#!/usr/bin/env bash
# Offline host. Load agentbloat from a local tar and never pull.
set -euo pipefail

TAR="${1:-agentbloat.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentbloat:latest bash
