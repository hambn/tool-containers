#!/usr/bin/env bash
# T3 Code web GUI over the current directory → open http://localhost:3773
# Uses the agents image (Claude Code + Codex + OpenCode bundled). Auth the agent you want:
# ANTHROPIC_API_KEY for Claude, OPENAI_API_KEY for Codex (or log in from the UI).
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY (or edit this to pass OPENAI_API_KEY for Codex)}"

docker run -it --rm \
  -p 3773:3773 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:node-slim-agents "$@"
