#!/usr/bin/env bash
# Rootless podman. :Z relabels the volume for SELinux hosts.
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/claude-code:latest "$@"
