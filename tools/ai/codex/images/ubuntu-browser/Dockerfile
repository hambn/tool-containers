# ubuntu-browser: OpenAI Codex CLI on the Ubuntu browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:ubuntu-browser@sha256:4f0fd79ab90a5d34c810b8aaa493ba4b7cf493f3d12b95f64451e162920b4c8c
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
