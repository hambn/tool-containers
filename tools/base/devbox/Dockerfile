# syntax=docker/dockerfile:1
# Download stages inherit the fetch stage's bash pipefail SHELL, which hadolint does not track.
# hadolint global ignore=DL4006
#
# Stages lite, full, and browser are the published tiers; the default is browser.
#   docker build --target full --build-arg DISTRO=alpine \
#       --build-arg BASE_IMAGE=ghcr.io/hambn/core:alpine tools/base/devbox
ARG DISTRO=ubuntu
# The core image this tier builds on. CI replaces the tag with the resolved digest.
ARG BASE_IMAGE=ghcr.io/hambn/core:ubuntu
ARG OS_REFRESH=2026-09-25

# renovate: datasource=docker depName=docker.io/library/alpine
ARG ALPINE_IMAGE=docker.io/library/alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6
# renovate: datasource=docker depName=docker.io/chromedp/headless-shell
ARG HEADLESS_SHELL_IMAGE=docker.io/chromedp/headless-shell:151.0.7922.109@sha256:2d349b544a1ea6b5b5fd7c0fe99215ff662339c57407ee2e8c0a11af93516b04

# renovate: datasource=github-releases depName=kubernetes/kubernetes extractVersion=^v(?<version>.+)$
ARG KUBECTL_VERSION=1.37.1
# renovate: datasource=github-releases depName=helm/helm extractVersion=^v(?<version>.+)$
ARG HELM_VERSION=4.3.0
# renovate: datasource=github-releases depName=kubernetes-sigs/kustomize extractVersion=^kustomize/v(?<version>.+)$
ARG KUSTOMIZE_VERSION=5.8.1
# renovate: datasource=github-releases depName=mikefarah/yq extractVersion=^v(?<version>.+)$
ARG YQ_VERSION=4.53.6
# renovate: datasource=github-releases depName=cli/cli extractVersion=^v(?<version>.+)$
ARG GH_VERSION=2.101.0
# renovate: datasource=gitlab-releases depName=gitlab-org/cli extractVersion=^v(?<version>.+)$
ARG GLAB_VERSION=1.119.0
# renovate: datasource=github-releases depName=tailscale/tailscale extractVersion=^v(?<version>.+)$
ARG TAILSCALE_VERSION=1.102.4
# renovate: datasource=github-releases depName=astral-sh/uv
ARG UV_VERSION=0.12.19
# renovate: datasource=golang-version depName=go
ARG GO_VERSION=1.27.1
# renovate: datasource=node-version depName=node versioning=node
ARG NODE_VERSION=24.21.0
# renovate: datasource=npm depName=pnpm
ARG PNPM_VERSION=12.6.0
# renovate: datasource=npm depName=yarn
ARG YARN_VERSION=1.22.22
# renovate: datasource=github-tags depName=zsh-users/zsh-autosuggestions extractVersion=^v(?<version>.+)$
ARG ZSH_AUTOSUGGESTIONS_VERSION=0.7.1
# renovate: datasource=git-refs depName=https://github.com/ohmyzsh/ohmyzsh currentValue=master
ARG OHMYZSH_COMMIT=74965c96098134b192f00084f966b4b02438a739

# --- Static downloads (build platform, TARGETARCH-aware, checksum-verified) ---

FROM --platform=$BUILDPLATFORM ${ALPINE_IMAGE} AS fetch
ARG OS_REFRESH
RUN apk add --no-cache bash coreutils curl jq tar xz
SHELL ["/bin/bash", "-eu", "-o", "pipefail", "-c"]
WORKDIR /tmp

FROM fetch AS kubectl
ARG TARGETARCH KUBECTL_VERSION
RUN url=https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl \
    && curl -fsSLo kubectl "$url" \
    && echo "$(curl -fsSL "$url.sha256")  kubectl" | sha256sum -c - \
    && install -Dm755 kubectl /out/usr/local/bin/kubectl

FROM fetch AS helm
ARG TARGETARCH HELM_VERSION
RUN f=helm-v${HELM_VERSION}-linux-${TARGETARCH}.tar.gz \
    && curl -fsSL --remote-name-all "https://get.helm.sh/$f" "https://get.helm.sh/$f.sha256sum" \
    && sha256sum -c "$f.sha256sum" \
    && tar -xzf "$f" \
    && install -Dm755 linux-${TARGETARCH}/helm /out/usr/local/bin/helm

FROM fetch AS kustomize
ARG TARGETARCH KUSTOMIZE_VERSION
RUN b=https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv${KUSTOMIZE_VERSION} \
    && f=kustomize_v${KUSTOMIZE_VERSION}_linux_${TARGETARCH}.tar.gz \
    && curl -fsSL --remote-name-all "$b/$f" "$b/checksums.txt" \
    && grep " $f\$" checksums.txt | sha256sum -c - \
    && tar -xzf "$f" \
    && install -Dm755 kustomize /out/usr/local/bin/kustomize

FROM fetch AS yq
ARG TARGETARCH YQ_VERSION
RUN b=https://github.com/mikefarah/yq/releases/download/v${YQ_VERSION} \
    && f=yq_linux_${TARGETARCH} \
    && curl -fsSL --remote-name-all "$b/$f" "$b/checksums" "$b/checksums_hashes_order" \
    && column=$(awk '$1 == "SHA-256" { print NR + 1 }' checksums_hashes_order) \
    && awk -v c="$column" -v f="$f" '$1 == f { print $c "  " f }' checksums | sha256sum -c - \
    && install -Dm755 "$f" /out/usr/local/bin/yq

FROM fetch AS gh
ARG TARGETARCH GH_VERSION
RUN b=https://github.com/cli/cli/releases/download/v${GH_VERSION} \
    && f=gh_${GH_VERSION}_linux_${TARGETARCH}.tar.gz \
    && curl -fsSL --remote-name-all "$b/$f" "$b/gh_${GH_VERSION}_checksums.txt" \
    && grep " $f\$" "gh_${GH_VERSION}_checksums.txt" | sha256sum -c - \
    && tar -xzf "$f" \
    && install -Dm755 "gh_${GH_VERSION}_linux_${TARGETARCH}/bin/gh" /out/usr/local/bin/gh

FROM fetch AS glab
ARG TARGETARCH GLAB_VERSION
RUN b=https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads \
    && f=glab_${GLAB_VERSION}_linux_${TARGETARCH}.tar.gz \
    && curl -fsSL --remote-name-all "$b/$f" "$b/checksums.txt" \
    && grep " $f\$" checksums.txt | sha256sum -c - \
    && tar -xzf "$f" bin/glab \
    && install -Dm755 bin/glab /out/usr/local/bin/glab

FROM fetch AS tailscale
ARG TARGETARCH TAILSCALE_VERSION
RUN d=tailscale_${TAILSCALE_VERSION}_${TARGETARCH} \
    && curl -fsSL --remote-name-all "https://pkgs.tailscale.com/stable/$d.tgz" "https://pkgs.tailscale.com/stable/$d.tgz.sha256" \
    && echo "$(cat "$d.tgz.sha256")  $d.tgz" | sha256sum -c - \
    && tar -xzf "$d.tgz" \
    && install -Dm755 "$d/tailscale" /out/usr/local/bin/tailscale \
    && install -Dm755 "$d/tailscaled" /out/usr/local/sbin/tailscaled

FROM fetch AS uv
ARG TARGETARCH UV_VERSION
RUN case "$TARGETARCH" in amd64) arch=x86_64 ;; arm64) arch=aarch64 ;; *) exit 1 ;; esac \
    && d=uv-${arch}-unknown-linux-musl \
    && b=https://github.com/astral-sh/uv/releases/download/${UV_VERSION} \
    && curl -fsSL --remote-name-all "$b/$d.tar.gz" "$b/$d.tar.gz.sha256" \
    && sha256sum -c "$d.tar.gz.sha256" \
    && tar -xzf "$d.tar.gz" \
    && install -Dm755 -t /out/usr/local/bin "$d/uv" "$d/uvx"

FROM fetch AS go
ARG TARGETARCH GO_VERSION
RUN f=go${GO_VERSION}.linux-${TARGETARCH}.tar.gz \
    && sum=$(curl -fsSL 'https://go.dev/dl/?mode=json&include=all' | jq -er --arg f "$f" '.[].files[] | select(.filename == $f) | .sha256') \
    && curl -fsSLO "https://go.dev/dl/$f" \
    && echo "$sum  $f" | sha256sum -c - \
    && install -d /out/usr/local \
    && tar -xzf "$f" -C /out/usr/local

FROM fetch AS node
ARG TARGETARCH NODE_VERSION DISTRO
RUN case "$TARGETARCH" in amd64) arch=x64 ;; arm64) arch=arm64 ;; *) exit 1 ;; esac \
    && if [ "$DISTRO" = alpine ]; then \
        b=https://unofficial-builds.nodejs.org/download/release/v${NODE_VERSION}; f=node-v${NODE_VERSION}-linux-${arch}-musl.tar.xz; \
    else \
        b=https://nodejs.org/dist/v${NODE_VERSION}; f=node-v${NODE_VERSION}-linux-${arch}.tar.xz; \
    fi \
    && curl -fsSL --remote-name-all "$b/$f" "$b/SHASUMS256.txt" \
    && grep " $f\$" SHASUMS256.txt | sha256sum -c - \
    && install -d /out/usr/local \
    && tar -xJf "$f" -C /out/usr/local --strip-components=1 --no-same-owner \
        --exclude='*/CHANGELOG.md' --exclude='*/LICENSE' --exclude='*/README.md' \
        --exclude='*/share/doc' --exclude='*/share/man' \
    && ln -s node /out/usr/local/bin/nodejs

# --- Distribution-independent configuration layer ------------------------------

FROM fetch AS config-rootfs
ARG OHMYZSH_COMMIT ZSH_AUTOSUGGESTIONS_VERSION
ADD https://github.com/ohmyzsh/ohmyzsh.git#${OHMYZSH_COMMIT} /src/ohmyzsh
ADD https://github.com/zsh-users/zsh-autosuggestions.git#v${ZSH_AUTOSUGGESTIONS_VERSION} /src/zsh-autosuggestions
COPY rootfs/ /out/
RUN h=/out/home/sysadmin \
    && z=$h/.config/zsh \
    && chmod -R u=rwX,go=rX /out \
    && chmod 0750 /out/etc/sudoers.d \
    && chmod 0440 /out/etc/sudoers.d/sysadmin \
    && install -d "$z/plugins/zsh-autosuggestions" "$h/.cache/zsh" "$h/.local/bin" "$h/.local/share" \
    && install -d -m 0700 "$h/.docker" "$h/.kube" "$h/.ssh" /out/run/user/1000 \
    && cp /src/ohmyzsh/lib/*.zsh "$z/conf.d/" \
    && cp -R /src/ohmyzsh/plugins/git /src/ohmyzsh/plugins/kubectl "$z/plugins/" \
    && cp /src/zsh-autosuggestions/zsh-autosuggestions.zsh /src/zsh-autosuggestions/zsh-autosuggestions.plugin.zsh \
        "$z/plugins/zsh-autosuggestions/" \
    && chown -R 1000:1000 "$h" /out/run/user/1000

FROM scratch AS config
COPY --link --from=config-rootfs /out/ /

# --- lite ----------------------------------------------------------------------

FROM ${BASE_IMAGE} AS core

FROM core AS ubuntu-lite-base
USER root
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/lite-ubuntu.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt
RUN ln -s /usr/bin/fdfind /usr/local/bin/fd \
    && groupadd -g 1000 sysadmin \
    && useradd -m -u 1000 -g sysadmin -G sudo -s /bin/zsh -d /home/sysadmin sysadmin

FROM core AS alpine-lite-base
USER root
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/lite-alpine.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt
RUN addgroup -g 1000 sysadmin \
    && adduser -D -u 1000 -G sysadmin -h /home/sysadmin -s /bin/zsh sysadmin \
    && addgroup sysadmin wheel

FROM ${DISTRO}-lite-base AS lite-payload
SHELL ["/bin/bash", "-eu", "-o", "pipefail", "-c"]
RUN setcap cap_net_raw=+ep "$(readlink -f "$(command -v ping)")" \
    && infocmp -x xterm-256color \
        | sed -e '/^#/d' -e 's/^xterm-256color|/xterm-ghostty|ghostty|Ghostty|/' \
        | tic -x -
ENV HOME=/home/sysadmin \
    USER=sysadmin \
    LOGNAME=sysadmin \
    ZDOTDIR=/home/sysadmin \
    SHELL=/bin/zsh \
    EDITOR=nvim \
    VISUAL=nvim \
    PAGER=less \
    LESS=-FRX \
    LANG=C.UTF-8 \
    TERM=xterm-256color \
    COLORTERM=truecolor \
    XDG_CACHE_HOME=/home/sysadmin/.cache \
    XDG_CONFIG_HOME=/home/sysadmin/.config \
    XDG_DATA_HOME=/home/sysadmin/.local/share \
    XDG_RUNTIME_DIR=/run/user/1000 \
    NPM_CONFIG_PREFIX=/home/sysadmin/.local \
    PATH=/home/sysadmin/.local/bin:/usr/local/go/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    container=oci

# --- full ----------------------------------------------------------------------

FROM lite-payload AS ubuntu-full-base
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/full-ubuntu.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt \
    && rm -f /etc/ssh/ssh_host_*
RUN --mount=type=bind,source=scripts/configure-systemd.sh,target=/tmp/configure-systemd.sh \
    bash /tmp/configure-systemd.sh

FROM lite-payload AS alpine-full-base
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/full-alpine.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt \
    && rm -f /etc/ssh/ssh_host_* \
    && { grep -q '^docker:' /etc/group || addgroup -S docker; }

FROM ${DISTRO}-full-base AS full-payload
COPY --link --from=kubectl /out/ /
COPY --link --from=helm /out/ /
COPY --link --from=kustomize /out/ /
COPY --link --from=yq /out/ /
COPY --link --from=gh /out/ /
COPY --link --from=glab /out/ /
COPY --link --from=tailscale /out/ /
COPY --link --from=uv /out/ /
COPY --link --from=go /out/ /
COPY --link --from=node /out/ /
ARG PNPM_VERSION YARN_VERSION
RUN install -d /usr/local/share/zsh/site-functions \
    && kubectl completion zsh >/usr/local/share/zsh/site-functions/_kubectl \
    && npm install --global --prefix=/usr/local --no-audit --no-fund --cache /tmp/npm-cache "pnpm@${PNPM_VERSION}" "yarn@${YARN_VERSION}" \
    && rm -rf /tmp/npm-cache \
    && usermod -aG docker sysadmin \
    && install -d -o 1000 -g 1000 /workspace

# --- browser -------------------------------------------------------------------

FROM ${HEADLESS_SHELL_IMAGE} AS headless-shell

FROM full-payload AS ubuntu-browser-base
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/browser-ubuntu.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt
COPY --link --from=headless-shell /headless-shell /headless-shell
ENV BROWSER_BIN=/headless-shell/headless-shell \
    PATH=/headless-shell:$PATH

FROM full-payload AS alpine-browser-base
ARG OS_REFRESH
RUN --mount=type=bind,source=scripts/install-packages.sh,target=/tmp/install-packages.sh \
    --mount=type=bind,source=packages/browser-alpine.txt,target=/tmp/packages.txt \
    bash /tmp/install-packages.sh /tmp/packages.txt
ENV BROWSER_BIN=/usr/bin/chromium-browser

FROM ${DISTRO}-browser-base AS browser-payload

# --- Published tiers -----------------------------------------------------------

FROM lite-payload AS lite
COPY --link --from=config / /
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]

FROM full-payload AS full
COPY --link --from=config / /
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]

FROM browser-payload AS browser
COPY --link --from=config / /
USER sysadmin
WORKDIR /home/sysadmin
CMD ["/bin/zsh", "-l"]
