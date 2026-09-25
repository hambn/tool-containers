#!/usr/bin/env bash
# Run Claude Code against the current directory.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

image=${CLAUDE_CODE_IMAGE:-ghcr.io/hambn/claude-code:ubuntu-browser}
docker run -it --rm \
    -e ANTHROPIC_API_KEY \
    -v "$PWD:/workspace" \
    "$image" "$@"
