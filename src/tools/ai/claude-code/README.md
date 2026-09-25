# claude-code

[Claude Code](https://github.com/anthropics/claude-code), Anthropic's coding agent CLI, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `claude`.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`devbox:ubuntu-browser`](../../base/devbox/) | Claude Code; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>` |
| `ubuntu` | [`devbox:ubuntu-full`](../../base/devbox/) | Claude Code; Ubuntu, no browser | `ubuntu`, `<version>-ubuntu` |
| `alpine-browser` | [`devbox:alpine-browser`](../../base/devbox/) | Claude Code; Alpine, Chromium | `alpine-browser`, `<version>-alpine-browser` |
| `alpine` | [`devbox:alpine-full`](../../base/devbox/) | Claude Code; Alpine, no browser | `alpine`, `<version>-alpine` |

Pull from `ghcr.io/hambn/claude-code:<tag>` or `docker.io/hambn/claude-code:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Claude Code npm release; version tags are created once and never repointed. The old `claude-code-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/) or rootless [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **One-shot review in a cluster** — Kubernetes Job in [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).
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
  - [`helm/`](./examples/helm/)
    - [`chart/`](./examples/helm/chart/)
      - [`templates/`](./examples/helm/chart/templates/)
        - [`job.yaml`](./examples/helm/chart/templates/job.yaml)
      - [`Chart.yaml`](./examples/helm/chart/Chart.yaml)
      - [`values.yaml`](./examples/helm/chart/values.yaml)
    - [`README.md`](./examples/helm/README.md)
  - [`kubernetes/`](./examples/kubernetes/)
    - [`README.md`](./examples/kubernetes/README.md)
    - [`job.yaml`](./examples/kubernetes/job.yaml)
  - [`podman/`](./examples/podman/)
    - [`README.md`](./examples/podman/README.md)
    - [`run.sh`](./examples/podman/run.sh)
- [`tests/`](./tests/)
  - [`structure-alpine.yaml`](./tests/structure-alpine.yaml)
  - [`structure.yaml`](./tests/structure.yaml)
- [`.github/workflows/images.yml`](../../../../.github/workflows/images.yml) — builds, tests, and publishes every variant

## Sources

- [Claude Code repository](https://github.com/anthropics/claude-code)
- [npm package `@anthropic-ai/claude-code`](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
