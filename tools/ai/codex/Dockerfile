# syntax=docker/dockerfile:1
# docker build tools/ai/codex builds the ubuntu-browser variant; the other variants
# only change BASE_IMAGE (see docker-bake.hcl). CI pins the base tag to its digest.
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
# renovate: datasource=npm depName=@openai/codex
ARG CODEX_VERSION=0.157.0

FROM ${BASE_IMAGE}
ARG CODEX_VERSION
USER root
RUN npm install -g --no-audit --no-fund --cache /tmp/npm-cache "@openai/codex@${CODEX_VERSION}" && \
    rm -rf /tmp/npm-cache
LABEL io.github.hambn.containers.tool.codex.version="${CODEX_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["codex"]
