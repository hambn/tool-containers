#!/usr/bin/env bash
# Offline host. Load workspace from a local tar and never pull.
# Online prep: docker save ghcr.io/hambn/workspace:ubuntu-24.04-full -o workspace.tar
set -euo pipefail

TAR="${1:-workspace.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
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

docker load -i "$TAR"
docker run -it --rm --pull=never \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/workspace:ubuntu-24.04-full zsh
