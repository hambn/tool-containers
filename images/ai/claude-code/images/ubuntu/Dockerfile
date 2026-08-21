# ubuntu: Claude Code on the Ubuntu agentimg foundation without a browser.
FROM ghcr.io/hambn/agentimg:ubuntu

USER root

ARG CLAUDE_CODE_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["claude"]
CMD []
