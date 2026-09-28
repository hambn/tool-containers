#!/usr/bin/env bash
# Run the T3 Code web GUI on http://127.0.0.1:3773 rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${T3CODE_IMAGE:-ghcr.io/hambn/t3code:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -p 127.0.0.1:3773:3773 \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
