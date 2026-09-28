#!/usr/bin/env bash
# Run Pi rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
