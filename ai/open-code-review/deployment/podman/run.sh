#!/usr/bin/env bash
# Run OCR rootlessly against the current directory; :Z supports SELinux hosts.
set -euo pipefail

IMAGE="${OCR_IMAGE:-ghcr.io/hambn/open-code-review:latest}"
podman run -it --rm \
  -v "$PWD:/workspace:Z" \
  "$IMAGE" ocr "$@"
