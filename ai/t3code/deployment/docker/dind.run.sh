#!/usr/bin/env bash
# node-slim-agents-dind: T3 Code with a full Docker engine inside, so the agent can build/run
# containers itself. Needs --privileged for the inner dockerd. GUI at http://localhost:3773
#
# Alternative to DinD: drop --privileged and instead share the host daemon with
#   -v /var/run/docker.sock:/var/run/docker.sock   (the entrypoint auto-detects it).
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY (or edit this to pass OPENAI_API_KEY for Codex)}"

docker run -it --rm \
  --privileged \
  -p 3773:3773 \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v t3code-docker:/var/lib/docker \
  ghcr.io/hambn/t3code:node-slim-agents-dind "$@"
