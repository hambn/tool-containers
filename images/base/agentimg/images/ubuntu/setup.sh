#!/usr/bin/env bash

set -euxo pipefail

update() {
    rm -f /etc/dpkg/dpkg.cfg.d/excludes /etc/dpkg/dpkg.cfg.d/01_nodoc
    apt-get update
    apt-get -y -o Dpkg::Options::=--force-confold \
        -o Dpkg::Options::=--force-confdef dist-upgrade
}

common_packages() {
    local apt_packages=(
        # Access control, security, and trust

        acl                       # POSIX access control list utilities.
        ca-certificates           # Certificate authority bundle for TLS verification.
        dirmngr                   # GnuPG keyserver and certificate helper.
        gnupg                     # OpenPGP encryption, signing, and key-management tools.
        libcap2-bin               # Utilities for inspecting and assigning Linux capabilities.
        sudo                      # Controlled privilege escalation.

        # Shells, terminal UX, and editors

        bash-completion           # Programmable command completion for Bash.
        dialog                    # Terminal-based dialog box and UI utility.
        fzf                       # Fuzzy finder for interactive command-line workflows.
        less                      # Terminal pager for viewing text.
        nano                      # Small terminal text editor.
        ncurses-bin               # Core ncurses terminal utility programs.
        ncurses-term              # Additional ncurses terminal definitions.
        neovim                    # Extensible modal terminal text editor.
        tmux                      # Terminal multiplexer.
        vim                       # Vim text editor.
        zsh                       # Z shell for interactive use and scripting.
        zsh-syntax-highlighting   # Syntax-highlighting plugin for Zsh.

        # Build systems and compilation

        autoconf                  # Generates configure scripts from templates.
        automake                  # Generates portable Makefiles.
        bison                     # Parser generator.
        build-essential           # Compiler, linker, and core Debian build tools.
        cmake                     # Cross-platform build-system generator.
        fakeroot                  # Simulates root ownership during package builds.
        flex                      # Lexical analyzer generator.
        make                      # Build automation tool.
        ninja-build               # Fast build-system backend.
        parallel                  # Runs independent jobs in parallel.
        patch                     # Applies source-code patches.
        pkg-config                # Discovers compiler and linker flags for libraries.

        # Archives and compression

        brotli                    # Brotli compression and decompression utilities.
        bzip2                     # Bzip2 compression and decompression utilities.
        unzip                     # Extracts ZIP archives.
        xz-utils                  # XZ and LZMA compression utilities.
        zip                       # Creates ZIP archives.
        zstd                      # Zstandard compression and decompression utilities.

        # Files, text, and data processing

        bsdmainutils              # Miscellaneous BSD-derived command-line utilities.
        fd-find                   # Fast, user-friendly file finder (fdfind on Ubuntu).
        file                      # Identifies file types from their contents.
        gettext-base              # Lightweight gettext tools, including envsubst.
        jq                        # Command-line JSON processor.
        ripgrep                   # Fast recursive text-search utility.
        tree                      # Displays directory trees.

        # Version control and code quality

        git                       # Distributed version-control system.
        git-lfs                   # Git Large File Storage extension.
        mercurial                 # Distributed version-control system.
        shellcheck                # Static analyzer for shell scripts.
        shfmt                     # Formatter for shell scripts.
        yamllint                  # Linter for YAML files.

        # Python and databases

        pipx                      # Installs Python CLI applications in isolated environments.
        python-is-python3         # Makes the python command invoke Python 3.
        python3-pip               # Python 3 package installer.
        sqlite3                   # SQLite command-line client and tools.

        # Networking clients and diagnostics

        aria2                     # Multi-protocol command-line download utility.
        curl                      # Command-line URL transfer client.
        dnsutils                  # DNS query utilities such as dig and nslookup.
        httpie                    # User-friendly command-line HTTP client.
        iperf3                    # Network throughput measurement tool.
        iproute2                  # Modern IP routing and network administration tools.
        iputils-ping              # Ping and related network diagnostic utilities.
        mtr-tiny                  # Network diagnostic combining ping and traceroute.
        net-tools                 # Legacy networking tools such as ifconfig and netstat.
        netcat-openbsd             # TCP and UDP network connection utility.
        nmap                      # Network discovery and security scanner.
        socat                     # Bidirectional relay for files, sockets, and streams.
        tcpdump                   # Network packet capture and analysis tool.
        traceroute                # Traces the network path to a destination.
        wget                      # Command-line web downloader.
        whois                     # WHOIS query client.

        # Remote access, synchronization, and proxy/server tools

        mitmproxy                 # Interactive HTTP(S) interception proxy.
        nginx                     # Web server and reverse proxy.
        openssh-client            # SSH client and related remote-access utilities.
        openssh-server            # OpenSSH daemon for inbound SSH access.
        rsync                     # Efficient local and remote file synchronization.

        # Containers and system integration

        bubblewrap                # Unprivileged sandboxing and namespace isolation utility.
        dbus-user-session         # D-Bus user-session integration.
        docker-buildx             # Docker Buildx builder plugin.
        docker-compose-v2         # Docker Compose v2 plugin.
        docker.io                 # Docker CLI and engine package.
        systemd                   # Service manager and system utilities.
        systemd-sysv              # Integrates systemd with the SysV init interface.

        # Media and image processing

        ffmpeg                    # Audio/video conversion and processing tools.
        imagemagick               # Image conversion and manipulation suite.

        # Monitoring and process diagnostics

        atop                      # Interactive system and process monitor.
        btop                      # Resource monitor for CPU, memory, disks, and processes.
        htop                      # Interactive process viewer.
        iotop                     # Monitors process disk I/O usage.
        lsof                      # Lists open files, processes, and sockets.
        ncdu                      # Interactive disk-usage browser.
        psmisc                    # Process-management utilities such as killall and fuser.
        procps                    # Process inspection tools such as ps and top.
        strace                    # System-call tracer for debugging.

        # Documentation, locales, and Ubuntu base profiles

        locales                   # Locale generation and locale data tools.
        locales-all               # Pre-generated locale data for common locales.
        man-db                    # Manual-page database and viewer support.
        manpages                  # Linux user-space manual pages.
        manpages-dev              # Linux developer manual pages.
        ubuntu-dev-tools          # Utilities for Ubuntu package development.
        ubuntu-server             # Ubuntu server profile metapackage.
        ubuntu-standard           # Standard Ubuntu system utilities metapackage.
        util-linux                # Core Linux system utilities.
    )

    apt-get install -y --no-install-recommends "${apt_packages[@]}"

    local apt_remove_packages=(
        # Packages removed because they are not useful in the container runtime.

        pollinate                 # Cloud entropy-seeding client not needed in the container.
        ubuntu-fan                # Ubuntu FAN virtual-networking service not needed here.
    )

    apt-get remove -y "${apt_remove_packages[@]}"
}

install_tailscale() {
    # Tailscale repository and package

    curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
        -o /usr/share/keyrings/tailscale-archive-keyring.gpg
    curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
        -o /etc/apt/sources.list.d/tailscale.list
    apt-get update

    local tailscale_packages=(
        # Mesh VPN networking

        tailscale                 # Mesh VPN client.
    )

    apt-get install -y --no-install-recommends "${tailscale_packages[@]}"
}

install_uv() {
    # Python package tooling

    curl -LsSf https://astral.sh/uv/install.sh |
        env UV_INSTALL_DIR=/usr/local/bin sh
}

install_go() {
    # Go runtime

    local go_metadata
    local go_version
    local go_sha256
    local go_archive

    go_metadata="$(curl -fsSL 'https://go.dev/dl/?mode=json')"
    go_version="$(printf '%s' "$go_metadata" |
        jq -er '[.[] | select(.stable == true)][0].version')"
    go_sha256="$(printf '%s' "$go_metadata" | jq -er --arg version "$go_version" \
        '[.[] | select(.version == $version)][0].files[] |
         select(.os == "linux" and .arch == "amd64" and .kind == "archive") | .sha256')"
    go_archive="${go_version}.linux-amd64.tar.gz"
    curl -fsSL "https://go.dev/dl/${go_archive}" -o "/tmp/${go_archive}"
    printf '%s  %s\n' "$go_sha256" "$go_archive" |
        (cd /tmp && sha256sum -c -)
    rm -rf /usr/local/go
    tar -xzf "/tmp/${go_archive}" -C /usr/local
    ln -sf /usr/local/go/bin/go /usr/local/bin/go
    ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt
    rm -f "/tmp/${go_archive}"
    install -d /usr/local/share/agentimg
    printf '%s\n' "$go_version" >/usr/local/share/agentimg/go.version
}

install_node() {
    # Node.js runtime and package managers

    local node_metadata
    local node_version
    local node_archive

    node_metadata="$(curl -fsSL https://nodejs.org/dist/index.json)"
    node_version="$(printf '%s' "$node_metadata" | jq -er \
        '[.[] | select(.lts != false and (.files | index("linux-x64")))][0].version')"
    node_archive="node-${node_version}-linux-x64.tar.xz"
    curl -fsSL "https://nodejs.org/dist/${node_version}/${node_archive}" \
        -o "/tmp/${node_archive}"
    curl -fsSL "https://nodejs.org/dist/${node_version}/SHASUMS256.txt" \
        -o /tmp/node-SHASUMS256.txt
    grep " ${node_archive}\$" /tmp/node-SHASUMS256.txt |
        (cd /tmp && sha256sum -c -)
    tar -xJf "/tmp/${node_archive}" -C /usr/local --strip-components=1 --no-same-owner
    ln -sf /usr/local/bin/node /usr/local/bin/nodejs
    rm -f "/tmp/${node_archive}" /tmp/node-SHASUMS256.txt

    local npm_packages=(
        # Node.js package managers

        pnpm@latest               # Fast, disk-space-efficient Node.js package manager.
        yarn@latest               # Node.js package manager.
    )

    npm install --global --no-audit --no-fund "${npm_packages[@]}"
    npm cache clean --force
    install -d /usr/local/share/agentimg
    printf '%s\n' "${node_version#v}" >/usr/local/share/agentimg/node.version
}

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

install_glab() {
    # GitLab CLI

    local glab_version
    local glab_archive

    glab_version="$(curl -fsSL \
        'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases/permalink/latest' |
        jq -er '.tag_name | ltrimstr("v")')"
    glab_archive="glab_${glab_version}_linux_amd64.tar.gz"
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/${glab_archive}" \
        -o "/tmp/${glab_archive}"
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/checksums.txt" \
        -o /tmp/glab-checksums.txt
    grep " ${glab_archive}\$" /tmp/glab-checksums.txt |
        (cd /tmp && sha256sum -c -)
    tar -xzf "/tmp/${glab_archive}" -C /usr/local bin/glab
    rm -f "/tmp/${glab_archive}" /tmp/glab-checksums.txt
}

install_gh() {
    # GitHub CLI

    local gh_version
    local gh_archive

    gh_version="$(curl -fsSL \
        https://api.github.com/repos/cli/cli/releases/latest |
        jq -er '.tag_name | ltrimstr("v")')"
    gh_archive="gh_${gh_version}_linux_amd64.tar.gz"
    curl -fsSL \
        "https://github.com/cli/cli/releases/download/v${gh_version}/${gh_archive}" \
        -o "/tmp/${gh_archive}"
    curl -fsSL \
        "https://github.com/cli/cli/releases/download/v${gh_version}/gh_${gh_version}_checksums.txt" \
        -o /tmp/gh-checksums.txt
    grep " ${gh_archive}\$" /tmp/gh-checksums.txt |
        (cd /tmp && sha256sum -c -)
    tar -xzf "/tmp/${gh_archive}" -C /tmp
    install -m 0755 "/tmp/gh_${gh_version}_linux_amd64/bin/gh" /usr/local/bin/gh
    rm -rf "/tmp/gh_${gh_version}_linux_amd64" "/tmp/${gh_archive}" /tmp/gh-checksums.txt
}

install_zsh_autosuggestions() {
    # Zsh plugin

    local zsh_autosuggestions_tag

    zsh_autosuggestions_tag="$(git ls-remote --tags --refs \
        https://github.com/zsh-users/zsh-autosuggestions.git 'v*' |
        awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' |
        sort -V | tail -n 1)"
    test -n "$zsh_autosuggestions_tag"
    git clone --depth 1 --branch "$zsh_autosuggestions_tag" \
        https://github.com/zsh-users/zsh-autosuggestions.git \
        /usr/share/zsh/plugins/zsh-autosuggestions
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git
    install -d /usr/local/share/agentimg
    printf '%s\n' "${zsh_autosuggestions_tag#v}" \
        >/usr/local/share/agentimg/zsh-autosuggestions.version
}

install_kubectl() {
    # Kubernetes CLI

    local kubectl_version

    kubectl_version="$(curl -fsSL https://dl.k8s.io/release/stable.txt)"
    curl -fsSLo /tmp/kubectl \
        "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl"
    curl -fsSLo /tmp/kubectl.sha256 \
        "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl.sha256"
    (cd /tmp && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -)
    install -m 0755 /tmp/kubectl /usr/local/bin/kubectl
    install -d /usr/local/share/zsh/site-functions
    kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl
    rm -f /tmp/kubectl /tmp/kubectl.sha256
}

install_helm() {
    # Helm

    local helm_tag
    local helm_archive

    helm_tag="$(git ls-remote --tags --refs https://github.com/helm/helm.git 'v*' |
        awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' |
        sort -V | tail -n 1)"
    test -n "$helm_tag"
    helm_archive="helm-${helm_tag}-linux-amd64.tar.gz"
    curl -fsSL "https://get.helm.sh/${helm_archive}" -o "/tmp/${helm_archive}"
    curl -fsSL "https://get.helm.sh/${helm_archive}.sha256sum" \
        -o "/tmp/${helm_archive}.sha256sum"
    (cd /tmp && sha256sum -c "${helm_archive}.sha256sum")
    tar -xzf "/tmp/${helm_archive}" -C /tmp
    install -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm
    rm -rf /tmp/linux-amd64 "/tmp/${helm_archive}" "/tmp/${helm_archive}.sha256sum"
    printf '%s\n' "${helm_tag#v}" >/usr/local/share/agentimg/helm.version
}

install_kustomize() {
    # Kustomize

    local kustomize_tag
    local kustomize_archive

    kustomize_tag="$(git ls-remote --tags --refs \
        https://github.com/kubernetes-sigs/kustomize.git 'kustomize/v*' |
        awk -F/ '$3 == "kustomize" && $4 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $4 }' |
        sort -V | tail -n 1)"
    test -n "$kustomize_tag"
    kustomize_archive="kustomize_${kustomize_tag}_linux_amd64.tar.gz"
    curl -fsSL \
        "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/${kustomize_archive}" \
        -o "/tmp/${kustomize_archive}"
    curl -fsSL \
        "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/checksums.txt" \
        -o /tmp/kustomize-checksums.txt
    grep " ${kustomize_archive}\$" /tmp/kustomize-checksums.txt |
        (cd /tmp && sha256sum -c -)
    tar -xzf "/tmp/${kustomize_archive}" -C /tmp
    install -m 0755 /tmp/kustomize /usr/local/bin/kustomize
    rm -f /tmp/kustomize "/tmp/${kustomize_archive}" /tmp/kustomize-checksums.txt
    printf '%s\n' "${kustomize_tag#v}" >/usr/local/share/agentimg/kustomize.version
}

install_kind() {
    # Kind

    local kind_tag

    kind_tag="$(git ls-remote --tags --refs https://github.com/kubernetes-sigs/kind.git 'v*' |
        awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' |
        sort -V | tail -n 1)"
    test -n "$kind_tag"
    curl -fsSL "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64" \
        -o /tmp/kind-linux-amd64
    curl -fsSL \
        "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64.sha256sum" \
        -o /tmp/kind-linux-amd64.sha256sum
    (cd /tmp && sha256sum -c kind-linux-amd64.sha256sum)
    install -m 0755 /tmp/kind-linux-amd64 /usr/local/bin/kind
    rm -f /tmp/kind-linux-amd64 /tmp/kind-linux-amd64.sha256sum
    printf '%s\n' "${kind_tag#v}" >/usr/local/share/agentimg/kind.version
}

install_yq() {
    # yq

    local yq_tag
    local yq_sha256_column
    local yq_sha256

    yq_tag="$(git ls-remote --tags --refs https://github.com/mikefarah/yq.git 'v*' |
        awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' |
        sort -V | tail -n 1)"
    test -n "$yq_tag"
    yq_sha256_column="$(curl -fsSL \
        "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums_hashes_order" |
        awk '$1 == "SHA-256" { print NR + 1 }')"
    test -n "$yq_sha256_column"
    yq_sha256="$(curl -fsSL \
        "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums" |
        awk -v column="$yq_sha256_column" '$1 == "yq_linux_amd64" { print $column }')"
    test -n "$yq_sha256"
    curl -fsSL "https://github.com/mikefarah/yq/releases/download/${yq_tag}/yq_linux_amd64" \
        -o /tmp/yq
    printf '%s  yq\n' "$yq_sha256" | (cd /tmp && sha256sum -c -)
    install -m 0755 /tmp/yq /usr/local/bin/yq
    rm -f /tmp/yq
    printf '%s\n' "${yq_tag#v}" >/usr/local/share/agentimg/yq.version
}

configure_systemd() {
    # Systemd container profile

    install -d /etc/systemd/system.conf.d /etc/systemd/journald.conf.d /etc/tmpfiles.d
    install -m 0644 /tmp/agentimg-systemd-container.conf \
        /etc/systemd/system.conf.d/agentimg-container.conf
    install -m 0644 /tmp/agentimg-journald-container.conf \
        /etc/systemd/journald.conf.d/agentimg-container.conf
    install -m 0644 /tmp/agentimg-tmpfiles-tmp.conf /etc/tmpfiles.d/tmp.conf

    systemctl set-default multi-user.target
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
    systemctl disable -- \
        apport-autoreport.path apport-autoreport.timer apport-forward.socket apport.service \
        atop.service atopacct.service containerd.service docker.service e2scrub_reap.service \
        lvm2-lvmpolld.socket multipathd.service nginx.service snapd.service snapd.socket \
        ssh.service ssh.socket sysstat.service tailscaled.service udisks2.service ufw.service \
        || true
}

configure_agent_user() {
    # Agent user and workspace

    usermod -l agent -c "agentimg user" ubuntu
    groupmod -n agent ubuntu
    mv /home/ubuntu /home/agent
    usermod -d /home/agent -s /bin/zsh agent
    sed -i 's/^ubuntu:/agent:/' /etc/subuid /etc/subgid
    usermod -aG docker,sudo agent
    printf 'agent ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/agent
    chmod 0440 /etc/sudoers.d/agent
    visudo -cf /etc/sudoers.d/agent
    install -d /var/lib/systemd/linger
    touch /var/lib/systemd/linger/agent
    install -d -o agent -g agent /home/agent/.cache/zsh /home/agent/.config \
        /home/agent/.local/share /workspace
    install -d -m 0700 -o agent -g agent /home/agent/.docker /home/agent/.kube \
        /home/agent/.ssh /run/user/1000
}

cleanup_image() {
    # Remove build-only files and package metadata

    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub /usr/sbin/policy-rc.d
    rm -f /tmp/agentimg-systemd-container.conf /tmp/agentimg-journald-container.conf \
        /tmp/agentimg-tmpfiles-tmp.conf
    rm -rf /var/lib/apt/lists/*
}

setup() {
    update
    common_packages
    install_tailscale
    install_uv
    install_go
    install_node
    configure_tools
    install_glab
    install_gh
    install_zsh_autosuggestions
    install_kubectl
    install_helm
    install_kustomize
    install_kind
    install_yq
    configure_systemd
    configure_agent_user
    cleanup_image
}

setup "$@"
