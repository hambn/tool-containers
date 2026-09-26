# devbox

Interactive Ubuntu and Alpine development and CI images in three tiers, built on
[core](../core/README.md). Every [agent image](../../../README.md) in this repository
builds `FROM` a published devbox image.

- **Source:** [`tools/base/devbox/`](https://github.com/hambn/tool-containers/tree/main/tools/base/devbox)
- **Docs:** [tool-containers.hgh.dev/docs/base/devbox/](https://tool-containers.hgh.dev/docs/base/devbox/)

## Contents

- [Images](#images)
- [Tiers](#tiers)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-lite`** — Zsh shell, Git, editors, search tools, `sysadmin` with sudo
  - Base: `core:ubuntu` (Ubuntu 24.04)
  - Tags: `ubuntu-lite`
  - Included software: [lite tier](#lite)
- **`alpine-lite`** — Same as `ubuntu-lite` on musl
  - Base: `core:alpine`
  - Tags: `alpine-lite`
  - Included software: [lite tier](#lite)
- **`ubuntu-full`** — lite + languages, build toolchain, Docker CLI, Kubernetes and cloud CLIs, network tools, systemd
  - Base: `core:ubuntu` (Ubuntu 24.04)
  - Tags: `ubuntu-full`
  - Included software: [full tier](#full)
- **`alpine-full`** — lite + the same toolset; OpenRC instead of systemd
  - Base: `core:alpine`
  - Tags: `alpine-full`
  - Included software: [full tier](#full)
- **`ubuntu-browser`** — full + [chromedp headless-shell](https://github.com/chromedp/docker-headless-shell)
  - Base: `core:ubuntu` (Ubuntu 24.04)
  - Tags: `ubuntu-browser`, `latest`
  - Included software: [browser tier](#browser)
- **`alpine-browser`** — full + Chromium
  - Base: `core:alpine`
  - Tags: `alpine-browser`
  - Included software: [browser tier](#browser)

Pull from `ghcr.io/hambn/devbox:<tag>` or `docker.io/hambn/devbox:<tag>`. Tags are the variant names plus `latest` (`ubuntu-browser`, the largest variant); every tag follows `main` and moves on each rebuild. Pin a digest for reproducibility. Earlier dated `<variant>-<YYYYMMDD>-<sha7>` tags are no longer published. Every tool version is pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults and recorded on full and browser images as `io.github.hambn.containers.tool.<name>.version` labels.

## Tiers

- **lite** — a comfortable shell and nothing else: for quick interactive work and as a
  small CI base.
- **full** — the complete development toolset; the default (`latest`).
- **browser** — full plus a headless browser at `$BROWSER_BIN` for agents and tests that
  drive a browser. Give it `--shm-size=1g`.

All tiers run as `sysadmin` (UID/GID 1000, passwordless `sudo`) in `/home/sysadmin` with
a Zsh login shell (`/bin/zsh -l`).

## Included software

Each tier contains everything in the tier before it.

### lite

- **Shell:** Zsh with Oh My Zsh libraries, the `git` and `kubectl` plugins,
  autosuggestions, and syntax highlighting
- **Version control:** Git, Git LFS
- **Editors and terminal:** Neovim, tmux, Ghostty terminfo
- **Search and text:** fzf, ripgrep, fd, jq, less
- **Network:** OpenSSH client, `ping` with `cap_net_raw`

### full

- **Languages:** Python 3 with pip, pipx, and uv; Node.js with npm, pnpm, and Yarn; Go
- **Build toolchain:** build-essential (Ubuntu) or alpine-sdk (Alpine), CMake, Ninja,
  Autotools
- **Containers:** Docker CLI with Buildx and Compose
- **Kubernetes:** kubectl (with Zsh completion and `k` aliases), Helm, Kustomize, yq
- **Cloud and forges:** GitHub CLI, GitLab CLI, Tailscale
- **Linters:** ShellCheck, shfmt, yamllint
- **Network:** HTTPie, mitmproxy, nginx, nmap, tcpdump, mtr, iperf3
- **Other:** archive, media, and process tools; `/workspace` owned by `sysadmin`

### browser

- **Headless browser** at `$BROWSER_BIN`: `chromedp/headless-shell` on Ubuntu, the
  `chromium` package on Alpine

Docker, nginx, SSH, and Tailscale daemons are installed but never started. Use a mounted
Docker socket or `DOCKER_HOST` for container builds. On Ubuntu full and browser, a
privileged container started as root with `/sbin/init` boots systemd with a container
profile: `multi-user.target`, console logging, a volatile journal, preserved `/tmp`,
lingering for `sysadmin`, and hardware, getty, and update units masked.

## Use cases

- Open an interactive shell on a project, optionally with the host Docker daemon, with
  [Docker](examples/docker/).
- Keep a persistent home directory across sessions with
  [Docker Compose](examples/docker-compose/).
- Work rootless with your UID mapped to `sysadmin` with [Podman](examples/podman/).
- Exec into a disposable development pod with [Kubernetes](examples/kubernetes/), or a
  long-running one with a persistent workspace with [Helm](examples/helm/).

## Sources

- [Ubuntu container image](https://hub.docker.com/_/ubuntu) and [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [chromedp/headless-shell](https://github.com/chromedp/docker-headless-shell)
- [Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh), [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions), [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [Go downloads](https://go.dev/dl/), [Node.js downloads](https://nodejs.org/en/download/), [Node.js unofficial musl builds](https://unofficial-builds.nodejs.org/), [uv](https://github.com/astral-sh/uv)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/), [Helm](https://helm.sh/), [Kustomize](https://github.com/kubernetes-sigs/kustomize), [yq](https://github.com/mikefarah/yq)
- [GitHub CLI](https://github.com/cli/cli), [GitLab CLI](https://gitlab.com/gitlab-org/cli), [Tailscale static binaries](https://pkgs.tailscale.com/stable/#static)
