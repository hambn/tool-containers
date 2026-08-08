# ubuntu-browser: Alibaba Open Code Review on the Ubuntu browser-enabled agentimg base.
FROM ghcr.io/hambn/agentimg:ubuntu-browser

USER root

ARG OCR_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

USER agent
WORKDIR /workspace
