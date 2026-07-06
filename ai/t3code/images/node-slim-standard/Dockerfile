# node-slim-standard: T3 Code web GUI (npm) + git on Node Debian slim. Smallest usable image.
# t3 pulls in node-pty, which has no prebuilt binary for this Node — it compiles from source, so
# python3 + a C toolchain are needed to install and then purged. The compiled addon only needs
# libstdc++6 at runtime, which the slim base already carries.
# T3 Code is a GUI *over* coding agents and ships none itself — mount an authed agent from the
# host, or use the node-slim-agents variant which bundles Claude Code / Codex / OpenCode.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim

ARG T3_VERSION=latest

# git: T3 Code drives a git worktree per thread. ca-certificates for TLS.
# build-essential + python3: node-gyp compiles node-pty, purged after so they don't ship.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && apt-get install -y --no-install-recommends build-essential python3 \
    && npm install -g t3@${T3_VERSION} \
    && npm cache clean --force \
    && apt-get purge -y --auto-remove build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspace

# Web GUI + WebSocket server. HOST/PORT bind it to all interfaces so the published port
# is reachable from the host (server defaults to 127.0.0.1:3773).
# ponytail: env, not a flag — flag names are unstable this early; HOST/PORT are read via config.
ENV HOST=0.0.0.0 \
    PORT=3773
EXPOSE 3773
ENTRYPOINT ["t3"]
