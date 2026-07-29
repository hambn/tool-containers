#!/usr/bin/env bash
# Run an interactive agentimg shell on the current directory.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" bash "$@"
