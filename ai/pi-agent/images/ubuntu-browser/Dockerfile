# ubuntu-browser: Pi coding agent on the Ubuntu browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:ubuntu-browser
FROM ${BASE_IMAGE}

USER root

ARG PI_AGENT_VERSION=latest
ARG NODE_MAJOR=22

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
USER agent
ENTRYPOINT ["pi"]
