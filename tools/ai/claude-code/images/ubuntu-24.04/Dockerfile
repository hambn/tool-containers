# syntax=docker/dockerfile:1
# claude-code: Ubuntu 24.04 agent on the neutral core workspace.
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${BASE_IMAGE}

USER root
ENV HOME=/root

ARG CLAUDE_CODE_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    npm cache clean --force

ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["claude"]
CMD []
