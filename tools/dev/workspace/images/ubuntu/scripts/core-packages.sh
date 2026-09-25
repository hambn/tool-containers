#!/usr/bin/env bash
set -euo pipefail
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    bash build-essential ca-certificates curl git jq openssh-client python3 python3-pip tar xz-utils
rm -rf /var/lib/apt/lists/*
