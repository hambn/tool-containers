# ubuntu-browser: Alibaba Open Code Review on the Ubuntu browser-enabled agentimg base.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:ubuntu-browser
FROM ${BASE_IMAGE}

USER root

ARG OCR_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["ocr"]
