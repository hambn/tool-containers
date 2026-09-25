# devbox

Interactive Ubuntu and Alpine development and CI images in three tiers, built on
[core](../core/README.md). Every [agent image](../../../README.md) in this repository
builds `FROM` a published devbox image.

## Contents

- [Images](#images)
- [Tiers](#tiers)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-lite` | `core:ubuntu` (Ubuntu 24.04) | Zsh shell, Git, editors, search tools, `sysadmin` with sudo | `ubuntu-lite`, `ubuntu-lite-<YYYYMMDD>-<sha7>` |
| `alpine-lite` | `core:alpine` | Same as `ubuntu-lite` on musl | `alpine-lite`, `alpine-lite-<YYYYMMDD>-<sha7>` |
| `ubuntu-full` | `core:ubuntu` (Ubuntu 24.04) | lite + languages, build toolchain, Docker CLI, Kubernetes and cloud CLIs, network tools, systemd | `ubuntu-full`, `latest`, `ubuntu-full-<YYYYMMDD>-<sha7>` |
| `alpine-full` | `core:alpine` | lite + the same toolset; OpenRC instead of systemd | `alpine-full`, `alpine-full-<YYYYMMDD>-<sha7>` |
| `ubuntu-browser` | `core:ubuntu` (Ubuntu 24.04) | full + [chromedp headless-shell](https://github.com/chromedp/docker-headless-shell) | `ubuntu-browser`, `ubuntu-browser-<YYYYMMDD>-<sha7>` |
| `alpine-browser` | `core:alpine` | full + Chromium | `alpine-browser`, `alpine-browser-<YYYYMMDD>-<sha7>` |

Pull from `ghcr.io/hambn/devbox:<tag>` or `docker.io/hambn/devbox:<tag>`. Moving tags
follow `main`; dated `<variant>-<YYYYMMDD>-<sha7>` tags are immutable. Every tool version
is pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults and recorded on full and browser
images as `io.github.hambn.containers.tool.<name>.version` labels.

## Tiers

- **lite** — a comfortable shell and nothing else: for quick interactive work and as a
  small CI base.
- **full** — the complete development toolset; the default (`latest`).
- **browser** — full plus a headless browser at `$BROWSER_BIN` for agents and tests that
  drive a browser. Give it `--shm-size=1g`.

All tiers run as `sysadmin` (UID/GID 1000, passwordless `sudo`) in `/home/sysadmin` with
a Zsh login shell (`/bin/zsh -l`).

## Included software

- **lite:** Zsh with Oh My Zsh libraries and the `git`/`kubectl` plugins, autosuggestions,
  and syntax highlighting; Git and Git LFS; Neovim, tmux, fzf, ripgrep, fd, jq, less;
  OpenSSH client; `ping` with `cap_net_raw`; Ghostty terminfo.
- **full:** Python 3 with pip, pipx, and uv; Node.js with npm, pnpm, and Yarn; Go;
  build-essential/alpine-sdk, CMake, Ninja, Autotools; Docker CLI with Buildx and Compose;
  kubectl (with Zsh completion and `k` aliases), Helm, Kustomize, yq; GitHub and GitLab
  CLIs; Tailscale; ShellCheck, shfmt, yamllint; HTTPie, mitmproxy, nginx, nmap, tcpdump,
  mtr, iperf3 and other network, archive, media, and process tools. `/workspace` is
  owned by `sysadmin`.
- **browser:** headless Chromium (`chromedp/headless-shell` on Ubuntu, the Alpine
  `chromium` package on Alpine).

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

## File map

- [`README.md`](README.md)
- [`Dockerfile`](Dockerfile)
- [`docker-bake.hcl`](docker-bake.hcl)
- `packages/`
  - [`lite-ubuntu.txt`](packages/lite-ubuntu.txt), [`lite-alpine.txt`](packages/lite-alpine.txt)
  - [`full-ubuntu.txt`](packages/full-ubuntu.txt), [`full-alpine.txt`](packages/full-alpine.txt)
  - [`browser-ubuntu.txt`](packages/browser-ubuntu.txt), [`browser-alpine.txt`](packages/browser-alpine.txt)
- `scripts/`
  - [`install-packages.sh`](scripts/install-packages.sh)
  - [`configure-systemd.sh`](scripts/configure-systemd.sh)
- `rootfs/`
  - `etc/`
    - [`gitconfig`](rootfs/etc/gitconfig)
    - [`sudoers.d/sysadmin`](rootfs/etc/sudoers.d/sysadmin)
    - [`systemd/system.conf.d/devbox-container.conf`](rootfs/etc/systemd/system.conf.d/devbox-container.conf)
    - [`systemd/journald.conf.d/devbox-container.conf`](rootfs/etc/systemd/journald.conf.d/devbox-container.conf)
    - [`tmpfiles.d/tmp.conf`](rootfs/etc/tmpfiles.d/tmp.conf)
  - `home/sysadmin/`
    - [`.zshenv`](rootfs/home/sysadmin/.zshenv)
    - [`.zprofile`](rootfs/home/sysadmin/.zprofile)
    - [`.zshrc`](rootfs/home/sysadmin/.zshrc)
    - `.config/zsh/conf.d/`
      - [`zz-devbox-aliases.zsh`](rootfs/home/sysadmin/.config/zsh/conf.d/zz-devbox-aliases.zsh)
      - [`zz-devbox-options.zsh`](rootfs/home/sysadmin/.config/zsh/conf.d/zz-devbox-options.zsh)
      - [`zz-devbox-prompt.zsh`](rootfs/home/sysadmin/.config/zsh/conf.d/zz-devbox-prompt.zsh)
- `tests/`
  - [`structure.yaml`](tests/structure.yaml)
  - [`structure-full.yaml`](tests/structure-full.yaml)
  - [`structure-browser.yaml`](tests/structure-browser.yaml) (symlink to `structure-full.yaml`)
  - [`structure-ubuntu.yaml`](tests/structure-ubuntu.yaml)
  - [`structure-ubuntu-browser.yaml`](tests/structure-ubuntu-browser.yaml)
  - [`structure-alpine-browser.yaml`](tests/structure-alpine-browser.yaml)
  - [`smoke.sh`](tests/smoke.sh)
- `examples/`
  - `docker/` — [`README.md`](examples/docker/README.md), [`run.sh`](examples/docker/run.sh)
  - `docker-compose/` — [`README.md`](examples/docker-compose/README.md), [`docker-compose.yml`](examples/docker-compose/docker-compose.yml)
  - `podman/` — [`README.md`](examples/podman/README.md), [`run.sh`](examples/podman/run.sh), [`devbox.container`](examples/podman/devbox.container)
  - `kubernetes/` — [`README.md`](examples/kubernetes/README.md), [`pod.yaml`](examples/kubernetes/pod.yaml)
  - `helm/` — [`README.md`](examples/helm/README.md)
    - `chart/` — [`Chart.yaml`](examples/helm/chart/Chart.yaml), [`values.yaml`](examples/helm/chart/values.yaml), [`templates/statefulset.yaml`](examples/helm/chart/templates/statefulset.yaml)
- [`.github/workflows/base-devbox.yml`](../../../.github/workflows/base-devbox.yml)

## Sources

- [Ubuntu container image](https://hub.docker.com/_/ubuntu) and [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [chromedp/headless-shell](https://github.com/chromedp/docker-headless-shell)
- [Oh My Zsh](https://github.com/ohmyzsh/ohmyzsh), [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions), [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
- [Go downloads](https://go.dev/dl/), [Node.js downloads](https://nodejs.org/en/download/), [Node.js unofficial musl builds](https://unofficial-builds.nodejs.org/), [uv](https://github.com/astral-sh/uv)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/), [Helm](https://helm.sh/), [Kustomize](https://github.com/kubernetes-sigs/kustomize), [yq](https://github.com/mikefarah/yq)
- [GitHub CLI](https://github.com/cli/cli), [GitLab CLI](https://gitlab.com/gitlab-org/cli), [Tailscale static binaries](https://pkgs.tailscale.com/stable/#static)
