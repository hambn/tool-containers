#!/usr/bin/env bash

set -euxo pipefail

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

install_glab
install_gh
install_zsh_autosuggestions
install_kubectl
install_helm
install_kustomize
install_yq
