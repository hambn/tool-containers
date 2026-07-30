#!/usr/bin/env bash
# Run Codex rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"
IMAGE="${CODEX_IMAGE:-ghcr.io/hambn/codex:latest}"
podman run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
