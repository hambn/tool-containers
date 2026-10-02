---
name: devbox
title: devbox
description: Ubuntu and Alpine images for development shells and CI jobs, in lite, full, and browser tiers, with Zsh, sudo, and pinned toolchains.
order: 2
images: [ghcr.io/hambn/devbox, docker.io/hambn/devbox]
keywords: [development container, ci image, ubuntu, alpine, zsh, headless chromium]
---

# devbox

Ubuntu and Alpine images for interactive development and CI jobs, built on
[core](../core/README.md) in three tiers. Each image runs a Zsh login shell as
`sysadmin` (UID and GID 1000) with passwordless `sudo`. The [AI images](../../ai/)
build `FROM` devbox.

- **Source:** [`tools/base/devbox/`](https://github.com/hambn/tool-containers/tree/main/tools/base/devbox)
- **Docs:** [tool-containers.hgh.dev/docs/base/devbox/](https://tool-containers.hgh.dev/docs/base/devbox/)

## Contents

- [Images](#images)
- [Tiers](#tiers)
- [Included software](#included-software)
- [Running systemd](#running-systemd)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-lite`**: Ubuntu 24.04 with a Zsh shell, Git, editors, and search tools.
  - Base: [`core:ubuntu`](../core/)
  - Tags: `ubuntu-lite`
  - Included software: the [lite tier](#lite)
- **`alpine-lite`**: Alpine 3.24 with the same shell and tools.
  - Base: [`core:alpine`](../core/)
  - Tags: `alpine-lite`
  - Included software: the [lite tier](#lite)
- **`ubuntu-full`**: Ubuntu 24.04 with language toolchains, the Docker CLI, and Kubernetes and forge CLIs.
  - Base: [`core:ubuntu`](../core/)
  - Tags: `ubuntu-full`
  - Included software: the [full tier](#full)
- **`alpine-full`**: Alpine 3.24 with the same toolchains and OpenRC in place of systemd.
  - Base: [`core:alpine`](../core/)
  - Tags: `alpine-full`
  - Included software: the [full tier](#full)
- **`ubuntu-browser`**: `ubuntu-full` plus [chromedp headless-shell](https://github.com/chromedp/docker-headless-shell).
  - Base: [`core:ubuntu`](../core/)
  - Tags: `ubuntu-browser`, `latest`
  - Included software: the [browser tier](#browser)
- **`alpine-browser`**: `alpine-full` plus Chromium.
  - Base: [`core:alpine`](../core/)
  - Tags: `alpine-browser`
  - Included software: the [browser tier](#browser)

Pull `ghcr.io/hambn/devbox:<tag>` or `docker.io/hambn/devbox:<tag>`. Every tag moves
when the image is rebuilt; pin a digest to keep one build. Tool versions are pinned as
`ARG` defaults in the [`Dockerfile`](./Dockerfile).

## Tiers

| Tier | Use it for |
|------|------------|
| lite | Quick interactive work, or a small CI base when you install your own tools. |
| full | Development and CI with Python, Node.js, Go, and the Docker, Kubernetes, and forge CLIs. |
| browser | Agents and tests that drive a headless browser, found at `$BROWSER_BIN`. Run it with `--shm-size=1g`. |

Every tier starts in `/home/sysadmin` with `/bin/zsh -l`. `/home/sysadmin` also holds
the Zsh configuration. A bind mount or Kubernetes volume over the whole directory hides
it, so mount subdirectories such as `~/.cache` instead. A new Docker named volume is
safe, because Docker copies the image's files into it on first use.

`npm install -g` installs into `/home/sysadmin/.local`, which comes first on `PATH`. An
agent can therefore update itself without `sudo`, and its newer version takes
precedence over the pinned one in `/usr/local/bin`. The update lives in the
container's home directory, so a new container starts with the pinned version again.

## Included software

Each tier contains everything in the tier before it.

### lite

- Shell
  - Zsh with the Oh My Zsh libraries and its `git` and `kubectl` plugins
  - zsh-autosuggestions and zsh-syntax-highlighting
- Version control: Git and Git LFS
- Editors and terminal: Neovim (`$EDITOR`), tmux, and Ghostty terminfo
- Search and text: fzf, ripgrep, fd, jq, and less
- Network: the OpenSSH client and `ping` with `cap_net_raw`

### full

- Languages
  - Python 3 with pip, pipx, and uv
  - Node.js with npm, pnpm, and Yarn
  - Go
- Build toolchain: build-essential on Ubuntu or alpine-sdk on Alpine, CMake, Ninja, and
  Autotools
- Containers
  - Docker CLI with Buildx and Compose; `sysadmin` is in the `docker` group
  - Ubuntu also installs the Docker Engine and containerd, disabled by default
- Kubernetes: kubectl with Zsh completion, Helm, Kustomize, and yq
- Forges and networking: GitHub CLI, GitLab CLI, and Tailscale
- Linters: ShellCheck, shfmt, and yamllint
- Network tools: HTTPie, mitmproxy, nginx, nmap, tcpdump, mtr, and iperf3
- Other: archive, media, and process tools, and a `/workspace` directory owned by
  `sysadmin`

### browser

- Ubuntu: `chromedp/headless-shell` at `/headless-shell/headless-shell`
- Alpine: the `chromium` package at `/usr/bin/chromium-browser`

`$BROWSER_BIN` points to the browser on both.

## Running systemd

No daemon starts with the default command. For container builds, mount the host's
Docker socket or set `DOCKER_HOST`.

On `ubuntu-full` and `ubuntu-browser`, a privileged container started as root with
`/sbin/init` boots systemd with a container profile:

- `multi-user.target` as the default target
- Logs on the console and a volatile journal
- `/tmp` kept across the boot, with 30-day cleanup
- Lingering enabled for `sysadmin`
- Hardware, getty, and apt update units masked
- Docker, containerd, nginx, and SSH installed but disabled; enable the ones you need

The Alpine images use OpenRC and install no Docker daemon.

## Use cases

- **Interactive development shell on a checkout** with [Docker](docs/docker/),
  optionally using the host Docker daemon.
- **Reusable shell with a persistent home** with [Docker compose](docs/docker-compose/).
- **Rootless development shell or Quadlet service** with [Podman](docs/podman/).
- **Disposable cluster development pod** with [Kubernetes](docs/kubernetes/).
- **Long-running cluster pod with a persistent workspace** with [Helm](docs/helm/).
- **Editor-attached development container** with [Dev Container](docs/devcontainer/).
- **CI job with the full toolchain** with [GitHub Actions](docs/github-actions/) or
  [GitLab CI](docs/gitlab-ci/).

## Sources

- [Ubuntu container image](https://hub.docker.com/_/ubuntu) and [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [chromedp/headless-shell](https://github.com/chromedp/docker-headless-shell)
- [Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh), [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions), [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [Go downloads](https://go.dev/dl/), [Node.js downloads](https://nodejs.org/en/download/), [Node.js unofficial musl builds](https://unofficial-builds.nodejs.org/), [uv](https://github.com/astral-sh/uv)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/), [Helm](https://helm.sh/), [Kustomize](https://github.com/kubernetes-sigs/kustomize), [yq](https://github.com/mikefarah/yq)
- [GitHub CLI](https://github.com/cli/cli), [GitLab CLI](https://gitlab.com/gitlab-org/cli), [Tailscale static binaries](https://pkgs.tailscale.com/stable/#static)
