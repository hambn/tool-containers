#!/usr/bin/env bash

set -euxo pipefail

apt_packages=(
    # Browser fonts and runtime libraries

    fonts-noto-color-emoji  # Emoji font used by browser rendering.
    fonts-symbola            # Symbol font used by browser rendering.
    libgbm1                  # Generic buffer management runtime library.
    libglib2.0-0t64          # GLib runtime library.
    libgtk-3-0t64            # GTK 3 runtime library.
    libnss3                  # Network Security Services runtime library.
    libx11-6                 # X11 client runtime library.
    libxcomposite1           # X11 composite extension runtime library.
    libxdamage1              # X11 damage extension runtime library.
    libxext6                 # X11 extensions runtime library.
    libxi6                   # X11 input extension runtime library.
    libxrandr2               # X11 resize and rotate extension runtime library.
)

apt-get update
apt-get install -y --no-install-recommends "${apt_packages[@]}"
apt-get clean
rm -rf /var/lib/apt/lists/*
