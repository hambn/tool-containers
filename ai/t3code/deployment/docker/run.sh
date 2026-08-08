#!/usr/bin/env bash
# Run T3 Code web GUI on the current directory, reachable at http://localhost:3773.
# Uses the Ubuntu browser-enabled agentbloat image, which bundles the current coding agents.
set -euo pipefail

docker run -it --rm \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
