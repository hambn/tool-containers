#!/usr/bin/env bash
# Run Omnigent rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${OMNIGENT_IMAGE:-ghcr.io/hambn/omnigent:latest}"
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" "$@"
