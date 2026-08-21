# alpine: OpenAI Codex CLI on the Alpine agentimg foundation without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
