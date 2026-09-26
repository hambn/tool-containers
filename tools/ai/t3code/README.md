# t3code

[T3 Code](https://github.com/pingdotgg/t3code), a web GUI over coding agents, on the [`agentbloat`](../agentbloat/) image so Codex, Claude Code, Cursor, OpenCode, and the other bundled CLIs are ready to drive. The entrypoint is `t3 serve --host=0.0.0.0 --port=3773` and port `3773` is exposed.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`agentbloat:ubuntu-browser`](../agentbloat/) | T3 Code plus every agentbloat CLI; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>` |
| `ubuntu` | [`agentbloat:ubuntu`](../agentbloat/) | T3 Code plus every agentbloat CLI; Ubuntu, no browser | `ubuntu`, `<version>-ubuntu` |

No Alpine variants: upstream publishes only glibc builds of the `t3` binary, which gcompat cannot run.

Pull from `ghcr.io/hambn/t3code:<tag>` or `docker.io/hambn/t3code:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned T3 Code npm release; version tags are created once and never repointed. The old `t3code-stable-v<version>` and `t3code-nightly-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in. Authenticate agents from the T3 Code UI; the server itself has no built-in network authentication, so keep it on loopback or behind an authenticating proxy.

## Use cases

- **Local GUI over a checkout** — [`examples/docker/`](./examples/docker/), then open `http://127.0.0.1:3773`.
- **Persistent local instance** — [`examples/docker-compose/`](./examples/docker-compose/) or rootless [`examples/podman/`](./examples/podman/).
- **Shared cluster instance** — Deployment and Service in [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).
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
  - [`helm/`](./examples/helm/)
    - [`chart/`](./examples/helm/chart/)
      - [`templates/`](./examples/helm/chart/templates/)
        - [`deployment.yaml`](./examples/helm/chart/templates/deployment.yaml)
      - [`Chart.yaml`](./examples/helm/chart/Chart.yaml)
      - [`values.yaml`](./examples/helm/chart/values.yaml)
    - [`README.md`](./examples/helm/README.md)
  - [`kubernetes/`](./examples/kubernetes/)
    - [`README.md`](./examples/kubernetes/README.md)
    - [`deployment.yaml`](./examples/kubernetes/deployment.yaml)
  - [`podman/`](./examples/podman/)
    - [`README.md`](./examples/podman/README.md)
    - [`run.sh`](./examples/podman/run.sh)
- [`tests/`](./tests/)
  - [`smoke.sh`](./tests/smoke.sh)
  - [`structure.yaml`](./tests/structure.yaml)
- [`.github/workflows/ai-t3code.yml`](../../../.github/workflows/ai-t3code.yml) — builds, tests, and publishes every variant

## Sources

- [T3 Code repository](https://github.com/pingdotgg/t3code)
- [npm package `t3`](https://www.npmjs.com/package/t3)
