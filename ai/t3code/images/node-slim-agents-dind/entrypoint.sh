#!/usr/bin/env bash
# Boot dockerd (unless a host socket is already mounted), then hand off to T3 Code.
set -euo pipefail

if [ -S /var/run/docker.sock ]; then
  echo "entrypoint: host docker.sock present — using it, not starting an inner dockerd"
else
  echo "entrypoint: starting dockerd (needs --privileged)…"
  dockerd >/var/log/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
  docker info >/dev/null 2>&1 \
    && echo "entrypoint: dockerd ready" \
    || echo "entrypoint: WARNING dockerd not ready — run with --privileged? continuing without Docker" >&2
fi

# `serve` = headless mode; --host=0.0.0.0 binds all interfaces (default 127.0.0.1).
exec t3 serve --host=0.0.0.0 --port=3773 "$@"
