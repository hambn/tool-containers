#!/usr/bin/env bash
# Offline host. Load Pi from a local tar and never pull.
set -euo pipefail

TAR="${1:-pi-agent.tar}"
shift $(( $# > 0 ? 1 : 0 ))
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:latest "$@"
