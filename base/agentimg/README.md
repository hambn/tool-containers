# agentimg

General-purpose developer and agent foundation images inspired by
[boldsoftware/exeuntu](https://github.com/boldsoftware/exeuntu), without bundled AI
agents, Exe-specific components, or web servers.

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
tag. See the repository [registry and tag guidance](../../.agents/references/repo/registries-and-tags.md).

## Included software

All variants provide a broad command-line development environment: styled Zsh and Bash,
Git, GitHub and GitLab CLIs, Go, Python, pip/pipx, uv, kubectl, compilers, editors, man
pages, SSH, Docker/Buildx/Compose, Tailscale, Bubblewrap, mitmproxy,
database/network/process diagnostics, and image/video tools. Ubuntu includes systemd;
Alpine maps the service capability to OpenRC. The terminal profile also includes fzf,
tmux, autosuggestions, syntax highlighting, Git-aware prompts, persistent history, and
case-insensitive completion.

The browser variants add headless Chromium. The Ubuntu variant uses the self-contained
`chromedp/headless-shell` bundle; Alpine uses its native Chromium package.

Deliberately excluded from all variants:

- Claude Code, Codex, Pi, and all other AI agents or agent configuration
- the Exeuntu CLI, Shelley, Exe setup services, branding, labels, and init wrapper
- nginx, site content, Ghostty terminfo, and other web-server components

Docker, SSH, and Tailscale are installed but not enabled automatically. Derived images
or privileged runtimes can opt into those daemons. Every variant defaults to the
unprivileged UID/GID-1000 `agent` user, `/home/agent`, and a login Zsh in `/workspace`.
Ubuntu systemd remains available when a privileged runtime explicitly selects root and
`/sbin/init`.

kubectl is checksum-verified from the official Kubernetes release service. Its Zsh
completion is initialized, `~/.kube` is ready for a mounted configuration, and the shell
provides `k`, `kc`, and `kn` aliases for kubectl, current-context, and namespace changes.
GitHub Actions resolves current `gh`, `glab`, and stable kubectl releases every day,
passes their exact versions into the build, and rebuilds all variants when one changes.
All three downloads are checksum-verified, and each built digest must pass command,
version, sudo, shell, workspace, Docker CLI/Buildx/Compose, and browser-presence smoke
checks before any moving tag is published.

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
│   │   └── zshrc
│   ├── alpine-browser/
│   │   ├── Dockerfile
│   │   └── zshrc
│   ├── ubuntu/
│   │   ├── Dockerfile
│   │   └── zshrc
│   └── ubuntu-browser/
│       ├── Dockerfile
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

CI is defined in [`.github/workflows/base-agentimg.yml`](../../.github/workflows/base-agentimg.yml).

## Sources

- [boldsoftware/exeuntu](https://github.com/boldsoftware/exeuntu)
- [Ubuntu container image](https://hub.docker.com/_/ubuntu)
- [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [chromedp/headless-shell](https://github.com/chromedp/docker-headless-shell)
- [GitLab CLI](https://gitlab.com/gitlab-org/cli)
- [Kubernetes kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
- [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)
- [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)
