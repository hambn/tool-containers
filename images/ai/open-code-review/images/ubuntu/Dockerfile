# ubuntu: Alibaba Open Code Review on the Ubuntu agentimg base without a browser.
FROM ghcr.io/hambn/agentimg:ubuntu

USER root

ARG OCR_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
