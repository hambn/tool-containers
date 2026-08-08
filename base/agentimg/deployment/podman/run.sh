#!/usr/bin/env bash
# Open a rootless agentimg shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
podman run -it --rm \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" zsh "$@"
