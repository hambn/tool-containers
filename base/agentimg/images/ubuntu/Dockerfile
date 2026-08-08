# ubuntu: broad Ubuntu 24.04 developer/agent foundation without a browser.
FROM docker.io/library/ubuntu:24.04

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

RUN rm -f /etc/dpkg/dpkg.cfg.d/excludes /etc/dpkg/dpkg.cfg.d/01_nodoc && \
    apt-get update && \
    apt-get -y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef dist-upgrade && \
    apt-get install -y --no-install-recommends \
      acl atop autoconf automake bash-completion bsdmainutils btop bubblewrap build-essential \
      ca-certificates cmake curl dbus-user-session dnsutils \
      docker-buildx docker-compose-v2 docker.io ffmpeg fd-find file fzf gettext-base git \
      git-lfs gnupg htop httpie imagemagick iotop iproute2 iputils-ping jq less \
      libcap2-bin locales locales-all lsof make man-db manpages manpages-dev mitmproxy ncdu \
      ncurses-bin ncurses-term net-tools netcat-openbsd neovim nginx ninja-build \
      openssh-client openssh-server parallel patch pipx pkg-config psmisc procps \
      python-is-python3 python3-pip ripgrep rsync shellcheck shfmt socat sqlite3 strace sudo \
      systemd systemd-sysv tcpdump tmux traceroute tree ubuntu-dev-tools ubuntu-server \
      ubuntu-standard unzip util-linux vim wget whois xz-utils zip zsh \
      zsh-syntax-highlighting && \
    apt-get remove -y pollinate ubuntu-fan && \
    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub /usr/sbin/policy-rc.d && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
      -o /usr/share/keyrings/tailscale-archive-keyring.gpg && \
    curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
      -o /etc/apt/sources.list.d/tailscale.list && \
    apt-get update && apt-get install -y --no-install-recommends tailscale && \
    rm -rf /var/lib/apt/lists/* && \
    curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

RUN go_metadata="$(curl -fsSL 'https://go.dev/dl/?mode=json')" && \
    go_version="$(printf '%s' "$go_metadata" | \
      jq -er '[.[] | select(.stable == true)][0].version')" && \
    go_sha256="$(printf '%s' "$go_metadata" | jq -er --arg version "$go_version" \
      '[.[] | select(.version == $version)][0].files[] | \
       select(.os == "linux" and .arch == "amd64" and .kind == "archive") | .sha256')" && \
    go_archive="${go_version}.linux-amd64.tar.gz" && \
    curl -fsSL "https://go.dev/dl/${go_archive}" -o "/tmp/${go_archive}" && \
    printf '%s  %s\n' "$go_sha256" "$go_archive" | (cd /tmp && sha256sum -c -) && \
    rm -rf /usr/local/go && \
    tar -xzf "/tmp/${go_archive}" -C /usr/local && \
    ln -sf /usr/local/go/bin/go /usr/local/bin/go && \
    ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt && \
    rm -f "/tmp/${go_archive}" && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "$go_version" >/usr/local/share/agentimg/go.version

RUN ln -sf /usr/bin/fdfind /usr/local/bin/fd && \
    git config --system init.defaultBranch main && \
    git config --system fetch.prune true && \
    git config --system push.autoSetupRemote true && \
    git lfs install --system && \
    infocmp -x xterm-256color | \
      sed -e '/^#/d' -e 's/^xterm-256color|/xterm-ghostty|ghostty|Ghostty|/' | \
      tic -x -

RUN glab_version="$(curl -fsSL \
      'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases/permalink/latest' | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    glab_archive="glab_${glab_version}_linux_amd64.tar.gz" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/${glab_archive}" \
      -o "/tmp/${glab_archive}" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/checksums.txt" \
      -o /tmp/glab-checksums.txt && \
    grep " ${glab_archive}\$" /tmp/glab-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${glab_archive}" -C /usr/local bin/glab && \
    rm -f "/tmp/${glab_archive}" /tmp/glab-checksums.txt

RUN gh_version="$(curl -fsSL \
      https://api.github.com/repos/cli/cli/releases/latest | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    gh_archive="gh_${gh_version}_linux_amd64.tar.gz" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${gh_version}/${gh_archive}" \
      -o "/tmp/${gh_archive}" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${gh_version}/gh_${gh_version}_checksums.txt" \
      -o /tmp/gh-checksums.txt && \
    grep " ${gh_archive}\$" /tmp/gh-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${gh_archive}" -C /tmp && \
    install -m 0755 "/tmp/gh_${gh_version}_linux_amd64/bin/gh" /usr/local/bin/gh && \
    rm -rf "/tmp/gh_${gh_version}_linux_amd64" "/tmp/${gh_archive}" \
      /tmp/gh-checksums.txt

RUN zsh_autosuggestions_version="$(curl -fsSL \
      https://api.github.com/repos/zsh-users/zsh-autosuggestions/releases/latest | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    git clone --depth 1 --branch "v${zsh_autosuggestions_version}" \
      https://github.com/zsh-users/zsh-autosuggestions.git \
      /usr/share/zsh/plugins/zsh-autosuggestions && \
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "$zsh_autosuggestions_version" \
      >/usr/local/share/agentimg/zsh-autosuggestions.version

RUN kubectl_version="$(curl -fsSL \
      https://dl.k8s.io/release/stable.txt)" && \
    curl -fsSLo /tmp/kubectl \
      "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl" && \
    curl -fsSLo /tmp/kubectl.sha256 \
      "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl.sha256" && \
    (cd /tmp && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -) && \
    install -m 0755 /tmp/kubectl /usr/local/bin/kubectl && \
    install -d /usr/local/share/zsh/site-functions && \
    kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl && \
    rm -f /tmp/kubectl /tmp/kubectl.sha256

# Keep a privileged, explicitly selected systemd PID 1 useful inside an OCI container.
RUN install -d /etc/systemd/system.conf.d /etc/systemd/journald.conf.d /etc/tmpfiles.d
COPY systemd-container.conf /etc/systemd/system.conf.d/agentimg-container.conf
COPY journald-container.conf /etc/systemd/journald.conf.d/agentimg-container.conf
COPY tmpfiles-tmp.conf /etc/tmpfiles.d/tmp.conf
RUN systemctl set-default multi-user.target && \
    systemctl mask -- \
      apt-daily.service apt-daily.timer apt-daily-upgrade.service apt-daily-upgrade.timer \
      atop-rotate.timer console-getty.service dm-event.socket dpkg-db-backup.timer \
      e2scrub_all.timer etc-hostname.mount etc-hosts.mount etc-resolv.conf.mount fwupd.service \
      fwupd-refresh.service fwupd-refresh.timer getty.target getty@.service iscsid.socket \
      keyboard-setup.service ldconfig.service lxd-installer.socket man-db.timer \
      modprobe@.service motd-news.service motd-news.timer \
      plymouth-halt.service plymouth-kexec.service plymouth-poweroff.service \
      plymouth-quit-wait.service plymouth-quit.service plymouth-read-write.service \
      plymouth-reboot.service plymouth-start.service plymouth-switch-root-initramfs.service \
      plymouth-switch-root.service systemd-ask-password-console.path \
      systemd-ask-password-wall.path systemd-hwdb-update.service \
      systemd-journal-catalog-update.service systemd-modules-load.service \
      systemd-random-seed.service systemd-remount-fs.service systemd-resolved.service \
      systemd-update-done.service systemd-update-utmp.service \
      systemd-udev-settle.service systemd-udev-trigger.service systemd-udevd-control.socket \
      systemd-udevd-kernel.socket systemd-udevd.service update-notifier-download.timer \
      update-notifier-motd.timer ubuntu-fan.service unattended-upgrades.service -.mount
RUN systemctl disable -- \
      apport-autoreport.path apport-autoreport.timer apport-forward.socket apport.service \
      atop.service atopacct.service containerd.service docker.service e2scrub_reap.service \
      lvm2-lvmpolld.socket multipathd.service nginx.service snapd.service snapd.socket \
      ssh.service ssh.socket sysstat.service tailscaled.service udisks2.service ufw.service \
      || true

RUN usermod -l agent -c "agentimg user" ubuntu && \
    groupmod -n agent ubuntu && \
    mv /home/ubuntu /home/agent && \
    usermod -d /home/agent -s /bin/zsh agent && \
    sed -i 's/^ubuntu:/agent:/' /etc/subuid /etc/subgid && \
    usermod -aG docker,sudo agent && \
    printf 'agent ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/agent && \
    chmod 0440 /etc/sudoers.d/agent && \
    visudo -cf /etc/sudoers.d/agent && \
    install -d /var/lib/systemd/linger && \
    touch /var/lib/systemd/linger/agent && \
    install -d -o agent -g agent /home/agent/.cache/zsh /home/agent/.config \
      /home/agent/.local/share /workspace && \
    install -d -m 0700 -o agent -g agent /home/agent/.docker /home/agent/.kube \
      /home/agent/.ssh /run/user/1000

COPY --chown=agent:agent zshrc /home/agent/.zshrc

ENV COLORTERM=truecolor \
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
    container=oci
USER agent
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
