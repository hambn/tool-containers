# node-alpine-full: Claude Code + a real toolchain (ssh, curl, python, build tools, jq) on Node Alpine.
# Use when the agent must build/run/deploy, not just edit files.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG CLAUDE_CODE_VERSION=latest

RUN apk add --no-cache \
        ca-certificates curl bash git ripgrep \
        openssh-client \
        python3 py3-pip \
        build-base \
        jq unzip \
    && npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    && npm cache clean --force

USER node
WORKDIR /workspace
ENTRYPOINT ["claude"]
