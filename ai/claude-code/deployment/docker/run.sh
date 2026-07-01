#!/usr/bin/env bash
# Run Claude Code on the current directory.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:latest "$@"
