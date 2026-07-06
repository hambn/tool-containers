#!/usr/bin/env bash
# Boot dockerd (unless a host socket is already mounted), materialize agent auth from env, then
# hand off to T3 Code.
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

# Codex reads its key from ${CODEX_HOME}/auth.json. Write it from OPENAI_API_KEY so Codex
# authenticates without an interactive `codex login` or a persisted volume (ephemeral file).
if [ -n "${OPENAI_API_KEY:-}" ]; then
  install -d -m 700 "${CODEX_HOME:-$HOME/.codex}"
  printf '{"OPENAI_API_KEY":"%s","tokens":null,"last_refresh":null}\n' "$OPENAI_API_KEY" \
    > "${CODEX_HOME:-$HOME/.codex}/auth.json"
  chmod 600 "${CODEX_HOME:-$HOME/.codex}/auth.json"
fi

# `serve` = headless mode; --host=0.0.0.0 binds all interfaces (default 127.0.0.1).
exec t3 serve --host=0.0.0.0 --port=3773 "$@"
