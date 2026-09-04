# alpine: Claude Code on the Alpine agentimg foundation without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine
FROM ${BASE_IMAGE}

USER root

ARG CLAUDE_CODE_VERSION=latest

RUN apk upgrade --no-cache

RUN npm install --global --no-fund --no-audit \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["claude"]
CMD []
