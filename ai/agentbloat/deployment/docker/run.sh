#!/usr/bin/env bash
# Run an interactive agentbloat shell on the current directory.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" bash "$@"
