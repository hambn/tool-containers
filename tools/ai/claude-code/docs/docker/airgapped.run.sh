#!/usr/bin/env bash
# Offline host: load the image from a tar saved on an online host, never pull.
#   docker save ghcr.io/hambn/claude-code:ubuntu-browser -o claude-code.tar
set -euo pipefail
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

tar=${1:-claude-code.tar}
shift $(($# > 0 ? 1 : 0))
[[ -f "$tar" ]] || {
    echo "missing $tar; docker save it on an online host first" >&2
    exit 1
}

docker load -i "$tar"
docker run -it --rm --pull=never \
    -e ANTHROPIC_API_KEY \
    -v "$PWD:/workspace" \
    ghcr.io/hambn/claude-code:ubuntu-browser "$@"
