#!/usr/bin/env bash
# Offline host: load the image from a tar saved on an online host, never pull.
#   docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar
set -euo pipefail

tar=${1:-t3code.tar}
shift $(($# > 0 ? 1 : 0))
[[ -f "$tar" ]] || {
    echo "missing $tar; docker save it on an online host first" >&2
    exit 1
}

docker load -i "$tar"
docker run -it --rm --pull=never \
    -p 127.0.0.1:3773:3773 \
    -v "$PWD:/workspace" \
    ghcr.io/hambn/t3code:ubuntu-browser "$@"
