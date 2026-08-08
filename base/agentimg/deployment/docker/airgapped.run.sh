#!/usr/bin/env bash
# Offline host. Load agentimg from a local tar and never pull.
# Online prep: docker save ghcr.io/hambn/agentimg:latest -o agentimg.tar
set -euo pipefail

TAR="${1:-agentimg.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
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

docker load -i "$TAR"
docker run -it --rm --pull=never \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentimg:latest zsh
