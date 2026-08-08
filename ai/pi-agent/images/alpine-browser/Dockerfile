# alpine-browser: Pi coding agent on the Alpine browser-enabled agentimg foundation.
FROM ghcr.io/hambn/agentimg:alpine-browser

USER root

ARG PI_AGENT_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
USER agent
WORKDIR /workspace
ENTRYPOINT ["pi"]
