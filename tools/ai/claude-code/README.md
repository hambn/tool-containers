# claude-code

[Claude Code](https://github.com/anthropics/claude-code) packaged on the reusable
[`workspace`](../../dev/workspace/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/claude-code:<tag>` or `docker.io/hambn/claude-code:<tag>`.
Moving tags name the tested operating-system profile. Each successful build also has an immutable `<profile>-b<run-id>-<attempt>` tag. Pin a digest for deployments.

| Tag | Contents | Base |
|---|---|---|
| `ubuntu-24.04` | claude-code on Ubuntu 24.04 | `workspace:ubuntu-24.04-core` |

## Use cases

- **Interactive local coding** — [`examples/docker/`](./examples/docker/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless development** — [`examples/podman/`](./examples/podman/).
- **Cluster batch jobs** — [`examples/kubernetes/`](./examples/kubernetes/) or
  [`examples/helm/`](./examples/helm/).
- **Shared Swarm jobs** — [`examples/docker-swarm/`](./examples/docker-swarm/).

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
        - [`job.yaml`](examples/helm/chart/templates/job.yaml)
      - [`Chart.yaml`](examples/helm/chart/Chart.yaml)
      - [`values.yaml`](examples/helm/chart/values.yaml)
    - [`README.md`](examples/helm/README.md)
  - [`kubernetes/`](examples/kubernetes/)
    - [`README.md`](examples/kubernetes/README.md)
    - [`job.yaml`](examples/kubernetes/job.yaml)
  - [`podman/`](examples/podman/)
    - [`README.md`](examples/podman/README.md)
    - [`run.sh`](examples/podman/run.sh)
- [`images/`](images/)
  - [`ubuntu-24.04/`](images/ubuntu-24.04/)
    - [`Dockerfile`](images/ubuntu-24.04/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [Claude Code source repository](https://github.com/anthropics/claude-code)
- [Claude Code npm package](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
- [workspace foundation](../../dev/workspace/)
