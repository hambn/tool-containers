# syntax=docker/dockerfile:1
ARG BASE_IMAGE=ghcr.io/hambn/workspace:alpine-3.21-core
FROM ${BASE_IMAGE}
USER root
ENV HOME=/root
SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

ARG REFRESH_WEEK=manual
RUN --mount=type=bind,source=alpine/scripts/packages.sh,target=/tmp/packages.sh \
    test -n "$REFRESH_WEEK" && bash /tmp/packages.sh
ARG GLAB_VERSION=latest
ARG GH_VERSION=latest
ARG ZSH_AUTOSUGGESTIONS_VERSION=latest
ARG KUBECTL_VERSION=latest
ARG HELM_VERSION=latest
ARG KUSTOMIZE_VERSION=latest
ARG YQ_VERSION=latest
RUN --mount=type=bind,source=alpine/scripts/install-cli-tools.sh,target=/tmp/install-cli-tools.sh \
    bash /tmp/install-cli-tools.sh
RUN --mount=type=bind,source=alpine/scripts/configure.sh,target=/tmp/configure.sh \
    bash /tmp/configure.sh
RUN --mount=type=bind,source=alpine/scripts/configure-zsh.sh,target=/tmp/configure-zsh.sh \
    --mount=type=bind,source=common/zsh/conf.d,target=/tmp/workspace-conf.d \
    --mount=type=bind,source=common/zshenv,target=/tmp/zshenv \
    --mount=type=bind,source=common/zshrc,target=/tmp/zshrc \
    --mount=type=bind,source=common/zprofile,target=/tmp/zprofile \
    bash /tmp/configure-zsh.sh

ENV SHELL=/bin/zsh ZDOTDIR=/home/sysadmin
ENV HOME=/home/sysadmin
USER 1000:1000
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
