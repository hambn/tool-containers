#!/usr/bin/env bash
# Run an interactive agentbloat shell rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
