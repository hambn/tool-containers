# alpine-browser: Alibaba Open Code Review on the Alpine browser-enabled agentimg base.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG OCR_VERSION=latest

RUN apk upgrade --no-cache

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["ocr"]
