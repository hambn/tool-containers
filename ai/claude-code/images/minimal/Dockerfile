# minimal: just Claude Code, smallest footprint. Alpine base (musl libc).
# ponytail: Claude Code is mostly JS; musl edge cases possible. Use the standard variant if you hit one.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG CLAUDE_CODE_VERSION=latest

RUN apk add --no-cache git ripgrep ca-certificates

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    && npm cache clean --force

USER node
WORKDIR /workspace
ENTRYPOINT ["claude"]
