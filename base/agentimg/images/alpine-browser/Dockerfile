# alpine-browser: Alpine 3.21 developer/agent foundation with Chromium.
FROM docker.io/library/alpine:3.21

RUN apk upgrade --no-cache && \
    apk add --no-cache \
      alpine-sdk atop bash btop bubblewrap ca-certificates chromium curl dbus \
      docker docker-cli-buildx docker-cli-compose ffmpeg file font-noto-emoji \
      github-cli git go imagemagick iotop iproute2 iputils jq less libcap \
      lsof make man-db man-pages mitmproxy ncdu net-tools netcat-openbsd \
      neovim openrc openssh-client openssh-server pipx py3-pip python3 ripgrep \
      rsync shadow socat sqlite sudo tailscale tree unzip util-linux vim wget && \
    rm -f /etc/ssh/ssh_host_*_key /etc/ssh/ssh_host_*_key.pub && \
    curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

RUN adduser -D -u 1000 -s /bin/bash agent && \
    addgroup agent wheel && \
    addgroup agent docker && \
    printf '%%wheel ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/wheel && \
    chmod 0440 /etc/sudoers.d/wheel

ENV BROWSER_BIN=/usr/bin/chromium-browser \
    PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
CMD ["/bin/bash"]
