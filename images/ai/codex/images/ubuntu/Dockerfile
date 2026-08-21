# ubuntu: OpenAI Codex CLI on the Ubuntu agentimg foundation without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:ubuntu@sha256:53933f6494d5a16e8af6285825e72424d25c9604d0acaa7dfaa952b9320d2c21
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
