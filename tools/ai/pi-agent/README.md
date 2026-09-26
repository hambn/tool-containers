# pi-agent

[Pi](https://github.com/earendil-works/pi), a minimal, extensible terminal coding agent, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `pi`.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`devbox:ubuntu-browser`](../../base/devbox/) | Pi coding agent; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>` |
| `ubuntu` | [`devbox:ubuntu-full`](../../base/devbox/) | Pi coding agent; Ubuntu, no browser | `ubuntu`, `<version>-ubuntu` |
| `alpine-browser` | [`devbox:alpine-browser`](../../base/devbox/) | Pi coding agent; Alpine, Chromium | `alpine-browser`, `<version>-alpine-browser` |
| `alpine` | [`devbox:alpine-full`](../../base/devbox/) | Pi coding agent; Alpine, no browser | `alpine`, `<version>-alpine` |

Pull from `ghcr.io/hambn/pi-agent:<tag>` or `docker.io/hambn/pi-agent:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Pi npm release; version tags are created once and never repointed. The old `pi-v<version>` tags are frozen and deprecated. The package is installed with `--ignore-scripts`.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## File map

- [`Dockerfile`](./Dockerfile)
- [`docker-bake.hcl`](./docker-bake.hcl)
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
- [`.github/workflows/ai-pi-agent.yml`](../../../.github/workflows/ai-pi-agent.yml) — builds, tests, and publishes every variant

## Sources

- [Pi repository](https://github.com/earendil-works/pi)
- [npm package `@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Pi documentation](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs)
