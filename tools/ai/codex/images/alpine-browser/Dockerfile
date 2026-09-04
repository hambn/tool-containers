# alpine-browser: OpenAI Codex CLI on the Alpine browser-enabled agentimg foundation.
ARG BASE_IMAGE=ghcr.io/hambn/agentimg:alpine-browser@sha256:b68362dc638ca6d68e04eb2329b1d54502fa5253fba54823a13b53797efa89b8
FROM ${BASE_IMAGE}

USER root

ARG CODEX_VERSION=latest

RUN npm install --global --no-fund --no-audit \
      "@openai/codex@${CODEX_VERSION}" && \
    npm cache clean --force

USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
