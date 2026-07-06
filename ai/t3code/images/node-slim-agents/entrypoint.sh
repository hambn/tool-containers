#!/usr/bin/env bash
# Materialize agent auth from env (stateless — no login, no mounted auth dir), then start t3.
set -euo pipefail

# Codex reads its key from ${CODEX_HOME}/auth.json. Write it from OPENAI_API_KEY so Codex
# authenticates without an interactive `codex login` or a persisted volume. Ephemeral: it lives
# in the container's writable layer and is gone on `docker rm`.
if [ -n "${OPENAI_API_KEY:-}" ]; then
  install -d -m 700 "${CODEX_HOME:-$HOME/.codex}"
  printf '{"OPENAI_API_KEY":"%s","tokens":null,"last_refresh":null}\n' "$OPENAI_API_KEY" \
    > "${CODEX_HOME:-$HOME/.codex}/auth.json"
  chmod 600 "${CODEX_HOME:-$HOME/.codex}/auth.json"
fi
# Claude Code and OpenCode read their key straight from the env (ANTHROPIC_API_KEY /
# OPENAI_API_KEY), so nothing to materialize for them.

exec t3 serve --host=0.0.0.0 --port=3773 "$@"
