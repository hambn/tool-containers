# ubuntu: broad Ubuntu 24.04 developer/agent foundation without a browser.
FROM docker.io/library/ubuntu:24.04

ARG GH_VERSION=2.94.0
ARG GLAB_VERSION=1.109.0
ARG KUBECTL_VERSION=v1.36.2

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef dist-upgrade && \
    apt-get install -y --no-install-recommends \
      atop bash-completion bsdmainutils btop bubblewrap build-essential ca-certificates curl \
      dbus-user-session \
      docker-buildx docker-compose-v2 docker.io ffmpeg file fzf git golang-go imagemagick \
      iotop iproute2 iputils-ping jq less libcap2-bin locales locales-all lsof make \
      man-db manpages manpages-dev mitmproxy ncdu net-tools netcat-openbsd neovim \
      openssh-client openssh-server pipx psmisc python-is-python3 python3-pip ripgrep \
      rsync socat sqlite3 sudo systemd systemd-sysv tmux tree ubuntu-dev-tools ubuntu-server \
      ubuntu-standard unzip util-linux vim wget zsh zsh-autosuggestions \
      zsh-syntax-highlighting && \
    apt-get remove -y pollinate ubuntu-fan && \
    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub /usr/sbin/policy-rc.d && \
    rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
      -o /usr/share/keyrings/tailscale-archive-keyring.gpg && \
    curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
      -o /etc/apt/sources.list.d/tailscale.list && \
    apt-get update && apt-get install -y --no-install-recommends tailscale && \
    rm -rf /var/lib/apt/lists/* && \
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

RUN curl -fsSLo /tmp/kubectl \
      "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    curl -fsSLo /tmp/kubectl.sha256 \
      "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" && \
    (cd /tmp && echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -) && \
    install -m 0755 /tmp/kubectl /usr/local/bin/kubectl && \
    install -d /usr/local/share/zsh/site-functions && \
    kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl && \
    rm -f /tmp/kubectl /tmp/kubectl.sha256

# These daemons are available but opt-in; a derived image or runtime may enable them.
RUN systemctl disable docker.service containerd.service ssh.service ssh.socket tailscaled.service || true

RUN usermod -l agent -c "agentimg user" ubuntu && \
    groupmod -n agent ubuntu && \
    mv /home/ubuntu /home/agent && \
    usermod -d /home/agent -s /bin/zsh agent && \
    sed -i 's/^ubuntu:/agent:/' /etc/subuid /etc/subgid && \
    usermod -aG docker,sudo agent && \
    printf 'agent ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/agent && \
    chmod 0440 /etc/sudoers.d/agent && \
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
