#!/usr/bin/env bash
# Run T3 Code web GUI on the current directory, reachable at http://localhost:3773.
# Uses the Ubuntu browser-enabled agentbloat image, which bundles the current coding agents.
set -euo pipefail

docker_options=()
if [[ -n "${T3CODE_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$T3CODE_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $T3CODE_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$T3CODE_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$T3CODE_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
