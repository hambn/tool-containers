# omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent), an open-source AI agent meta-harness, on the [`agentbloat`](../agentbloat/) image so every bundled agent CLI is available to it. The entrypoint is `omnigent`.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`agentbloat:ubuntu-browser`](../agentbloat/) | Omnigent plus every agentbloat CLI; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>` |
| `ubuntu` | [`agentbloat:ubuntu`](../agentbloat/) | Omnigent plus every agentbloat CLI; Ubuntu, no browser | `ubuntu`, `<version>-ubuntu` |
| `alpine-browser` | [`agentbloat:alpine-browser`](../agentbloat/) | Omnigent plus every agentbloat CLI; Alpine, Chromium | `alpine-browser`, `<version>-alpine-browser` |
| `alpine` | [`agentbloat:alpine`](../agentbloat/) | Omnigent plus every agentbloat CLI; Alpine, no browser | `alpine`, `<version>-alpine` |

Pull from `ghcr.io/hambn/omnigent:<tag>` or `docker.io/hambn/omnigent:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Omnigent PyPI release; version tags are created once and never repointed. The old `omnigent-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in. Omnigent lives in a uv tool environment under `/opt/uv-tools/omnigent` with `omni` and `omnigent` launchers in `/usr/local/bin`, usable by any UID. On Alpine its `google-re2` dependency is compiled in a separate build stage, so only the `re2` runtime library ships in the image.

## Use cases

- **Orchestrate agents over a local checkout** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## File map

- [`Dockerfile`](./Dockerfile)
- [`README.md`](./README.md)
- [`examples/`](./examples/)
  - [`docker-compose/`](./examples/docker-compose/)
    - [`README.md`](./examples/docker-compose/README.md)
    - [`airgapped.docker-compose.yml`](./examples/docker-compose/airgapped.docker-compose.yml)
    - [`compose.sh`](./examples/docker-compose/compose.sh)
    - [`docker-compose.yml`](./examples/docker-compose/docker-compose.yml)
  - [`docker/`](./examples/docker/)
    - [`README.md`](./examples/docker/README.md)
    - [`airgapped.run.sh`](./examples/docker/airgapped.run.sh)
    - [`run.sh`](./examples/docker/run.sh)
  - [`podman/`](./examples/podman/)
    - [`README.md`](./examples/podman/README.md)
    - [`run.sh`](./examples/podman/run.sh)
- [`tests/`](./tests/)
  - [`structure-alpine.yaml`](./tests/structure-alpine.yaml)
  - [`structure.yaml`](./tests/structure.yaml)
- [`.github/workflows/images.yml`](../../../../.github/workflows/images.yml) — builds, tests, and publishes every variant

## Sources

- [Omnigent repository](https://github.com/omnigent-ai/omnigent)
- [PyPI package `omnigent`](https://pypi.org/project/omnigent/)
- [Omnigent documentation](https://omnigent.ai/quickstart/install)
