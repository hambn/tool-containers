#!/usr/bin/env bash

set -euxo pipefail

common_packages() {
    local apt_packages=(
        # Access control, security, and trust

        acl
        ca-certificates
        dirmngr
        gnupg
        libcap2-bin
        sudo

        # Shells, terminal UX, and editors

        bash-completion
        dialog
        fzf
        less
        nano
        ncurses-bin
        ncurses-term
        neovim
        tmux
        vim
        zsh
        zsh-syntax-highlighting

        # Build systems and compilation

        autoconf
        automake
        bison
        build-essential
        cmake
        fakeroot
        flex
        make
        ninja-build
        parallel
        patch
        pkg-config

        # Archives and compression

        brotli
        bzip2
        unzip
        xz-utils
        zip
        zstd

        # Files, text, and data processing

        bsdmainutils
        fd-find
        file
        gettext-base
        jq
        ripgrep
        tree

        # Version control and code quality

        git
        git-lfs
        mercurial
        shellcheck
        shfmt
        yamllint

        # Python and databases

        pipx
        python-is-python3
        python3-pip
        sqlite3

        # Networking clients and diagnostics

        aria2
        curl
        dnsutils
        httpie
        iperf3
        iproute2
        iputils-ping
        mtr-tiny
        net-tools
        netcat-openbsd
        nmap
        socat
        tcpdump
        traceroute
        wget
        whois

        # Remote access, synchronization, and proxy/server tools

        mitmproxy
        nginx
        openssh-client
        openssh-server
        rsync

        # Containers and system integration

        bubblewrap
        dbus-user-session
        docker-buildx
        docker-compose-v2
        docker.io
        systemd
        systemd-sysv

        # Media and image processing

        ffmpeg
        imagemagick

        # Monitoring and process diagnostics

        atop
        btop
        htop
        iotop
        lsof
        ncdu
        psmisc
        procps
        strace

        # Documentation, locales, and Ubuntu base profiles

        locales
        locales-all
        man-db
        manpages
        manpages-dev
        ubuntu-dev-tools
        ubuntu-server
        ubuntu-standard
        util-linux
    )

    apt-get install -y --no-install-recommends "${apt_packages[@]}"

    local apt_remove_packages=(
        # Packages removed because they are not useful in the container runtime.

        pollinate
        ubuntu-fan
    )

    apt-get remove -y "${apt_remove_packages[@]}"
}

apt-get update
common_packages
rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub
apt-get clean
rm -rf /var/lib/apt/lists/*
