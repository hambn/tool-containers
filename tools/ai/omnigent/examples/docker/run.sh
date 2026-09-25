#!/usr/bin/env bash
# Run Omnigent against the current directory.
set -euo pipefail

IMAGE="${OMNIGENT_IMAGE:-ghcr.io/hambn/omnigent:ubuntu-24.04}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
