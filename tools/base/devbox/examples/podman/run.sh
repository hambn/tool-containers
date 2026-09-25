#!/usr/bin/env bash
# DEVBOX_VARIANT=alpine-full ./run.sh
set -euo pipefail

podman run -it --rm \
    --userns=keep-id:uid=1000,gid=1000 \
    --volume "$PWD:/workspace:Z" \
    --workdir /workspace \
    "ghcr.io/hambn/devbox:${DEVBOX_VARIANT:-ubuntu-full}" "$@"
