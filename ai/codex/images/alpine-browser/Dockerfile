# alpine-browser: OpenAI Codex CLI on the Alpine browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
USER agent
ENTRYPOINT ["codex"]
