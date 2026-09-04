# alpine: OpenAI Codex CLI on the Alpine agentimg foundation without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine@sha256:e4d01f9bda70bb1709b2992e2f075746278eef0a94e0915bee68f8e396e4c96c
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN apk upgrade --no-cache

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
