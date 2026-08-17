#!/bin/sh

set -eu

bootstrap_bash() {
    if [ -z "${BASH_VERSION:-}" ]; then
        apk add --no-cache bash
        exec /bin/bash "$0" "$@"
    fi
}

bootstrap_bash "$@"

set -euxo pipefail

update() {
    apk upgrade --no-cache
}

common_packages() {
    local profile="${1:-base}"
    local apk_packages=(
        # Access control, security, and trust

        acl                       # POSIX access control list utilities.
        ca-certificates            # Certificate authority bundle for TLS verification.
        gnupg                      # OpenPGP encryption, signing, and key-management tools.
        libcap                     # Linux capability management library.
        openssl                    # TLS and general-purpose cryptography tools.
        shadow                     # User and group management utilities.
        sudo                       # Controlled privilege escalation.

        # Shells, terminal UX, and editors

        bash                       # Bash shell for scripting.
        bash-completion             # Programmable command completion for Bash.
        btop                       # Resource monitor for CPU, memory, disks, and processes.
        dialog                     # Terminal-based dialog box and UI utility.
        fzf                        # Fuzzy finder for interactive command-line workflows.
        less                       # Terminal pager for viewing text.
        nano                       # Small terminal text editor.
        ncurses                    # Terminal UI and character-cell library tools.
        ncurses-terminfo           # Additional ncurses terminal definitions.
        neovim                     # Extensible modal terminal text editor.
        tmux                       # Terminal multiplexer.
        vim                        # Vim text editor.
        zsh                        # Z shell for interactive use and scripting.
        zsh-syntax-highlighting    # Syntax-highlighting plugin for Zsh.

        # Build systems and core utilities

        alpine-sdk                 # Alpine compiler, linker, and build toolchain.
        autoconf                   # Generates configure scripts from templates.
        automake                   # Generates portable Makefiles.
        bison                      # Parser generator.
        cmake                      # Cross-platform build-system generator.
        coreutils                  # GNU-style core command-line utilities.
        diffutils                  # File comparison and patch utilities.
        fakeroot                   # Simulates root ownership during package builds.
        flex                       # Lexical analyzer generator.
        make                       # Build automation tool.
        ninja-build                # Fast build-system backend.
        ninja-is-really-ninja      # Provides the ninja command on Alpine.
        parallel                   # Runs independent jobs in parallel.
        patch                      # Applies source-code patches.
        pkgconf                    # Discovers compiler and linker flags for libraries.
        sed                        # Stream editor for text transformations.
        util-linux                 # Core Linux system utilities.

        # Archives and compression

        brotli                     # Brotli compression and decompression utilities.
        bzip2                      # Bzip2 compression and decompression utilities.
        tar                        # Archiving tool.
        unzip                      # Extracts ZIP archives.
        xz                         # XZ and LZMA compression utilities.
        zip                        # Creates ZIP archives.
        zstd                       # Zstandard compression and decompression utilities.

        # Files, text, and data processing

        fd                         # Fast, user-friendly file finder.
        file                       # Identifies file types from their contents.
        findutils                  # Standard file-search and file-manipulation utilities.
        gettext                    # Internationalization and environment-substitution tools.
        grep                       # Command-line text search.
        jq                         # Command-line JSON processor.
        tree                       # Displays directory trees.

        # Version control and code quality

        git                        # Distributed version-control system.
        git-lfs                    # Git Large File Storage extension.
        mercurial                  # Distributed version-control system.
        ripgrep                    # Fast recursive text-search utility.
        shellcheck                 # Static analyzer for shell scripts.
        shfmt                      # Formatter for shell scripts.
        yamllint                   # Linter for YAML files.

        # Python and databases

        pipx                       # Installs Python CLI applications in isolated environments.
        py3-pip                    # Python 3 package installer.
        python3                    # Python 3 runtime.
        sqlite                     # SQLite command-line client and tools.

        # Networking clients and diagnostics

        aria2                      # Multi-protocol command-line download utility.
        bind-tools                 # DNS query utilities such as dig and nslookup.
        curl                       # Command-line URL transfer client.
        httpie                     # User-friendly command-line HTTP client.
        iperf3                     # Network throughput measurement tool.
        iproute2                   # Linux network administration tools.
        iputils                    # Network diagnostic utilities such as ping.
        mtr                        # Network diagnostic combining ping and traceroute.
        net-tools                  # Legacy networking tools such as ifconfig and netstat.
        netcat-openbsd              # TCP and UDP network connection utility.
        nmap                       # Network discovery and security scanner.
        socat                      # Bidirectional relay for files, sockets, and streams.
        tcpdump                    # Network packet capture and analysis tool.
        traceroute                 # Traces the network path to a destination.
        wget                       # Command-line web downloader.
        whois                      # WHOIS query client.

        # Remote access, synchronization, and proxy/server tools

        mitmproxy                  # Interactive HTTP(S) interception proxy.
        nginx                      # Web server and reverse proxy.
        openssh-client-default     # OpenSSH client and related remote-access utilities.
        openssh-server             # OpenSSH daemon for inbound SSH access.
        rsync                      # Efficient local and remote file synchronization.

        # Containers and system integration

        bubblewrap                 # Unprivileged sandboxing and namespace isolation utility.
        dbus                       # D-Bus message bus and utilities.
        docker                     # Docker CLI and engine package.
        docker-cli-buildx          # Docker Buildx builder plugin.
        docker-cli-compose         # Docker Compose plugin.
        openrc                     # Alpine service manager.

        # Runtime libraries

        gcompat                    # GNU libc compatibility layer for musl.
        krb5-libs                  # Kerberos runtime libraries.
        libstdc++                  # GNU C++ runtime library.

        # Media and image processing

        ffmpeg                     # Audio/video conversion and processing tools.
        imagemagick                # Image conversion and manipulation suite.

        # Monitoring and process diagnostics

        atop                       # Interactive system and process monitor.
        htop                       # Interactive process viewer.
        iotop                      # Monitors process disk I/O usage.
        lsof                       # Lists open files, processes, and sockets.
        ncdu                       # Interactive disk-usage browser.
        procps-ng                  # Process inspection tools such as ps and top.
        strace                     # System-call tracer for debugging.

        # Documentation and supplemental system data

        man-db                     # Manual-page database and viewer support.
        man-pages                  # Linux user-space manual pages.

        # Mesh VPN networking

        tailscale                  # Mesh VPN client.
    )

    if [[ "$profile" == browser ]]; then
        local browser_packages=(
            # Browser runtime

            chromium                 # Chromium browser executable.
            font-noto-emoji          # Emoji font used by browser rendering.
        )
        apk_packages+=("${browser_packages[@]}")
    elif [[ "$profile" != base ]]; then
        printf 'unknown Alpine setup profile: %s\n' "$profile" >&2
        return 1
    fi

    apk add --no-cache "${apk_packages[@]}"
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

    node_metadata="$(curl -fsSL \
        https://unofficial-builds.nodejs.org/download/release/index.json)"
    node_version="$(printf '%s' "$node_metadata" | jq -er \
        '[.[] | select(.lts != false and (.files | index("linux-x64-musl")))][0].version')"
    node_archive="node-${node_version}-linux-x64-musl.tar.xz"
    curl -fsSL \
        "https://unofficial-builds.nodejs.org/download/release/${node_version}/${node_archive}" \
        -o "/tmp/${node_archive}"
    curl -fsSL \
        "https://unofficial-builds.nodejs.org/download/release/${node_version}/SHASUMS256.txt" \
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

configure_agent_user() {
    # Agent user and home

    adduser -D -u 1000 -s /bin/zsh agent
    addgroup agent wheel
    addgroup agent docker
    printf 'agent ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/agent
    chmod 0440 /etc/sudoers.d/agent
    visudo -cf /etc/sudoers.d/agent
    install -d -o agent -g agent /home/agent /home/agent/.cache/zsh /home/agent/.config \
        /home/agent/.local/share
    install -d -m 0700 -o agent -g agent /home/agent/.docker /home/agent/.kube \
        /home/agent/.ssh /run/user/1000
    chmod g-s /home/agent/.docker /home/agent/.kube /home/agent/.ssh /run/user/1000
    chmod 0700 /home/agent/.docker /home/agent/.kube /home/agent/.ssh /run/user/1000
    test "$(stat -c %a /home/agent/.kube)" = 700
}

cleanup_image() {
    # Remove build-only host keys

    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub
}

setup() {
    local profile="${1:-base}"

    update
    common_packages "$profile"
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
    install_yq
    configure_agent_user
    cleanup_image
}

setup "$@"
