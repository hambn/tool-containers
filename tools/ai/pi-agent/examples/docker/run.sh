#!/usr/bin/env bash
# Run Pi against the current directory.
set -euo pipefail

image=${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:ubuntu-browser}
docker run -it --rm \
    -v "$PWD:/workspace" \
    "$image" "$@"
