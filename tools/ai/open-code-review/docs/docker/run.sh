#!/usr/bin/env bash
# Run Open Code Review against the current directory.
set -euo pipefail

image=${OPEN_CODE_REVIEW_IMAGE:-ghcr.io/hambn/open-code-review:ubuntu-browser}
docker run -it --rm \
    -v "$PWD:/workspace" \
    "$image" "$@"
