#!/usr/bin/env bash
# Run Codex against the current directory.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
IMAGE="${CODEX_IMAGE:-ghcr.io/hambn/codex:latest}"
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
