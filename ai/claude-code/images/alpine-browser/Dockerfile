# alpine-browser: Claude Code on the Alpine agentimg foundation with Chromium.
FROM ghcr.io/hambn/agentimg:alpine-browser

ARG CLAUDE_CODE_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --no-fund --no-audit \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
ENTRYPOINT ["claude"]
CMD []
