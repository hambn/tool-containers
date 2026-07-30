#!/usr/bin/env bash
# Run Pi rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}"
podman run -it --rm \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
