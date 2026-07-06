#!/usr/bin/env bash
# Rootless podman. :Z relabels the volume for SELinux hosts. GUI at http://localhost:3773
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY (or edit this to pass OPENAI_API_KEY for Codex)}"

podman run -it --rm \
  -p 3773:3773 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/t3code:node-slim-agents "$@"
