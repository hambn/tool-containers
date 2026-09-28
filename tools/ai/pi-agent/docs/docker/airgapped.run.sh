#!/usr/bin/env bash
# Offline host: load the image from a tar saved on an online host, never pull.
#   docker save ghcr.io/hambn/pi-agent:ubuntu-browser -o pi-agent.tar
set -euo pipefail

tar=${1:-pi-agent.tar}
shift $(($# > 0 ? 1 : 0))
[[ -f "$tar" ]] || {
    echo "missing $tar; docker save it on an online host first" >&2
    exit 1
}

docker load -i "$tar"
docker run -it --rm --pull=never \
    -v "$PWD:/workspace" \
    ghcr.io/hambn/pi-agent:ubuntu-browser "$@"
