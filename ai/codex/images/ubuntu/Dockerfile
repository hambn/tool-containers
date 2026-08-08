# ubuntu: OpenAI Codex CLI on the Ubuntu agentimg foundation without a browser.
FROM ghcr.io/hambn/agentimg:ubuntu

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER agent
WORKDIR /workspace
ENTRYPOINT ["codex"]
