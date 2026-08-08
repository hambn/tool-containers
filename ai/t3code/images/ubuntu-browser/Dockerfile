# ubuntu-browser: T3 Code on the Ubuntu browser-enabled agentbloat foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentbloat:ubuntu-browser
FROM ${BASE_IMAGE}

USER root

ARG T3_VERSION=latest

RUN npm install --global --no-fund --no-audit "t3@${T3_VERSION}" && \
    npm cache clean --force

WORKDIR /workspace
USER agent
EXPOSE 3773
ENTRYPOINT ["t3", "serve", "--host=0.0.0.0", "--port=3773"]
