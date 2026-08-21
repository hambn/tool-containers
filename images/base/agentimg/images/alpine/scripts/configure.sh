#!/usr/bin/env bash

set -euxo pipefail

configure_tools() {
    # Git, terminal, and shell integration

    local ping_path

    ping_path="$(readlink -f "$(command -v ping)")"
    setcap cap_net_raw=+ep "$ping_path"
    getcap "$ping_path" | grep -q cap_net_raw
    git config --system init.defaultBranch main
    git config --system fetch.prune true
    git config --system push.autoSetupRemote true
    git lfs install --system
    infocmp -x xterm-256color |
        sed -e '/^#/d' -e 's/^xterm-256color|/xterm-ghostty|ghostty|Ghostty|/' |
        tic -x -
}

configure_sysadmin_user() {
    # Sysadmin user and home

    adduser -D -u 1000 -s /bin/zsh sysadmin
    addgroup sysadmin wheel
    addgroup sysadmin docker
    printf 'sysadmin ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/sysadmin
    chmod 0440 /etc/sudoers.d/sysadmin
    visudo -cf /etc/sudoers.d/sysadmin
    install -d -o sysadmin -g sysadmin /home/sysadmin /home/sysadmin/.cache/zsh /home/sysadmin/.config \
        /home/sysadmin/.local/share
    install -d -m 0700 -o sysadmin -g sysadmin /home/sysadmin/.docker /home/sysadmin/.kube \
        /home/sysadmin/.ssh /run/user/1000
    chmod g-s /home/sysadmin/.docker /home/sysadmin/.kube /home/sysadmin/.ssh /run/user/1000
    chmod 0700 /home/sysadmin/.docker /home/sysadmin/.kube /home/sysadmin/.ssh /run/user/1000
    test "$(stat -c %a /home/sysadmin/.kube)" = 700
}

configure_tools
configure_sysadmin_user
