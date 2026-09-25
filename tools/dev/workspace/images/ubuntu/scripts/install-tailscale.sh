#!/usr/bin/env bash

set -euxo pipefail

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

install_tailscale
rm -f /usr/sbin/policy-rc.d
apt-get clean
rm -rf /var/lib/apt/lists/*
