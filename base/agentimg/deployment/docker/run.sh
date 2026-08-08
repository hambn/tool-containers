#!/usr/bin/env bash
# Run an interactive agentimg shell on the current directory.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
docker_options=()
if [[ -n "${AGENTIMG_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$AGENTIMG_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $AGENTIMG_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$AGENTIMG_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$AGENTIMG_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  "$IMAGE" zsh "$@"
