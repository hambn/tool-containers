#!/usr/bin/env bash
# Run an interactive workspace shell on the current directory.
set -euo pipefail

IMAGE="${WORKSPACE_IMAGE:-ghcr.io/hambn/workspace:ubuntu-24.04-full}"
docker_options=()
if [[ -n "${WORKSPACE_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$WORKSPACE_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $WORKSPACE_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$WORKSPACE_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$WORKSPACE_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  "$IMAGE" zsh "$@"
