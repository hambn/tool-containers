# node-slim-agents: T3 Code + the npm coding agents it drives (Claude Code, Codex, OpenCode),
# pre-installed so the GUI works out of the box. Auth is stateless via env keys — ANTHROPIC_API_KEY
# for Claude, OPENAI_API_KEY for Codex — no login and no mounted auth dirs, so the container stays
# fully isolated. The entrypoint materializes the Codex api-key auth file from the env var at
# startup (ephemeral, wiped on container removal).
# ponytail: Cursor's agent is a curl installer, not npm — left out; add it if you use Cursor.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim

ARG T3_VERSION=latest
ARG GH_VERSION=2.96.0
ARG DEBIAN_FRONTEND=noninteractive

# A real toolchain the agents shell out to: git/gh/ssh for VCS, python + build-essential for
# native builds and running generated code, network + inspection tools for debugging, tini to reap
# the agent subprocesses t3 spawns, plus the everyday CLI kit (jq, ripgrep, fd, tmux, ...).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git ca-certificates curl wget \
        openssh-client rsync \
        ripgrep fd-find \
        python3 python3-pip python3-venv \
        build-essential pkg-config make \
        jq unzip zip xz-utils \
        less vim nano tmux \
        iputils-ping iproute2 dnsutils net-tools netcat-openbsd socat \
        tree htop file gnupg sqlite3 \
        bubblewrap tini tzdata \
        procps \
    && curl -fsSLo /tmp/gh.deb "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_amd64.deb" \
    && apt-get install -y --no-install-recommends /tmp/gh.deb \
    && rm -f /tmp/gh.deb \
    && npm install -g \
        t3@${T3_VERSION} \
        @anthropic-ai/claude-code \
        @openai/codex \
        opencode-ai \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*

# Codex: force api-key auth so it uses OPENAI_API_KEY / the auth file, never ChatGPT login.
ENV CODEX_HOME=/home/node/.codex
RUN mkdir -p "$CODEX_HOME" \
    && printf 'preferred_auth_method = "apikey"\n' > "$CODEX_HOME/config.toml" \
    && chown -R node:node "$CODEX_HOME"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER node
WORKDIR /workspace
# `serve` = headless mode; --host=0.0.0.0 binds all interfaces (default 127.0.0.1). tini is PID 1
# so orphaned agent subprocesses get reaped.
EXPOSE 3773
ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]
