# syntax=docker/dockerfile:1
# pi-agent: Ubuntu 24.04 agent on the neutral core workspace.
ARG BASE_IMAGE=ghcr.io/hambn/workspace:ubuntu-24.04-core
FROM ${BASE_IMAGE}

USER root
ENV HOME=/root

ARG PI_AGENT_VERSION=latest

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

ENV HOME=/home/sysadmin
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["pi"]
