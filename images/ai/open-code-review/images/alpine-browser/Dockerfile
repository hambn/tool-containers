# alpine-browser: Alibaba Open Code Review on the Alpine browser-enabled agentimg base.
FROM ghcr.io/hambn/agentimg:alpine-browser

USER root

ARG OCR_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
