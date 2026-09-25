#!/usr/bin/env bash

set -euxo pipefail

common_packages() {
    local apk_packages=(
        # Access control, security, and trust

        acl
        ca-certificates
        gnupg
        libcap
        openssl
        shadow
        sudo

        # Shells, terminal UX, and editors

        bash
        bash-completion
        btop
        dialog
        fzf
        less
        nano
        ncurses
        ncurses-terminfo
        neovim
        tmux
        vim
        zsh
        zsh-syntax-highlighting

        # Build systems and core utilities

        alpine-sdk
        autoconf
        automake
        bison
        cmake
        coreutils
        diffutils
        fakeroot
        flex
        make
        ninja-build
        ninja-is-really-ninja
        parallel
        patch
        pkgconf
        sed
        util-linux

        # Archives and compression

        brotli
        bzip2
        tar
        unzip
        xz
        zip
        zstd

        # Files, text, and data processing

        fd
        file
        findutils
        gettext
        grep
        jq
        tree

        # Version control and code quality

        git
        git-lfs
        mercurial
        ripgrep
        shellcheck
        shfmt
        yamllint

        # Python and databases

        pipx
        py3-pip
        python3
        sqlite

        # Networking clients and diagnostics

        aria2
        bind-tools
        curl
        httpie
        iperf3
        iproute2
        iputils
        mtr
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
        openssh-client-default
        openssh-server
        rsync

        # Containers and system integration

        bubblewrap
        dbus
        docker
        docker-cli-buildx
        docker-cli-compose
        openrc

        # Runtime libraries

        gcompat
        krb5-libs
        libstdc++

        # Media and image processing

        ffmpeg
        imagemagick

        # Monitoring and process diagnostics

        atop
        htop
        iotop
        lsof
        ncdu
        procps-ng
        strace

        # Documentation and supplemental system data

        man-db
        man-pages

        # Mesh VPN networking

        tailscale
    )

    apk add --no-cache "${apk_packages[@]}"
}

common_packages
rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub
