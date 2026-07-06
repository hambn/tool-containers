#!/usr/bin/env bash
# Run T3 Code web GUI on the current directory, reachable at http://localhost:3773.
# Uses the agents image (Claude Code + Codex + OpenCode bundled). Auth the agent from inside
# the T3 Code UI — no API key needed here.
set -euo pipefail

docker run -it --rm \
  -p 3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:node-slim-agents "$@"
