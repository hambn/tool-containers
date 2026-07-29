# alpine: Alpine 3.21 developer/agent foundation without a browser.
FROM docker.io/library/alpine:3.21

ARG GLAB_VERSION=1.109.0

RUN apk upgrade --no-cache && \
    apk add --no-cache \
      alpine-sdk atop bash btop bubblewrap ca-certificates curl dbus docker \
      docker-cli-buildx docker-cli-compose ffmpeg file github-cli git go imagemagick \
      iotop iproute2 iputils jq less libcap lsof make man-db man-pages \
      mitmproxy ncdu net-tools netcat-openbsd neovim openrc openssh-client \
      openssh-server pipx py3-pip python3 ripgrep rsync shadow socat sqlite sudo \
      tailscale tree unzip util-linux vim wget && \
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

RUN adduser -D -u 1000 -s /bin/bash agent && \
    addgroup agent wheel && \
    addgroup agent docker && \
    printf '%%wheel ALL=(ALL) NOPASSWD:ALL\n' >/etc/sudoers.d/wheel && \
    chmod 0440 /etc/sudoers.d/wheel

ENV PATH=/usr/local/bin:/usr/local/go/bin:$PATH
WORKDIR /workspace
CMD ["/bin/bash"]
