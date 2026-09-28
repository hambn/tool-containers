#!/usr/bin/env bash
# Run Omnigent against the current directory.
set -euo pipefail

image=${OMNIGENT_IMAGE:-ghcr.io/hambn/omnigent:ubuntu-browser}
docker run -it --rm \
    -v "$PWD:/workspace" \
    "$image" "$@"
