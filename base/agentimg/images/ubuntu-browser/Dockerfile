# ubuntu-browser: broad Ubuntu 24.04 developer/agent foundation with headless Chromium.
ARG BROWSER_BASE=docker.io/chromedp/headless-shell:stable
ARG RUNTIME_BASE=docker.io/library/ubuntu:24.04
FROM ${BROWSER_BASE} AS browser

FROM ${RUNTIME_BASE}

ARG GLAB_VERSION=1.109.0

SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get -y -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef dist-upgrade && \
    apt-get install -y --no-install-recommends \
      atop bsdmainutils btop bubblewrap build-essential ca-certificates curl dbus-user-session \
      docker-buildx docker-compose-v2 docker.io ffmpeg file fonts-noto-color-emoji fonts-symbola \
      gh git golang-go imagemagick iotop iproute2 iputils-ping jq less libcap2-bin \
      libgbm1 libglib2.0-0 libgtk-3-0 libnss3 libx11-6 libxcomposite1 libxdamage1 \
      libxext6 libxi6 libxrandr2 locales locales-all lsof make man-db manpages manpages-dev \
      mitmproxy ncdu net-tools netcat-openbsd neovim openssh-client openssh-server \
      pipx psmisc python-is-python3 python3-pip ripgrep rsync socat sqlite3 sudo \
      systemd systemd-sysv tree ubuntu-dev-tools ubuntu-server ubuntu-standard \
      unzip util-linux vim wget && \
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

# These daemons are available but opt-in; a derived image or runtime may enable them.
RUN systemctl disable docker.service containerd.service ssh.service ssh.socket tailscaled.service || true

RUN usermod -l agent -c "agentimg user" ubuntu && \
    groupmod -n agent ubuntu && \
    mv /home/ubuntu /home/agent && \
    usermod -d /home/agent -s /bin/bash agent && \
    sed -i 's/^ubuntu:/agent:/' /etc/subuid /etc/subgid && \
    usermod -aG docker,sudo agent && \
    printf 'agent ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/agent && \
    chmod 0440 /etc/sudoers.d/agent

COPY --from=browser /headless-shell /headless-shell
ENV BROWSER_BIN=/headless-shell/headless-shell \
    PATH=/headless-shell:/usr/local/bin:/usr/local/go/bin:$PATH

# systemd needs root as PID 1; interactive deployment recipes override CMD with a shell.
STOPSIGNAL SIGRTMIN+3
WORKDIR /workspace
CMD ["/sbin/init"]
