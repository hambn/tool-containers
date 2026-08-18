# ubuntu-browser: broad Ubuntu 24.04 developer/agent foundation with headless Chromium.
FROM docker.io/chromedp/headless-shell:stable AS browser

FROM docker.io/library/ubuntu:24.04

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

COPY ubuntu/setup.sh /tmp/agentimg-setup.sh
COPY ubuntu/systemd-container.conf /tmp/agentimg-systemd-container.conf
COPY ubuntu/journald-container.conf /tmp/agentimg-journald-container.conf
COPY ubuntu/tmpfiles-tmp.conf /tmp/agentimg-tmpfiles-tmp.conf

RUN bash /tmp/agentimg-setup.sh browser && \
    rm -f /tmp/agentimg-setup.sh

COPY --from=browser /headless-shell /headless-shell
COPY --chown=agent:agent common/zshenv /home/agent/.zshenv
COPY --chown=agent:agent common/zshrc /home/agent/.zshrc
COPY --chown=agent:agent common/zprofile /home/agent/.zprofile

ENV BROWSER_BIN=/headless-shell/headless-shell \
    COLORTERM=truecolor \
    EDITOR=nvim \
    HOME=/home/agent \
    LANG=C.UTF-8 \
    LESS=-FRX \
    LOGNAME=agent \
    PAGER=less \
    PATH=/home/agent/.local/bin:/headless-shell:/usr/local/bin:/usr/local/go/bin:$PATH \
    SHELL=/bin/zsh \
    TERM=xterm-256color \
    USER=agent \
    VISUAL=nvim \
    XDG_CACHE_HOME=/home/agent/.cache \
    XDG_CONFIG_HOME=/home/agent/.config \
    XDG_DATA_HOME=/home/agent/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000 \
    container=oci \
    ZDOTDIR=/home/agent

USER agent
WORKDIR /home/agent
CMD ["/bin/zsh", "-l"]
