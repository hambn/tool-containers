# alpine-browser: Pi coding agent on the Alpine browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser
FROM ${BASE_IMAGE}

USER root

ARG PI_AGENT_VERSION=latest

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["pi"]
