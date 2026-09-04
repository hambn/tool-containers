#!/usr/bin/env bash

set -euxo pipefail

common_packages() {
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

    apk add --no-cache "${apk_packages[@]}"
}

common_packages
rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub
