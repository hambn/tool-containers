# ubuntu-browser: broad Ubuntu 24.04 developer/agent foundation with headless Chromium.
FROM docker.io/chromedp/headless-shell:stable AS browser

FROM docker.io/library/ubuntu:24.04

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

RUN rm -f /etc/dpkg/dpkg.cfg.d/excludes /etc/dpkg/dpkg.cfg.d/01_nodoc && \
    apt-get update && \
    apt-get -y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef dist-upgrade && \
    apt-get install -y --no-install-recommends \
      acl aria2 atop autoconf automake bash-completion bison brotli bsdmainutils btop bubblewrap \
      build-essential bzip2 ca-certificates cmake curl dbus-user-session dialog dirmngr dnsutils \
      docker-buildx docker-compose-v2 docker.io fakeroot ffmpeg fd-find file flex \
      fonts-noto-color-emoji fonts-symbola fzf gettext-base git git-lfs gnupg htop httpie \
      imagemagick iotop iproute2 \
      iperf3 iputils-ping jq less libcap2-bin libgbm1 libglib2.0-0t64 libgtk-3-0t64 libnss3 \
      libx11-6 \
      libxcomposite1 libxdamage1 libxext6 libxi6 libxrandr2 locales locales-all lsof make \
      man-db manpages manpages-dev mercurial mitmproxy mtr-tiny nano ncdu ncurses-bin \
      ncurses-term net-tools netcat-openbsd neovim nginx ninja-build nmap openssh-client \
      openssh-server parallel patch pipx pkg-config psmisc procps python-is-python3 python3-pip \
      ripgrep rsync shellcheck \
      shfmt socat sqlite3 strace sudo systemd systemd-sysv tcpdump tmux traceroute tree \
      ubuntu-dev-tools ubuntu-server ubuntu-standard unzip util-linux vim wget whois \
      xz-utils yamllint zip zsh zsh-syntax-highlighting zstd && \
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

RUN node_metadata="$(curl -fsSL https://nodejs.org/dist/index.json)" && \
    node_version="$(printf '%s' "$node_metadata" | jq -er \
      '[.[] | select(.lts != false and (.files | index("linux-x64")))][0].version')" && \
    node_archive="node-${node_version}-linux-x64.tar.xz" && \
    curl -fsSL "https://nodejs.org/dist/${node_version}/${node_archive}" \
      -o "/tmp/${node_archive}" && \
    curl -fsSL "https://nodejs.org/dist/${node_version}/SHASUMS256.txt" \
      -o /tmp/node-SHASUMS256.txt && \
    grep " ${node_archive}\$" /tmp/node-SHASUMS256.txt | \
      (cd /tmp && sha256sum -c -) && \
    tar -xJf "/tmp/${node_archive}" -C /usr/local --strip-components=1 --no-same-owner && \
    ln -sf /usr/local/bin/node /usr/local/bin/nodejs && \
    rm -f "/tmp/${node_archive}" /tmp/node-SHASUMS256.txt && \
    npm install --global --no-audit --no-fund pnpm@latest yarn@latest && \
    npm cache clean --force && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "${node_version#v}" >/usr/local/share/agentimg/node.version

RUN ln -sf /usr/bin/fdfind /usr/local/bin/fd && \
    ping_path="$(readlink -f "$(command -v ping)")" && \
    setcap cap_net_raw=+ep "$ping_path" && \
    getcap "$ping_path" | grep -q cap_net_raw && \
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

RUN zsh_autosuggestions_tag="$(git ls-remote --tags --refs \
      https://github.com/zsh-users/zsh-autosuggestions.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$zsh_autosuggestions_tag" && \
    git clone --depth 1 --branch "$zsh_autosuggestions_tag" \
      https://github.com/zsh-users/zsh-autosuggestions.git \
      /usr/share/zsh/plugins/zsh-autosuggestions && \
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "${zsh_autosuggestions_tag#v}" \
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

RUN helm_tag="$(git ls-remote --tags --refs https://github.com/helm/helm.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$helm_tag" && \
    helm_archive="helm-${helm_tag}-linux-amd64.tar.gz" && \
    curl -fsSL "https://get.helm.sh/${helm_archive}" -o "/tmp/${helm_archive}" && \
    curl -fsSL "https://get.helm.sh/${helm_archive}.sha256sum" \
      -o "/tmp/${helm_archive}.sha256sum" && \
    (cd /tmp && sha256sum -c "${helm_archive}.sha256sum") && \
    tar -xzf "/tmp/${helm_archive}" -C /tmp && \
    install -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm && \
    rm -rf /tmp/linux-amd64 "/tmp/${helm_archive}" "/tmp/${helm_archive}.sha256sum" && \
    printf '%s\n' "${helm_tag#v}" >/usr/local/share/agentimg/helm.version

RUN kustomize_tag="$(git ls-remote --tags --refs \
      https://github.com/kubernetes-sigs/kustomize.git 'kustomize/v*' | \
      awk -F/ '$3 == "kustomize" && $4 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $4 }' | \
      sort -V | tail -n 1)" && \
    test -n "$kustomize_tag" && \
    kustomize_archive="kustomize_${kustomize_tag}_linux_amd64.tar.gz" && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/${kustomize_archive}" \
      -o "/tmp/${kustomize_archive}" && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/checksums.txt" \
      -o /tmp/kustomize-checksums.txt && \
    grep " ${kustomize_archive}\$" /tmp/kustomize-checksums.txt | \
      (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${kustomize_archive}" -C /tmp && \
    install -m 0755 /tmp/kustomize /usr/local/bin/kustomize && \
    rm -f /tmp/kustomize "/tmp/${kustomize_archive}" /tmp/kustomize-checksums.txt && \
    printf '%s\n' "${kustomize_tag#v}" >/usr/local/share/agentimg/kustomize.version

RUN kind_tag="$(git ls-remote --tags --refs https://github.com/kubernetes-sigs/kind.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$kind_tag" && \
    curl -fsSL "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64" \
      -o /tmp/kind-linux-amd64 && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64.sha256sum" \
      -o /tmp/kind-linux-amd64.sha256sum && \
    (cd /tmp && sha256sum -c kind-linux-amd64.sha256sum) && \
    install -m 0755 /tmp/kind-linux-amd64 /usr/local/bin/kind && \
    rm -f /tmp/kind-linux-amd64 /tmp/kind-linux-amd64.sha256sum && \
    printf '%s\n' "${kind_tag#v}" >/usr/local/share/agentimg/kind.version

RUN yq_tag="$(git ls-remote --tags --refs https://github.com/mikefarah/yq.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$yq_tag" && \
    yq_sha256_column="$(curl -fsSL \
      "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums_hashes_order" | \
      awk '$1 == "SHA-256" { print NR + 1 }')" && \
    test -n "$yq_sha256_column" && \
    yq_sha256="$(curl -fsSL \
      "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums" | \
      awk -v column="$yq_sha256_column" '$1 == "yq_linux_amd64" { print $column }')" && \
    test -n "$yq_sha256" && \
    curl -fsSL "https://github.com/mikefarah/yq/releases/download/${yq_tag}/yq_linux_amd64" \
      -o /tmp/yq && \
    printf '%s  yq\n' "$yq_sha256" | (cd /tmp && sha256sum -c -) && \
    install -m 0755 /tmp/yq /usr/local/bin/yq && \
    rm -f /tmp/yq && \
    printf '%s\n' "${yq_tag#v}" >/usr/local/share/agentimg/yq.version

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

COPY --from=browser /headless-shell /headless-shell
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
    container=oci

USER agent
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
