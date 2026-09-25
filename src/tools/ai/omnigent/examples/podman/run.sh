#!/usr/bin/env bash
# Run Omnigent rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${OMNIGENT_IMAGE:-ghcr.io/hambn/omnigent:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
