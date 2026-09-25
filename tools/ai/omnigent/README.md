# omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent) is an open-source AI agent
meta-harness packaged on the reusable [`agentbloat`](../agentbloat/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/omnigent:<tag>` or `docker.io/hambn/omnigent:<tag>`.
Moving tags name the tested operating-system profile. Each successful build also has an immutable `<profile>-b<run-id>-<attempt>` tag. Pin a digest for deployments.

| Tag | Contents | Base |
|---|---|---|
| `ubuntu-24.04` | omnigent on Ubuntu 24.04 | `workspace:ubuntu-24.04-core` plus the agent bundle |

## Use cases

- **Interactive local orchestration** — [`examples/docker/`](./examples/docker/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless development** — [`examples/podman/`](./examples/podman/).

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
  - [`podman/`](examples/podman/)
    - [`README.md`](examples/podman/README.md)
    - [`run.sh`](examples/podman/run.sh)
- [`images/`](images/)
  - [`ubuntu-24.04/`](images/ubuntu-24.04/)
    - [`Dockerfile`](images/ubuntu-24.04/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [Omnigent source repository](https://github.com/omnigent-ai/omnigent)
- [Omnigent documentation](https://omnigent.ai/quickstart/install)
- [Omnigent package on PyPI](https://pypi.org/project/omnigent/)
- [agentbloat foundation](../agentbloat/)
