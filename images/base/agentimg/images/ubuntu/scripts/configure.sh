#!/usr/bin/env bash

set -euxo pipefail

configure_tools() {
    # Git, terminal, and shell integration

    ln -sf /usr/bin/fdfind /usr/local/bin/fd
    local ping_path="$(readlink -f "$(command -v ping)")"
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

    usermod -l sysadmin -c "agentimg user" ubuntu
    groupmod -n sysadmin ubuntu
    mv /home/ubuntu /home/sysadmin
    usermod -d /home/sysadmin -s /bin/zsh sysadmin
    sed -i 's/^ubuntu:/sysadmin:/' /etc/subuid /etc/subgid
    usermod -aG docker,sudo sysadmin
    printf 'sysadmin ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/sysadmin
    chmod 0440 /etc/sudoers.d/sysadmin
    visudo -cf /etc/sudoers.d/sysadmin
    install -d /var/lib/systemd/linger
    touch /var/lib/systemd/linger/sysadmin
    install -d -o sysadmin -g sysadmin /home/sysadmin /home/sysadmin/.cache/zsh /home/sysadmin/.config \
        /home/sysadmin/.local/share
    install -d -m 0700 -o sysadmin -g sysadmin /home/sysadmin/.docker /home/sysadmin/.kube \
        /home/sysadmin/.ssh /run/user/1000
}

configure_tools
configure_sysadmin_user
