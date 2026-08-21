#!/usr/bin/env bash

set -euxo pipefail

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

install_uv
install_go
install_node
