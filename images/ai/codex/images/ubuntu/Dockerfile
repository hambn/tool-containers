# ubuntu: OpenAI Codex CLI on the Ubuntu agentimg foundation without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:ubuntu
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
