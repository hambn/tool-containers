#!/usr/bin/env bash
# Run Pi against the current directory.
set -euo pipefail

IMAGE="${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
