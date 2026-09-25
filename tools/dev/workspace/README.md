# workspace

Interactive Alpine and Ubuntu environments. Core profiles carry Git, Bash, Python, Node.js, Go, and `uv`. Full profiles add the broad developer toolset and styled Zsh. Agent images inherit core, so Zsh presentation changes stay in full workspaces.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Tag | Contents | Base |
|---|---|---|
| `alpine-3.21-core` | Common development tools | `runtime:alpine-3.21-minimal` |
| `alpine-3.21-full` | Broad tools and styled Zsh | `workspace:alpine-3.21-core` |
| `ubuntu-24.04-core` | Common development tools | `runtime:ubuntu-24.04-minimal` |
| `ubuntu-24.04-full` | Broad tools, systemd support, styled Zsh | `workspace:ubuntu-24.04-core` |

Pull `ghcr.io/hambn/workspace:<tag>` or `docker.io/hambn/workspace:<tag>`. Moving tags receive tested updates. Each build also has an immutable `<tag>-b<run-id>-<attempt>` tag. Pin a digest to keep an exact build. All profiles default to UID/GID 1000 and `/workspace`. The full profiles are interactive images; the [minimal runtime images](../../base/runtime/) suit smaller application bases.

## Use cases

- Start an interactive workspace with [Docker](examples/docker/) or [Podman](examples/podman/).
- Keep a reusable local definition with [Docker Compose](examples/docker-compose/).
- Run a development pod with [Kubernetes](examples/kubernetes/) or [Helm](examples/helm/).
- Deploy a shared environment with [Docker Swarm](examples/docker-swarm/).

## File map

- [`examples/`](examples/)
  - [`docker/`](examples/docker/)
    - [`README.md`](examples/docker/README.md)
    - [`airgapped.run.sh`](examples/docker/airgapped.run.sh)
    - [`run.sh`](examples/docker/run.sh)
  - [`docker-compose/`](examples/docker-compose/)
    - [`README.md`](examples/docker-compose/README.md)
    - [`airgapped.docker-compose.yml`](examples/docker-compose/airgapped.docker-compose.yml)
    - [`compose.sh`](examples/docker-compose/compose.sh)
    - [`docker-compose.yml`](examples/docker-compose/docker-compose.yml)
  - [`docker-swarm/`](examples/docker-swarm/)
    - [`README.md`](examples/docker-swarm/README.md)
    - [`stack.yml`](examples/docker-swarm/stack.yml)
  - [`helm/`](examples/helm/)
    - [`chart/`](examples/helm/chart/)
      - [`templates/`](examples/helm/chart/templates/)
        - [`deployment.yaml`](examples/helm/chart/templates/deployment.yaml)
      - [`Chart.yaml`](examples/helm/chart/Chart.yaml)
      - [`values.yaml`](examples/helm/chart/values.yaml)
    - [`README.md`](examples/helm/README.md)
  - [`kubernetes/`](examples/kubernetes/)
    - [`README.md`](examples/kubernetes/README.md)
    - [`deployment.yaml`](examples/kubernetes/deployment.yaml)
  - [`podman/`](examples/podman/)
    - [`README.md`](examples/podman/README.md)
    - [`run.sh`](examples/podman/run.sh)
- [`images/`](images/)
  - [`alpine/`](images/alpine/)
    - [`scripts/`](images/alpine/scripts/)
      - [`configure-zsh.sh`](images/alpine/scripts/configure-zsh.sh)
      - [`configure.sh`](images/alpine/scripts/configure.sh)
      - [`core-packages.sh`](images/alpine/scripts/core-packages.sh)
      - [`install-cli-tools.sh`](images/alpine/scripts/install-cli-tools.sh)
      - [`languages.sh`](images/alpine/scripts/languages.sh)
      - [`packages.sh`](images/alpine/scripts/packages.sh)
  - [`alpine-core/`](images/alpine-core/)
    - [`Dockerfile`](images/alpine-core/Dockerfile)
  - [`alpine-full/`](images/alpine-full/)
    - [`Dockerfile`](images/alpine-full/Dockerfile)
  - [`common/`](images/common/)
    - [`zsh/`](images/common/zsh/)
      - [`conf.d/`](images/common/zsh/conf.d/)
        - [`zz-workspace-aliases.zsh`](images/common/zsh/conf.d/zz-workspace-aliases.zsh)
        - [`zz-workspace-options.zsh`](images/common/zsh/conf.d/zz-workspace-options.zsh)
        - [`zz-workspace-prompt.zsh`](images/common/zsh/conf.d/zz-workspace-prompt.zsh)
    - [`zprofile`](images/common/zprofile)
    - [`zshenv`](images/common/zshenv)
    - [`zshrc`](images/common/zshrc)
  - [`ubuntu/`](images/ubuntu/)
    - [`scripts/`](images/ubuntu/scripts/)
      - [`configure-systemd.sh`](images/ubuntu/scripts/configure-systemd.sh)
      - [`configure-zsh.sh`](images/ubuntu/scripts/configure-zsh.sh)
      - [`configure.sh`](images/ubuntu/scripts/configure.sh)
      - [`core-packages.sh`](images/ubuntu/scripts/core-packages.sh)
      - [`install-cli-tools.sh`](images/ubuntu/scripts/install-cli-tools.sh)
      - [`install-tailscale.sh`](images/ubuntu/scripts/install-tailscale.sh)
      - [`languages.sh`](images/ubuntu/scripts/languages.sh)
      - [`packages.sh`](images/ubuntu/scripts/packages.sh)
    - [`journald-container.conf`](images/ubuntu/journald-container.conf)
    - [`systemd-container.conf`](images/ubuntu/systemd-container.conf)
    - [`tmpfiles-tmp.conf`](images/ubuntu/tmpfiles-tmp.conf)
  - [`ubuntu-core/`](images/ubuntu-core/)
    - [`Dockerfile`](images/ubuntu-core/Dockerfile)
  - [`ubuntu-full/`](images/ubuntu-full/)
    - [`Dockerfile`](images/ubuntu-full/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [Alpine Linux image](https://hub.docker.com/_/alpine)
- [Ubuntu image](https://hub.docker.com/_/ubuntu)
- [Node.js downloads](https://nodejs.org/en/download/)
- [Go downloads](https://go.dev/dl/)
- [uv](https://docs.astral.sh/uv/)
