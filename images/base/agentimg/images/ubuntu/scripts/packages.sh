#!/usr/bin/env bash

set -euxo pipefail

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

apt-get update
common_packages
rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub
apt-get clean
rm -rf /var/lib/apt/lists/*
