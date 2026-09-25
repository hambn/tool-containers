#!/usr/bin/env bash
# DEVBOX_VARIANT=ubuntu-full ./run.sh
set -euo pipefail

docker_options=()
if [[ -n ${DEVBOX_DOCKER_SOCKET:-} ]]; then
    [[ -S $DEVBOX_DOCKER_SOCKET ]] || {
        echo "not a Docker socket: $DEVBOX_DOCKER_SOCKET" >&2
        exit 1
    }
    docker_options+=(
        --volume "$DEVBOX_DOCKER_SOCKET:/var/run/docker.sock"
        --group-add "$(stat -c %g "$DEVBOX_DOCKER_SOCKET")"
    )
fi

docker run -it --rm \
    "${docker_options[@]}" \
    --shm-size=1g \
    --volume "$PWD:/workspace" \
    --workdir /workspace \
    "ghcr.io/hambn/devbox:${DEVBOX_VARIANT:-ubuntu-full}" "$@"
