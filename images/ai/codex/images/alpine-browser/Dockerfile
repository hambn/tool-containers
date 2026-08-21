# alpine-browser: OpenAI Codex CLI on the Alpine browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
