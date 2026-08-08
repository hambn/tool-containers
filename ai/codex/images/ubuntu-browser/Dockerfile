# ubuntu-browser: OpenAI Codex CLI on the Ubuntu browser-enabled agentimg foundation.
FROM ghcr.io/hambn/agentimg:ubuntu-browser

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER agent
WORKDIR /workspace
ENTRYPOINT ["codex"]
