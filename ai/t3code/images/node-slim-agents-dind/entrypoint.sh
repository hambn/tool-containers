#!/usr/bin/env bash
# Boot dockerd (unless a host socket is already mounted), prepare Codex auth/config from env
# (non-destructive — mounted login/config wins), then hand off to T3 Code.
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

codex_dir="${CODEX_HOME:-$HOME/.codex}"
install -d -m 700 "$codex_dir"

# API key: write auth.json from OPENAI_API_KEY (skipped if a login/auth.json is already mounted).
if [ ! -f "$codex_dir/auth.json" ] && [ -n "${OPENAI_API_KEY:-}" ]; then
  printf '{"OPENAI_API_KEY":"%s","tokens":null,"last_refresh":null}\n' "$OPENAI_API_KEY" \
    > "$codex_dir/auth.json"
  chmod 600 "$codex_dir/auth.json"
fi

# Custom endpoint (e.g. OpenRouter): point Codex's openai provider at OPENAI_BASE_URL. wire_api=chat
# because non-OpenAI gateways serve /chat/completions, not OpenAI's /responses API. Skipped if you
# mount your own config.toml.
if [ -n "${OPENAI_BASE_URL:-}" ] && [ ! -f "$codex_dir/config.toml" ]; then
  printf '[model_providers.openai]\nbase_url = "%s"\nwire_api = "chat"\n' "$OPENAI_BASE_URL" \
    > "$codex_dir/config.toml"
fi

# `serve` = headless mode; --host=0.0.0.0 binds all interfaces (default 127.0.0.1).
exec t3 serve --host=0.0.0.0 --port=3773 "$@"
