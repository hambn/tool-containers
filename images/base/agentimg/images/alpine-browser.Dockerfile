# syntax=docker/dockerfile:1
# alpine-browser: Alpine 3.21 developer/agent foundation with Chromium.
ARG RUNTIME_BASE=docker.io/library/alpine:3.21
FROM ${RUNTIME_BASE}

RUN --mount=type=bind,source=alpine/scripts/update.sh,target=/tmp/update.sh \
    /bin/sh /tmp/update.sh

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]

RUN --mount=type=bind,source=alpine/scripts/packages.sh,target=/tmp/packages.sh \
    bash /tmp/packages.sh
RUN --mount=type=bind,source=alpine/scripts/browser-packages.sh,target=/tmp/browser-packages.sh \
    bash /tmp/browser-packages.sh
RUN --mount=type=bind,source=alpine/scripts/languages.sh,target=/tmp/languages.sh \
    bash /tmp/languages.sh
RUN --mount=type=bind,source=alpine/scripts/install-cli-tools.sh,target=/tmp/install-cli-tools.sh \
    bash /tmp/install-cli-tools.sh
RUN --mount=type=bind,source=alpine/scripts/configure.sh,target=/tmp/configure.sh \
    bash /tmp/configure.sh
RUN --mount=type=bind,source=alpine/scripts/configure-zsh.sh,target=/tmp/configure-zsh.sh \
    --mount=type=bind,source=common/zsh/conf.d,target=/tmp/agentimg-conf.d \
    --mount=type=bind,source=common/zshenv,target=/tmp/zshenv \
    --mount=type=bind,source=common/zshrc,target=/tmp/zshrc \
    --mount=type=bind,source=common/zprofile,target=/tmp/zprofile \
    bash /tmp/configure-zsh.sh

ENV BROWSER_BIN=/usr/bin/chromium-browser \
    COLORTERM=truecolor \
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
    ZDOTDIR=/home/sysadmin
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]
