# alpine: OpenAI Codex CLI on the Alpine agentimg foundation without a browser.
FROM ghcr.io/hambn/agentimg:alpine

USER root

ARG CODEX_VERSION=latest

RUN apk add --no-cache gcompat nodejs npm

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
USER agent
WORKDIR /workspace
ENTRYPOINT ["codex"]
