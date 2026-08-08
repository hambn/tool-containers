# alpine-browser: Pi coding agent on the Alpine browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG PI_AGENT_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
USER agent
ENTRYPOINT ["pi"]
