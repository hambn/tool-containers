# node-slim-agents: T3 Code + the npm coding agents it drives (Claude Code, Codex, OpenCode),
# pre-installed so the GUI works out of the box. Auth each agent from inside the T3 Code UI
# (or log into the agent CLI in the container); no API-key env needed.
# ponytail: Cursor's agent is a curl installer, not npm — left out; add it if you use Cursor.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim

ARG T3_VERSION=latest

# A real toolchain the agents shell out to: git/ssh for VCS, python + build-essential for
# native builds and running generated code, network + inspection tools for debugging, plus the
# everyday CLI kit (jq, ripgrep, fd, curl, wget, unzip, less, vim, tmux, ...).
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
        bubblewrap \
        ca-certificates procps \
    && npm install -g \
        t3@${T3_VERSION} \
        @anthropic-ai/claude-code \
        @openai/codex \
        opencode-ai \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspace
# `serve` = headless mode; --host=0.0.0.0 binds all interfaces (default 127.0.0.1).
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
