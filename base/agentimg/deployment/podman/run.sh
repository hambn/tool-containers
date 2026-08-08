#!/usr/bin/env bash
# Open a rootless agentimg shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 --user 1000:1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" bash "$@"
