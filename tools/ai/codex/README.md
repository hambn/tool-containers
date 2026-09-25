# codex

[OpenAI Codex CLI](https://github.com/openai/codex) on the [`devbox`](../../base/devbox/) development image. The entrypoint is `codex`.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`devbox:ubuntu-browser`](../../base/devbox/) | Codex CLI; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>` |
| `ubuntu` | [`devbox:ubuntu-full`](../../base/devbox/) | Codex CLI; Ubuntu, no browser | `ubuntu`, `<version>-ubuntu` |
| `alpine-browser` | [`devbox:alpine-browser`](../../base/devbox/) | Codex CLI; Alpine, Chromium | `alpine-browser`, `<version>-alpine-browser` |
| `alpine` | [`devbox:alpine-full`](../../base/devbox/) | Codex CLI; Alpine, no browser | `alpine`, `<version>-alpine` |

Pull from `ghcr.io/hambn/codex:<tag>` or `docker.io/hambn/codex:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Codex npm release; version tags are created once and never repointed. The old `codex-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/).
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
- [`.github/workflows/images.yml`](../../../.github/workflows/images.yml) — builds, tests, and publishes every variant

## Sources

- [Codex repository](https://github.com/openai/codex)
- [npm package `@openai/codex`](https://www.npmjs.com/package/@openai/codex)
- [Codex documentation](https://developers.openai.com/codex/)
