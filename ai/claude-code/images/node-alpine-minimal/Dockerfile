# node-alpine-minimal: Claude Code via npm on Node Alpine + git/ripgrep. Smallest npm-based image.
# ponytail: Claude Code is mostly JS; musl edge cases possible. Try alpine-minimal (native) if you hit one.
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine

ARG CLAUDE_CODE_VERSION=latest

# git + ripgrep: Claude Code shells out to them. ca-certificates for TLS.
RUN apk add --no-cache git ripgrep ca-certificates \
    && npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    && npm cache clean --force

USER node
WORKDIR /workspace
ENTRYPOINT ["claude"]
