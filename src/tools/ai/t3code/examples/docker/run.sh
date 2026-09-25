#!/usr/bin/env bash
# Run the T3 Code web GUI on http://127.0.0.1:3773 against the current directory.
set -euo pipefail

image=${T3CODE_IMAGE:-ghcr.io/hambn/t3code:ubuntu-browser}
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
    "$image" "$@"
