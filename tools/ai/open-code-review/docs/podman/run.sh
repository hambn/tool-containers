#!/usr/bin/env bash
# Run Open Code Review rootlessly against the current directory; :Z relabels it on SELinux hosts.
set -euo pipefail

image=${OPEN_CODE_REVIEW_IMAGE:-ghcr.io/hambn/open-code-review:ubuntu-browser}
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
    -v "$PWD:/workspace:Z" \
    "$image" "$@"
