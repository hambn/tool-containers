#!/usr/bin/env bash
set -euo pipefail

profile="${1:-alpine-3.21-minimal}"
case "$profile" in
    alpine-3.21-minimal|ubuntu-24.04-minimal) ;;
    *) echo "unsupported runtime profile: $profile" >&2; exit 2 ;;
esac

docker run --rm --cap-drop ALL --read-only \
    --tmpfs /tmp:rw,nosuid,nodev \
    "ghcr.io/hambn/runtime:$profile" \
    /bin/sh -ec 'test "$(id -u)" = 1000; command -v curl; curl --version'
