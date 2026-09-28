#!/usr/bin/env bash
# Open a devbox shell, or run one command, with the current directory at /workspace.
set -euo pipefail

image=${DEVBOX_IMAGE:-ghcr.io/hambn/devbox:ubuntu-full}
docker_options=()
if [[ -n "${DEVBOX_DOCKER_SOCKET:-}" ]]; then
    [[ -S "$DEVBOX_DOCKER_SOCKET" ]] || {
        echo "not a Docker socket: $DEVBOX_DOCKER_SOCKET" >&2
        exit 1
    }
    docker_options+=(
        --volume "$DEVBOX_DOCKER_SOCKET:/var/run/docker.sock"
        --group-add "$(stat -c %g "$DEVBOX_DOCKER_SOCKET")"
    )
fi

# Headless Chromium in the browser tier needs more than the 64 MB default /dev/shm.
docker run -it --rm \
    "${docker_options[@]}" \
    --shm-size=1g \
    --volume "$PWD:/workspace" \
    --workdir /workspace \
    "$image" "$@"
