# ubuntu-browser: Claude Code on the Ubuntu agentimg foundation with Chromium.
FROM ghcr.io/hambn/agentimg:ubuntu-browser

USER root

ARG CLAUDE_CODE_VERSION=latest
ARG NODE_MAJOR=22

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN npm install --global --no-fund --no-audit \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
USER agent
WORKDIR /workspace
ENTRYPOINT ["claude"]
CMD []
