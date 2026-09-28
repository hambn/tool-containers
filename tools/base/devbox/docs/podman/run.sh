#!/usr/bin/env bash
# Open a devbox shell rootlessly with the current directory at /workspace; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${DEVBOX_IMAGE:-ghcr.io/hambn/devbox:ubuntu-full}
podman run -it --rm \
    --userns=keep-id:uid=1000,gid=1000 \
    --volume "$PWD:/workspace:Z" \
    --workdir /workspace \
    "$image" "$@"
