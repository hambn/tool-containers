#!/usr/bin/env bash
# Run an interactive agentbloat shell on the current directory.
set -euo pipefail

IMAGE="${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}"
docker_options=()
if [[ -n "${AGENTBLOAT_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$AGENTBLOAT_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $AGENTBLOAT_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$AGENTBLOAT_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$AGENTBLOAT_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  "$IMAGE" zsh "$@"
