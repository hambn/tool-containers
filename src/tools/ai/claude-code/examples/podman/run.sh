#!/usr/bin/env bash
# Run Claude Code rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

image=${CLAUDE_CODE_IMAGE:-ghcr.io/hambn/claude-code:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -e ANTHROPIC_API_KEY \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
