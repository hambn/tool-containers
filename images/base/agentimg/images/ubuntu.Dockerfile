# syntax=docker/dockerfile:1
# ubuntu: broad Ubuntu 24.04 developer/agent foundation without a browser.
FROM docker.io/library/ubuntu:24.04

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

RUN --mount=type=bind,source=ubuntu/scripts/update.sh,target=/tmp/update.sh \
    bash /tmp/update.sh
RUN --mount=type=bind,source=ubuntu/scripts/packages.sh,target=/tmp/packages.sh \
    bash /tmp/packages.sh
RUN --mount=type=bind,source=ubuntu/scripts/install-tailscale.sh,target=/tmp/install-tailscale.sh \
    bash /tmp/install-tailscale.sh
RUN --mount=type=bind,source=ubuntu/scripts/languages.sh,target=/tmp/languages.sh \
    bash /tmp/languages.sh
RUN --mount=type=bind,source=ubuntu/scripts/install-cli-tools.sh,target=/tmp/install-cli-tools.sh \
    bash /tmp/install-cli-tools.sh
RUN --mount=type=bind,source=ubuntu/scripts/configure-systemd.sh,target=/tmp/configure-systemd.sh \
    --mount=type=bind,source=ubuntu/systemd-container.conf,target=/tmp/agentimg-systemd-container.conf \
    --mount=type=bind,source=ubuntu/journald-container.conf,target=/tmp/agentimg-journald-container.conf \
    --mount=type=bind,source=ubuntu/tmpfiles-tmp.conf,target=/tmp/agentimg-tmpfiles-tmp.conf \
    bash /tmp/configure-systemd.sh
RUN --mount=type=bind,source=ubuntu/scripts/configure.sh,target=/tmp/configure.sh \
    bash /tmp/configure.sh
RUN --mount=type=bind,source=ubuntu/scripts/configure-zsh.sh,target=/tmp/configure-zsh.sh \
    --mount=type=bind,source=common/zsh/conf.d,target=/tmp/agentimg-conf.d \
    --mount=type=bind,source=common/zshenv,target=/tmp/zshenv \
    --mount=type=bind,source=common/zshrc,target=/tmp/zshrc \
    --mount=type=bind,source=common/zprofile,target=/tmp/zprofile \
    bash /tmp/configure-zsh.sh

ENV COLORTERM=truecolor \
    EDITOR=nvim \
    HOME=/home/sysadmin \
    LANG=C.UTF-8 \
    LESS=-FRX \
    LOGNAME=sysadmin \
    PAGER=less \
    PATH=/home/sysadmin/.local/bin:/usr/local/bin:/usr/local/go/bin:$PATH \
    SHELL=/bin/zsh \
    TERM=xterm-256color \
    USER=sysadmin \
    VISUAL=nvim \
    XDG_CACHE_HOME=/home/sysadmin/.cache \
    XDG_CONFIG_HOME=/home/sysadmin/.config \
    XDG_DATA_HOME=/home/sysadmin/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000 \
    container=oci \
    ZDOTDIR=/home/sysadmin
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]
