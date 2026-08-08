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
| `ubuntu-browser` | full toolset, optional systemd, headless Chromium | Ubuntu 24.04 | `latest`, `ubuntu-browser`, and `ubuntu-browser-<12-char-commit-sha>` on source changes |
| `ubuntu` | full toolset and optional systemd, no browser | Ubuntu 24.04 | `ubuntu` and `ubuntu-<12-char-commit-sha>` on source changes |
| `alpine-browser` | Alpine-equivalent toolset, OpenRC, Chromium | Alpine 3.21 | `alpine-browser` and `alpine-browser-<12-char-commit-sha>` on source changes |
| `alpine` | Alpine-equivalent toolset and OpenRC, no browser | Alpine 3.21 | `alpine` and `alpine-<12-char-commit-sha>` on source changes |

Pull from `ghcr.io/hambn/agentimg:<tag>` or `docker.io/hambn/agentimg:<tag>`.
Only a Git push that changes a variant creates its commit tag. Scheduled base-image
refreshes replace `latest` and the affected stable variant tag without creating another
tag. See the repository [registry and tag guidance](../../.agents/references/repo/registries-and-tags.md).

## Included software

All variants provide a broad command-line development environment: Bash, Git, GitHub
and GitLab CLIs, Go, Python, pip/pipx, uv, compilers, editors, man pages, SSH,
Docker/Buildx/Compose, Tailscale, Bubblewrap, mitmproxy, database/network/process
diagnostics, and image/video tools. Ubuntu includes systemd; Alpine maps the service
capability to OpenRC.

The browser variants add headless Chromium. The Ubuntu variant uses the self-contained
`chromedp/headless-shell` bundle; Alpine uses its native Chromium package.

Deliberately excluded from all variants:

- Claude Code, Codex, Pi, and all other AI agents or agent configuration
- the Exeuntu CLI, Shelley, Exe setup services, branding, labels, and init wrapper
- nginx, site content, Ghostty terminfo, and other web-server components

Docker, SSH, and Tailscale are installed but not enabled automatically. Derived images
or privileged runtimes can opt into those daemons. The Ubuntu foundation defaults to
root because systemd runs as PID 1; it also provides the unprivileged UID/GID-1000
`agent` user. Alpine defaults to its root shell and likewise provides `agent`. Derived
AI images install packages as root and switch to `agent` for their runtime contract.

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
│   │   └── Dockerfile
│   ├── alpine-browser/
│   │   └── Dockerfile
│   ├── ubuntu/
│   │   └── Dockerfile
│   └── ubuntu-browser/
│       └── Dockerfile
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
