# ubuntu-browser: Alibaba Open Code Review on the Ubuntu browser-enabled agentimg base.
FROM ghcr.io/hambn/agentimg:ubuntu-browser

ARG OCR_VERSION=latest
ARG NODE_MAJOR=22

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

WORKDIR /workspace
