#!/usr/bin/env bash
# Offline host: load the image from a tar saved on an online host, never pull.
#   docker save ghcr.io/hambn/agentbloat:ubuntu-browser -o agentbloat.tar
set -euo pipefail

image=${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:ubuntu-browser}
tar=${1:-agentbloat.tar}
shift $(($# > 0 ? 1 : 0))
[[ -f "$tar" ]] || {
    echo "missing $tar; docker save it on an online host first" >&2
    exit 1
}

docker load -i "$tar"
docker run -it --rm --pull=never \
    -v "$PWD:/workspace" \
    "$image" "$@"
