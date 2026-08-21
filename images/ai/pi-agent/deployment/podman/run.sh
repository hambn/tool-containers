#!/usr/bin/env bash
# Run Pi rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
