# alpine-browser: Alpine 3.21 developer/agent foundation with Chromium.
FROM docker.io/library/alpine:3.21

COPY alpine/setup.sh /tmp/agentimg-alpine-setup.sh

RUN /bin/sh /tmp/agentimg-alpine-setup.sh browser && \
    rm -f /tmp/agentimg-alpine-setup.sh

COPY --chown=agent:agent common/zshenv /home/agent/.zshenv
COPY --chown=agent:agent common/zshrc /home/agent/.zshrc
COPY --chown=agent:agent common/zprofile /home/agent/.zprofile

ENV BROWSER_BIN=/usr/bin/chromium-browser \
    COLORTERM=truecolor \
    EDITOR=nvim \
    HOME=/home/agent \
    LANG=C.UTF-8 \
    LESS=-FRX \
    LOGNAME=agent \
    PAGER=less \
    PATH=/home/agent/.local/bin:/usr/local/bin:/usr/local/go/bin:$PATH \
    SHELL=/bin/zsh \
    TERM=xterm-256color \
    USER=agent \
    VISUAL=nvim \
    XDG_CACHE_HOME=/home/agent/.cache \
    XDG_CONFIG_HOME=/home/agent/.config \
    XDG_DATA_HOME=/home/agent/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000 \
    ZDOTDIR=/home/agent
USER agent
WORKDIR /home/agent
CMD ["/bin/zsh", "-l"]
