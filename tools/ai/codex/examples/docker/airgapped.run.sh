#!/usr/bin/env bash
# Offline host. Load Codex from a local tar and never pull.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
TAR="${1:-codex.tar}"
shift $(( $# > 0 ? 1 : 0 ))
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker load -i "$TAR"
docker run -it --rm --pull=never \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:latest "$@"
