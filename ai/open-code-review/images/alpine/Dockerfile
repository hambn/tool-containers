# alpine: Alibaba Open Code Review on the Alpine agentimg base without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine
FROM ${BASE_IMAGE}

USER root

ARG OCR_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --no-fund --no-audit \
      "@alibaba-group/open-code-review@${OCR_VERSION}" && \
    npm cache clean --force

WORKDIR /workspace
USER agent
ENTRYPOINT ["ocr"]
