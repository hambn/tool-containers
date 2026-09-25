#!/usr/bin/env bash
# Open a rootless workspace shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${WORKSPACE_IMAGE:-ghcr.io/hambn/workspace:ubuntu-24.04-full}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 --user 1000:1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" zsh "$@"
