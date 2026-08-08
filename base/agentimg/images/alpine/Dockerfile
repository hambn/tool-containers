# alpine: Alpine 3.21 developer/agent foundation without a browser.
FROM docker.io/library/alpine:3.21

RUN apk upgrade --no-cache && \
    apk add --no-cache \
      acl alpine-sdk atop autoconf automake bash bash-completion bind-tools btop bubblewrap \
      ca-certificates cmake coreutils curl dbus diffutils docker docker-cli-buildx \
      docker-cli-compose fd ffmpeg file findutils fzf gcompat gettext git git-lfs gnupg \
      grep htop httpie imagemagick iotop iproute2 iputils jq less libcap \
      lsof make man-db man-pages mitmproxy ncdu ncurses ncurses-terminfo net-tools \
      netcat-openbsd neovim nginx ninja-build ninja-is-really-ninja openrc \
      openssh-client-default openssh-server openssl parallel patch pipx pkgconf procps-ng \
      py3-pip python3 ripgrep rsync sed shadow \
      shellcheck shfmt socat sqlite strace sudo tailscale tar tcpdump tmux tree unzip \
      util-linux vim wget whois xz zip zsh zsh-syntax-highlighting && \
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

RUN git config --system init.defaultBranch main && \
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
RUN zsh_autosuggestions_version="$(curl -fsSL \
      https://api.github.com/repos/zsh-users/zsh-autosuggestions/releases/latest | \
      jq -er '.tag_name | ltrimstr("v")')" && \
    git clone --depth 1 --branch "v${zsh_autosuggestions_version}" \
      https://github.com/zsh-users/zsh-autosuggestions.git \
      /usr/share/zsh/plugins/zsh-autosuggestions && \
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git && \
    install -d /usr/local/share/agentimg && \
    printf '%s\n' "$zsh_autosuggestions_version" \
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

COPY --chown=agent:agent zshrc /home/agent/.zshrc

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
