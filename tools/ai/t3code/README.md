# t3code

[T3 Code](https://github.com/pingdotgg/t3code) — a minimal web GUI for coding agents (Codex, Claude, Cursor, OpenCode) — in a container. It's a GUI *over* agents, not an agent itself.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/t3code:<tag>` or `docker.io/hambn/t3code:<tag>`.
Moving tags name the tested operating-system profile. Each successful build also has an immutable `<profile>-b<run-id>-<attempt>` tag. Pin a digest for deployments.

| Tag | Contents | Base |
|---|---|---|
| `ubuntu-24.04-browser` | T3 Code, agent bundle, and headless Chromium | `t3code:ubuntu-24.04` |
| `ubuntu-24.04` | T3 Code and agent bundle, without browser | `workspace:ubuntu-24.04-core` |

## Use cases

- **Local GUI over your repo** — [`examples/docker/run.sh`](./examples/docker/run.sh), then open `http://localhost:3773`.
- **Compose service** — [`examples/docker-compose/docker-compose.yml`](./examples/docker-compose/docker-compose.yml) for a persistent local instance.
- **Airgapped host** — [`examples/docker/airgapped.run.sh`](./examples/docker/airgapped.run.sh) loads a saved tar, no registry.
- **Shared cluster instance** — [`examples/kubernetes/deployment.yaml`](./examples/kubernetes/deployment.yaml) Deployment + Service, port-forward to reach it.

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
  - [`ubuntu-24.04/`](images/ubuntu-24.04/)
    - [`Dockerfile`](images/ubuntu-24.04/Dockerfile)
  - [`ubuntu-24.04-browser/`](images/ubuntu-24.04-browser/)
    - [`Dockerfile`](images/ubuntu-24.04-browser/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- T3 Code: https://github.com/pingdotgg/t3code
- npm package: https://www.npmjs.com/package/t3
