# syntax=docker/dockerfile:1
# docker build tools/ai/pi-agent builds the ubuntu-browser variant; the other variants
# only change BASE_IMAGE (see docker-bake.hcl). CI pins the base tag to its digest.
ARG BASE_IMAGE=ghcr.io/hambn/devbox:ubuntu-browser
# renovate: datasource=npm depName=@earendil-works/pi-coding-agent
ARG PI_VERSION=0.87.1

FROM ${BASE_IMAGE}
ARG PI_VERSION
USER root
RUN npm install -g --no-audit --no-fund --ignore-scripts --cache /tmp/npm-cache "@earendil-works/pi-coding-agent@${PI_VERSION}" && \
    rm -rf /tmp/npm-cache
LABEL io.github.hambn.containers.tool.pi.version="${PI_VERSION}"
USER sysadmin
WORKDIR /workspace
ENTRYPOINT ["pi"]
