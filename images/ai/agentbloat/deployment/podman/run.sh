#!/usr/bin/env bash
# Open a rootless agentbloat shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" zsh "$@"
