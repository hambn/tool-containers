# agentimg

General-purpose developer and agent foundation images inspired by
[boldsoftware/exeuntu](https://github.com/boldsoftware/exeuntu), without bundled AI
agents or Exe-specific components.

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Contents | Base | Tags |
|---------|----------|------|------|
| `ubuntu-browser` | full toolset, systemd, headless Chromium | Ubuntu 24.04 | `latest`, `ubuntu-browser`, and `ubuntu-browser-<commit-sha>` on source changes |
| `ubuntu` | full toolset and systemd, no browser | Ubuntu 24.04 | `ubuntu` and `ubuntu-<commit-sha>` on source changes |
| `alpine-browser` | Alpine-equivalent toolset, OpenRC, Chromium | Alpine 3.21 | `alpine-browser` and `alpine-browser-<commit-sha>` on source changes |
| `alpine` | Alpine-equivalent toolset and OpenRC, no browser | Alpine 3.21 | `alpine` and `alpine-<commit-sha>` on source changes |

Pull from `ghcr.io/hambn/agentimg:<tag>` or `docker.io/hambn/agentimg:<tag>`.
Only a Git push that changes a variant creates its commit tag. Scheduled base-image
refreshes replace `latest` and the affected stable variant tag without creating another
tag. See the repository [registry and tag guidance](../../../.agents/references/repo/registries-and-tags.md).

## Included software

All variants provide a broad command-line development environment: styled Zsh and Bash,
Git and Git LFS, GitHub and GitLab CLIs, the current stable Go toolchain, Python,
pip/pipx, uv, the current Node.js LTS with npm/npx/pnpm/Yarn, kubectl, Helm, Kustomize,
kind, yq, compilers, CMake/Ninja/Autotools, editors, man pages, SSH,
Docker/Buildx/Compose, Tailscale, Bubblewrap, mitmproxy, nginx, fd, HTTPie, ShellCheck,
shfmt, yamllint, archive/compression utilities, and database/network/process diagnostics.
Ubuntu includes systemd; Alpine maps the service capability to OpenRC. The terminal
profile also includes fzf, tmux, Ghostty-compatible terminfo, autosuggestions, syntax
highlighting, Git-aware prompts, persistent history, and case-insensitive completion.

The browser variants add headless Chromium. The Ubuntu variant uses the self-contained
`chromedp/headless-shell` bundle; Alpine uses its native Chromium package.

Deliberately excluded from all variants:

- Claude Code, Codex, Pi, and all other AI agents or agent configuration
- the Exeuntu CLI, Shelley, Exe setup services, branding, labels, and init wrapper
- Exe.dev nginx/site content, LLM gateway integration, and host-specific boot assumptions

Docker, nginx, SSH, and Tailscale are installed but not enabled automatically. Derived
images or privileged runtimes can opt into those daemons. Every variant defaults to the
unprivileged UID/GID-1000 `agent` user and `/home/agent`; the Ubuntu base shell starts
there, while derived images explicitly use the mounted `/workspace` directory.

Ubuntu systemd remains available when a privileged runtime explicitly selects root and
`/sbin/init`. Its container profile uses `multi-user.target`, console logging, a bounded
volatile journal, preserved `/tmp`, and lingering support for `agent`. Hardware, boot,
getty, unattended-update, and host-managed resolver/udev units that do not belong in an
OCI container are masked. This is systemd support, not an attempt to start systemd from
the default non-root shell.

kubectl is checksum-verified from the official Kubernetes release service. Its Zsh
completion is initialized, `~/.kube` is ready for a mounted configuration, and the shell
provides `k`, `kc`, and `kn` aliases for kubectl, current-context, and namespace changes.
Every build resolves the current `gh`, `glab`, stable Go, Node.js LTS, Helm, Kustomize,
kind, yq, zsh-autosuggestions, and stable kubectl releases directly from their upstream
release services; there are no tool-version build arguments or fallback version
literals. npm installs the current pnpm and Yarn releases. GitHub Actions rebuilds all
variants every day.
Scheduled and manual builds bypass layer caches and refresh base images so those release
lookups and distribution package installs actually run. The CLI downloads are
checksum-verified, and each built digest must pass command, passwordless-sudo, shell,
workspace, Docker CLI/Buildx/Compose, and browser-presence smoke checks before any
moving tag is published.

Docker CLI, Buildx, Compose, and the daemon binary are installed, but a daemon is not
started in the default non-root shell. Use an opt-in mounted socket or `DOCKER_HOST` for
an external daemon. A nested daemon requires runtime privileges; `systemctl` only works
when root systemd is actually PID 1, which ordinary Kubernetes development pods do not
provide.

## Use cases

- Start an interactive workspace with [Docker](deployment/docker/).
- Run through a reusable local definition with [Docker Compose](deployment/docker-compose/).
- Use a rootless container engine with [Podman](deployment/podman/).
- Run a long-lived development pod with [Kubernetes](deployment/kubernetes/) or
  [Helm](deployment/helm/).
- Deploy a shared long-lived environment with [Docker Swarm](deployment/docker-swarm/).

## File map

```text
agentimg/
├── README.md
├── images/
│   ├── alpine/
│   │   ├── Dockerfile
│   │   ├── zprofile
│   │   └── zshrc
│   ├── alpine-browser/
│   │   ├── Dockerfile
│   │   ├── zprofile
│   │   └── zshrc
│   ├── ubuntu/
│   │   ├── Dockerfile
│   │   ├── journald-container.conf
│   │   ├── systemd-container.conf
│   │   ├── tmpfiles-tmp.conf
│   │   ├── zprofile
│   │   └── zshrc
│   └── ubuntu-browser/
│       ├── Dockerfile
│       ├── journald-container.conf
│       ├── systemd-container.conf
│       ├── tmpfiles-tmp.conf
│       ├── zprofile
│       └── zshrc
└── deployment/
    ├── docker/
    │   ├── README.md
    │   ├── airgapped.run.sh
    │   └── run.sh
    ├── docker-compose/
    │   ├── README.md
    │   ├── airgapped.docker-compose.yml
    │   └── docker-compose.yml
    ├── docker-swarm/
    │   ├── README.md
    │   └── stack.yml
    ├── helm/
    │   ├── README.md
    │   └── chart/
    │       ├── Chart.yaml
    │       ├── templates/deployment.yaml
    │       └── values.yaml
    ├── kubernetes/
    │   ├── README.md
    │   └── deployment.yaml
    └── podman/
        ├── README.md
        └── run.sh
```

CI is defined in [`.github/workflows/base-agentimg.yml`](../../../.github/workflows/base-agentimg.yml).

## Sources

- [boldsoftware/exeuntu](https://github.com/boldsoftware/exeuntu)
- [Ubuntu container image](https://hub.docker.com/_/ubuntu)
- [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [chromedp/headless-shell](https://github.com/chromedp/docker-headless-shell)
- [GitHub CLI](https://github.com/cli/cli)
- [GitLab CLI](https://gitlab.com/gitlab-org/cli)
- [Go downloads](https://go.dev/dl/)
- [Node.js downloads](https://nodejs.org/en/download/)
- [Kubernetes kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
- [Helm](https://helm.sh/docs/intro/install/)
- [Kustomize](https://github.com/kubernetes-sigs/kustomize)
- [kind](https://kind.sigs.k8s.io/)
- [yq](https://github.com/mikefarah/yq)
- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
- [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
