#!/usr/bin/env bash

set -euxo pipefail

apk_packages=(
    # Browser runtime

    chromium                 # Chromium browser executable.
    font-noto-emoji          # Emoji font used by browser rendering.
)

apk add --no-cache "${apk_packages[@]}"
