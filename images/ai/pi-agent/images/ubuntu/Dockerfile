# ubuntu: Pi coding agent on the Ubuntu agentimg foundation without a browser.
FROM ghcr.io/hambn/agentimg:ubuntu

USER root

ARG PI_AGENT_VERSION=latest

RUN npm install --global --ignore-scripts --no-fund --no-audit \
      "@earendil-works/pi-coding-agent@${PI_AGENT_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["pi"]
