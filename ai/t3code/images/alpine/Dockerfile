# alpine: T3 Code on the Alpine agentbloat foundation, without a browser.
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:alpine
FROM ${BASE_IMAGE}

USER root

ARG T3_VERSION=latest

RUN npm install --global --no-fund --no-audit "t3@${T3_VERSION}" && \
    npm cache clean --force

WORKDIR /workspace
USER agent
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
