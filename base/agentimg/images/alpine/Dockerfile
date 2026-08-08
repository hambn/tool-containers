# alpine: Alpine 3.21 developer/agent foundation without a browser.
FROM docker.io/library/alpine:3.21

ARG GH_VERSION=2.94.0
ARG GLAB_VERSION=1.109.0
ARG KUBECTL_VERSION=v1.36.2
ARG ZSH_AUTOSUGGESTIONS_VERSION=0.7.1

RUN apk upgrade --no-cache && \
    apk add --no-cache \
      alpine-sdk atop bash bash-completion btop bubblewrap ca-certificates curl dbus docker \
      docker-cli-buildx docker-cli-compose ffmpeg file fzf git go imagemagick \
      iotop iproute2 iputils jq less libcap lsof make man-db man-pages \
      mitmproxy ncdu net-tools netcat-openbsd neovim openrc openssh-client \
      openssh-server pipx py3-pip python3 ripgrep rsync shadow socat sqlite sudo \
      tailscale tmux tree unzip util-linux vim wget zsh zsh-syntax-highlighting && \
    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub && \
    curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

RUN glab_archive="glab_${GLAB_VERSION}_linux_amd64.tar.gz" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/${glab_archive}" \
      -o "/tmp/${glab_archive}" && \
    curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/checksums.txt" \
      -o /tmp/glab-checksums.txt && \
    grep " ${glab_archive}\$" /tmp/glab-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${glab_archive}" -C /usr/local bin/glab && \
    rm -f "/tmp/${glab_archive}" /tmp/glab-checksums.txt

RUN gh_archive="gh_${GH_VERSION}_linux_amd64.tar.gz" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${GH_VERSION}/${gh_archive}" \
      -o "/tmp/${gh_archive}" && \
    curl -fsSL \
      "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_checksums.txt" \
      -o /tmp/gh-checksums.txt && \
    grep " ${gh_archive}\$" /tmp/gh-checksums.txt | (cd /tmp && sha256sum -c -) && \
    tar -xzf "/tmp/${gh_archive}" -C /tmp && \
    install -m 0755 "/tmp/gh_${GH_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh && \
    rm -rf "/tmp/gh_${GH_VERSION}_linux_amd64" "/tmp/${gh_archive}" \
      /tmp/gh-checksums.txt

# Alpine 3.21 predates its zsh-autosuggestions package, so pin the upstream release.
RUN git clone --depth 1 --branch "v${ZSH_AUTOSUGGESTIONS_VERSION}" \
      https://github.com/zsh-users/zsh-autosuggestions.git \
      /usr/share/zsh/plugins/zsh-autosuggestions && \
    rm -rf /usr/share/zsh/plugins/zsh-autosuggestions/.git

RUN curl -fsSLo /tmp/kubectl \
      "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    curl -fsSLo /tmp/kubectl.sha256 \
      "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" && \
    (cd /tmp && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -) && \
    install -m 0755 /tmp/kubectl /usr/local/bin/kubectl && \
    install -d /usr/local/share/zsh/site-functions && \
    kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl && \
    rm -f /tmp/kubectl /tmp/kubectl.sha256

RUN adduser -D -u 1000 -s /bin/zsh agent && \
    addgroup agent wheel && \
    addgroup agent docker && \
    printf '%%wheel ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/wheel && \
    chmod 0440 /etc/sudoers.d/wheel && \
    install -d -o agent -g agent /home/agent/.cache/zsh /home/agent/.config \
      /home/agent/.local/share /workspace && \
    install -d -m 0700 -o agent -g agent /home/agent/.docker /home/agent/.kube \
      /home/agent/.ssh /run/user/1000

COPY --chown=agent:agent zshrc /home/agent/.zshrc

ENV COLORTERM=truecolor \
    HOME=/home/agent \
    LOGNAME=agent \
    PATH=/usr/local/bin:/usr/local/go/bin:$PATH \
    SHELL=/bin/zsh \
    TERM=xterm-256color \
    USER=agent \
    XDG_CACHE_HOME=/home/agent/.cache \
    XDG_CONFIG_HOME=/home/agent/.config \
    XDG_DATA_HOME=/home/agent/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000
USER agent
WORKDIR /workspace
CMD ["/bin/zsh", "-l"]
