#!/usr/bin/env bash
# Usage: install-packages.sh LIST... (one package per line, # comments allowed)
set -euo pipefail

mapfile -t packages < <(grep -hv '^\s*\(#\|$\)' "$@")

if command -v apk >/dev/null; then
    apk add --no-cache "${packages[@]}"
else
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${packages[@]}"
    rm -rf /var/lib/apt/lists/*
fi
