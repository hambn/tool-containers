#!/usr/bin/env bash
# Prepare Codex auth/config from env (non-destructive — mounted login/config always wins), then
# start t3.
set -euo pipefail

codex_dir="${CODEX_HOME:-$HOME/.codex}"
install -d -m 700 "$codex_dir"

# API key: write ${CODEX_HOME}/auth.json from OPENAI_API_KEY so Codex authenticates without an
# interactive `codex login`. Skipped if an auth.json is already present (e.g. a mounted login).
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

# Claude Code / OpenCode read their key straight from env (ANTHROPIC_API_KEY / OPENAI_API_KEY).

exec t3 serve --host=0.0.0.0 --port=3773 "$@"
