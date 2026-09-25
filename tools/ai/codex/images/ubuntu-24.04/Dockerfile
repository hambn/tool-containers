# syntax=docker/dockerfile:1
# codex: Ubuntu 24.04 agent on the neutral core workspace.
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${BASE_IMAGE}

USER root
ENV HOME=/root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
