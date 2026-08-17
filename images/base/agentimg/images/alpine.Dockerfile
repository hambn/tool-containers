# alpine: Alpine 3.21 developer/agent foundation without a browser.
FROM docker.io/library/alpine:3.21

RUN apk upgrade --no-cache && \
    apk add --no-cache \
      acl alpine-sdk aria2 atop autoconf automake bash bash-completion bind-tools bison brotli \
      btop bubblewrap bzip2 ca-certificates cmake coreutils curl dbus dialog diffutils docker \
      docker-cli-buildx \
      docker-cli-compose fd ffmpeg file findutils fzf gcompat gettext git git-lfs gnupg \
      grep fakeroot flex htop httpie imagemagick iotop iperf3 iproute2 iputils jq krb5-libs \
      less libcap libstdc++ lsof make man-db man-pages mercurial mitmproxy mtr nano ncdu ncurses \
      ncurses-terminfo net-tools netcat-openbsd neovim nginx ninja-build ninja-is-really-ninja \
      nmap openrc \
      openssh-client-default openssh-server openssl parallel patch pipx pkgconf procps-ng \
      py3-pip python3 ripgrep rsync sed shadow \
      shellcheck shfmt socat sqlite strace sudo tailscale tar tcpdump tmux traceroute tree unzip \
      util-linux vim wget whois xz yamllint zip zsh zsh-syntax-highlighting zstd && \
    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub && \
    curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]

RUN go_metadata="$(curl -fsSL 'https://go.dev/dl/?mode=json')" && \
    go_version="$(printf '%s' "$go_metadata" | \
      jq -er '[.[] | select(.stable == true)][0].version')" && \
    go_sha256="$(printf '%s' "$go_metadata" | jq -er --arg version "$go_version" \
      '[.[] | select(.version == $version)][0].files[] | \
       select(.os == "linux" and .arch == "amd64" and .kind == "archive") | .sha256')" && \
    go_archive="${go_version}.linux-amd64.tar.gz" && \
    curl -fsSL "https://go.dev/dl/${go_archive}" -o "/tmp/${go_archive}" && \
    printf '%s  %s\n' "$go_sha256" "$go_archive" | (cd /tmp && sha256sum -c -) && \
    rm -rf /usr/local/go && \
    tar -xzf "/tmp/${go_archive}" -C /usr/local && \
    ln -sf /usr/local/go/bin/go /usr/local/bin/go && \
    ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt && \
    rm -f "/tmp/${go_archive}" && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "$go_version" >/usr/local/share/agentimg/go.version

RUN node_metadata="$(curl -fsSL \
      https://unofficial-builds.nodejs.org/download/release/index.json)" && \
    node_version="$(printf '%s' "$node_metadata" | jq -er \
      '[.[] | select(.lts != false and (.files | index("linux-x64-musl")))][0].version')" && \
    node_archive="node-${node_version}-linux-x64-musl.tar.xz" && \
    curl -fsSL \
      "https://unofficial-builds.nodejs.org/download/release/${node_version}/${node_archive}" \
      -o "/tmp/${node_archive}" && \
    curl -fsSL \
      "https://unofficial-builds.nodejs.org/download/release/${node_version}/SHASUMS256.txt" \
      -o /tmp/node-SHASUMS256.txt && \
    grep " ${node_archive}\$" /tmp/node-SHASUMS256.txt | \
      (cd /tmp && sha256sum -c -) && \
    tar -xJf "/tmp/${node_archive}" -C /usr/local --strip-components=1 --no-same-owner && \
    ln -sf /usr/local/bin/node /usr/local/bin/nodejs && \
    rm -f "/tmp/${node_archive}" /tmp/node-SHASUMS256.txt && \
    npm install --global --no-audit --no-fund pnpm@latest yarn@latest && \
    npm cache clean --force && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "${node_version#v}" >/usr/local/share/agentimg/node.version

RUN ping_path="$(readlink -f "$(command -v ping)")" && \
    setcap cap_net_raw=+ep "$ping_path" && \
    getcap "$ping_path" | grep -q cap_net_raw && \
    git config --system init.defaultBranch main && \
    git config --system fetch.prune true && \
    git config --system push.autoSetupRemote true && \
    git lfs install --system && \
    infocmp -x xterm-256color | \
      sed -e '/^#/d' -e 's/^xterm-256color|/xterm-ghostty|ghostty|Ghostty|/' | \
      tic -x -

RUN glab_version="$(curl -fsSL \
      'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases/permalink/latest' | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    glab_archive="glab_${glab_version}_linux_amd64.tar.gz" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/${glab_archive}" \
      -o "/tmp/${glab_archive}" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${glab_version}/downloads/checksums.txt" \
      -o /tmp/glab-checksums.txt && \
    grep " ${glab_archive}\$" /tmp/glab-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${glab_archive}" -C /usr/local bin/glab && \
    rm -f "/tmp/${glab_archive}" /tmp/glab-checksums.txt

RUN gh_version="$(curl -fsSL \
      https://api.github.com/repos/cli/cli/releases/latest | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    gh_archive="gh_${gh_version}_linux_amd64.tar.gz" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${gh_version}/${gh_archive}" \
      -o "/tmp/${gh_archive}" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${gh_version}/gh_${gh_version}_checksums.txt" \
      -o /tmp/gh-checksums.txt && \
    grep " ${gh_archive}\$" /tmp/gh-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${gh_archive}" -C /tmp && \
    install -m 0755 "/tmp/gh_${gh_version}_linux_amd64/bin/gh" /usr/local/bin/gh && \
    rm -rf "/tmp/gh_${gh_version}_linux_amd64" "/tmp/${gh_archive}" \
      /tmp/gh-checksums.txt

# Alpine 3.21 predates its package, so install the current upstream release.
RUN zsh_autosuggestions_tag="$(git ls-remote --tags --refs \
      https://github.com/zsh-users/zsh-autosuggestions.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$zsh_autosuggestions_tag" && \
    git clone --depth 1 --branch "$zsh_autosuggestions_tag" \
      https://github.com/zsh-users/zsh-autosuggestions.git \
      /usr/share/zsh/plugins/zsh-autosuggestions && \
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "${zsh_autosuggestions_tag#v}" \
      >/usr/local/share/agentimg/zsh-autosuggestions.version

RUN kubectl_version="$(curl -fsSL \
      https://dl.k8s.io/release/stable.txt)" && \
    curl -fsSLo /tmp/kubectl \
      "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl" && \
    curl -fsSLo /tmp/kubectl.sha256 \
      "https://dl.k8s.io/release/${kubectl_version}/bin/linux/amd64/kubectl.sha256" && \
    (cd /tmp && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -) && \
    install -m 0755 /tmp/kubectl /usr/local/bin/kubectl && \
    install -d /usr/local/share/zsh/site-functions && \
    kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl && \
    rm -f /tmp/kubectl /tmp/kubectl.sha256

RUN helm_tag="$(git ls-remote --tags --refs https://github.com/helm/helm.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$helm_tag" && \
    helm_archive="helm-${helm_tag}-linux-amd64.tar.gz" && \
    curl -fsSL "https://get.helm.sh/${helm_archive}" -o "/tmp/${helm_archive}" && \
    curl -fsSL "https://get.helm.sh/${helm_archive}.sha256sum" \
      -o "/tmp/${helm_archive}.sha256sum" && \
    (cd /tmp && sha256sum -c "${helm_archive}.sha256sum") && \
    tar -xzf "/tmp/${helm_archive}" -C /tmp && \
    install -m 0755 /tmp/linux-amd64/helm /usr/local/bin/helm && \
    rm -rf /tmp/linux-amd64 "/tmp/${helm_archive}" "/tmp/${helm_archive}.sha256sum" && \
    printf '%s\n' "${helm_tag#v}" >/usr/local/share/agentimg/helm.version

RUN kustomize_tag="$(git ls-remote --tags --refs \
      https://github.com/kubernetes-sigs/kustomize.git 'kustomize/v*' | \
      awk -F/ '$3 == "kustomize" && $4 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $4 }' | \
      sort -V | tail -n 1)" && \
    test -n "$kustomize_tag" && \
    kustomize_archive="kustomize_${kustomize_tag}_linux_amd64.tar.gz" && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/${kustomize_archive}" \
      -o "/tmp/${kustomize_archive}" && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2F${kustomize_tag}/checksums.txt" \
      -o /tmp/kustomize-checksums.txt && \
    grep " ${kustomize_archive}\$" /tmp/kustomize-checksums.txt | \
      (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${kustomize_archive}" -C /tmp && \
    install -m 0755 /tmp/kustomize /usr/local/bin/kustomize && \
    rm -f /tmp/kustomize "/tmp/${kustomize_archive}" /tmp/kustomize-checksums.txt && \
    printf '%s\n' "${kustomize_tag#v}" >/usr/local/share/agentimg/kustomize.version

RUN kind_tag="$(git ls-remote --tags --refs https://github.com/kubernetes-sigs/kind.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$kind_tag" && \
    curl -fsSL "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64" \
      -o /tmp/kind-linux-amd64 && \
    curl -fsSL \
      "https://github.com/kubernetes-sigs/kind/releases/download/${kind_tag}/kind-linux-amd64.sha256sum" \
      -o /tmp/kind-linux-amd64.sha256sum && \
    (cd /tmp && sha256sum -c kind-linux-amd64.sha256sum) && \
    install -m 0755 /tmp/kind-linux-amd64 /usr/local/bin/kind && \
    rm -f /tmp/kind-linux-amd64 /tmp/kind-linux-amd64.sha256sum && \
    printf '%s\n' "${kind_tag#v}" >/usr/local/share/agentimg/kind.version

RUN yq_tag="$(git ls-remote --tags --refs https://github.com/mikefarah/yq.git 'v*' | \
      awk -F/ '$3 ~ /^v[0-9]+\.[0-9]+\.[0-9]+$/ { print $3 }' | \
      sort -V | tail -n 1)" && \
    test -n "$yq_tag" && \
    yq_sha256_column="$(curl -fsSL \
      "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums_hashes_order" | \
      awk '$1 == "SHA-256" { print NR + 1 }')" && \
    test -n "$yq_sha256_column" && \
    yq_sha256="$(curl -fsSL \
      "https://github.com/mikefarah/yq/releases/download/${yq_tag}/checksums" | \
      awk -v column="$yq_sha256_column" '$1 == "yq_linux_amd64" { print $column }')" && \
    test -n "$yq_sha256" && \
    curl -fsSL "https://github.com/mikefarah/yq/releases/download/${yq_tag}/yq_linux_amd64" \
      -o /tmp/yq && \
    printf '%s  yq\n' "$yq_sha256" | (cd /tmp && sha256sum -c -) && \
    install -m 0755 /tmp/yq /usr/local/bin/yq && \
    rm -f /tmp/yq && \
    printf '%s\n' "${yq_tag#v}" >/usr/local/share/agentimg/yq.version

RUN adduser -D -u 1000 -s /bin/zsh agent && \
    addgroup agent wheel && \
    addgroup agent docker && \
    printf 'agent ALL=(ALL:ALL) NOPASSWD: ALL\n' >/etc/sudoers.d/agent && \
    chmod 0440 /etc/sudoers.d/agent && \
    visudo -cf /etc/sudoers.d/agent && \
    install -d -o agent -g agent /home/agent/.cache/zsh /home/agent/.config \
      /home/agent/.local/share /workspace && \
    install -d -m 0700 -o agent -g agent /home/agent/.docker /home/agent/.kube \
      /home/agent/.ssh /run/user/1000

COPY --chown=agent:agent common/zshrc /home/agent/.zshrc
COPY --chown=agent:agent common/zprofile /home/agent/.zprofile

RUN chmod g-s /home/agent/.docker /home/agent/.kube /home/agent/.ssh /run/user/1000 && \
    chmod 0700 /home/agent/.docker /home/agent/.kube /home/agent/.ssh /run/user/1000 && \
    test "$(stat -c %a /home/agent/.kube)" = 700

ENV COLORTERM=truecolor \
    EDITOR=nvim \
    HOME=/home/agent \
    LANG=C.UTF-8 \
    LESS=-FRX \
    LOGNAME=agent \
    PAGER=less \
    PATH=/home/agent/.local/bin:/usr/local/bin:/usr/local/go/bin:$PATH \
    SHELL=/bin/zsh \
    TERM=xterm-256color \
    USER=agent \
    VISUAL=nvim \
    XDG_CACHE_HOME=/home/agent/.cache \
    XDG_CONFIG_HOME=/home/agent/.config \
    XDG_DATA_HOME=/home/agent/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000
USER agent
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
