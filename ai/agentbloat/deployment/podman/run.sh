#!/usr/bin/env bash
# Open a rootless agentbloat shell; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
podman run -it --rm \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" bash "$@"
