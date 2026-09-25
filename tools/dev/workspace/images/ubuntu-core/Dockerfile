# syntax=docker/dockerfile:1
ARG BASE_IMAGE=ghcr.io/hambn/runtime:ubuntu-24.04-minimal
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root

ARG REFRESH_WEEK=manual
RUN --mount=type=bind,source=ubuntu/scripts/core-packages.sh,target=/tmp/core-packages.sh \
    test -n "$REFRESH_WEEK" && bash /tmp/core-packages.sh
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]
ARG GO_VERSION=latest
ARG NODE_VERSION=latest
ARG UV_VERSION=latest
ARG PNPM_VERSION=latest
ARG YARN_VERSION=latest
RUN --mount=type=bind,source=ubuntu/scripts/languages.sh,target=/tmp/languages.sh \
    bash /tmp/languages.sh
RUN install -d -o 1000 -g 1000 /workspace

ENV HOME=/home/sysadmin LANG=C.UTF-8 PATH=/home/sysadmin/.local/bin:/usr/local/bin:/usr/local/go/bin:$PATH
USER 1000:1000
WORKDIR /workspace
CMD ["/bin/bash"]
