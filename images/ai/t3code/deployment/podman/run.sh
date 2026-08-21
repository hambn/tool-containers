#!/usr/bin/env bash
# Rootless podman. :Z relabels the volume for SELinux hosts. GUI at http://localhost:3773
# Auth the agent from inside the T3 Code UI — no API key needed here.
set -euo pipefail

podman run -it --rm --userns=keep-id:uid=1000,gid=1000 \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace:Z" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
