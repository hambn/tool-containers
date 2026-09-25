#!/usr/bin/env bash
# CORE_VARIANT=ubuntu ./run.sh
set -euo pipefail

docker run -it --rm \
    -v "$PWD:/workspace" \
    -w /workspace \
    "ghcr.io/hambn/core:${CORE_VARIANT:-wolfi}" "$@"
