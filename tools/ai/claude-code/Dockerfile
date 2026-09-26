# syntax=docker/dockerfile:1
# docker build tools/ai/claude-code builds the ubuntu-browser variant; the other variants
# only change BASE_IMAGE (see docker-bake.hcl). CI pins the base tag to its digest.
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
# renovate: datasource=npm depName=@anthropic-ai/claude-code
ARG CLAUDE_CODE_VERSION=2.1.282

FROM ${BASE_IMAGE}
ARG CLAUDE_CODE_VERSION
USER root
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" && \
    rm -rf /tmp/npm-cache
LABEL io.github.hambn.containers.tool.claude-code.version="${CLAUDE_CODE_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["claude"]
