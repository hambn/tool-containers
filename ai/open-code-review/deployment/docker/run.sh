#!/usr/bin/env bash
# Run OCR against the current directory.
set -euo pipefail

IMAGE="${OCR_IMAGE:-ghcr.io/hambn/open-code-review:latest}"
docker run -it --rm \
  -v "$PWD:/workspace" \
  "$IMAGE" "$@"
