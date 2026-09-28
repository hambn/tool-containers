#!/usr/bin/env bash
# Open a core shell, or run one command, with the current directory at /workspace.
set -euo pipefail

image=${CORE_IMAGE:-ghcr.io/hambn/core:wolfi}
docker run -it --rm \
    -v "$PWD:/workspace" \
    -w /workspace \
    "$image" "$@"
