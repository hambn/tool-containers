#!/usr/bin/env bash
# Run Codex rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail
: "${OPENAI_API_KEY:?set OPENAI_API_KEY}"

image=${CODEX_IMAGE:-ghcr.io/hambn/codex:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -e OPENAI_API_KEY \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
