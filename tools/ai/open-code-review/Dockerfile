# syntax=docker/dockerfile:1
# docker build tools/ai/open-code-review builds the ubuntu-browser variant; the other variants
# only change BASE_IMAGE (see docker-bake.hcl). CI pins the base tag to its digest.
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
# renovate: datasource=npm depName=@alibaba-group/open-code-review
ARG OPEN_CODE_REVIEW_VERSION=1.12.9

FROM ${BASE_IMAGE}
ARG OPEN_CODE_REVIEW_VERSION
USER root
RUN npm install -g --prefix=/usr/local --no-audit --no-fund --cache /tmp/npm-cache "@alibaba-group/open-code-review@${OPEN_CODE_REVIEW_VERSION}" && \
    rm -rf /tmp/npm-cache
LABEL io.github.hambn.containers.tool.open-code-review.version="${OPEN_CODE_REVIEW_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["ocr"]
