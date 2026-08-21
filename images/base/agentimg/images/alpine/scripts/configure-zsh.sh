#!/usr/bin/env bash

set -euxo pipefail

install_oh_my_zsh() {
    local zsh_config_dir="$1"
    local source_dir
    local plugin_name
    local -a oh_my_zsh_plugins=(git kubectl)
    local -a sparse_paths=(lib)

    source_dir="$(mktemp -d)"
    for plugin_name in "${oh_my_zsh_plugins[@]}"; do
        sparse_paths+=("plugins/${plugin_name}")
    done

    git clone --depth 1 --filter=blob:none --sparse --branch master \
        https://github.com/ohmyzsh/ohmyzsh.git "$source_dir"
    git -C "$source_dir" sparse-checkout set "${sparse_paths[@]}"

    install -m 0644 -o sysadmin -g sysadmin \
        "$source_dir"/lib/*.zsh "$zsh_config_dir/conf.d/"
    for plugin_name in "${oh_my_zsh_plugins[@]}"; do
        install -d "$zsh_config_dir/plugins/$plugin_name"
        cp -R "$source_dir/plugins/$plugin_name/." \
            "$zsh_config_dir/plugins/$plugin_name/"
    done

    rm -rf "$source_dir"
}

configure_zsh() {
    local zsh_home=/home/sysadmin
    local zsh_config_dir="$zsh_home/.config/zsh"

    install -d -o sysadmin -g sysadmin \
        "$zsh_config_dir/conf.d" "$zsh_config_dir/plugins"
    install -m 0644 -o sysadmin -g sysadmin /tmp/zshenv "$zsh_home/.zshenv"
    install -m 0644 -o sysadmin -g sysadmin /tmp/zshrc "$zsh_home/.zshrc"
    install -m 0644 -o sysadmin -g sysadmin /tmp/zprofile "$zsh_home/.zprofile"
    install -m 0644 -o sysadmin -g sysadmin \
        /tmp/agentimg-conf.d/*.zsh "$zsh_config_dir/conf.d/"

    install_oh_my_zsh "$zsh_config_dir"
    chown -R sysadmin:sysadmin "$zsh_config_dir"
}

configure_zsh
