# t3code

[T3 Code](https://github.com/pingdotgg/t3code) — a minimal web GUI for coding agents (Codex, Claude, Cursor, OpenCode) — in a container. It's a GUI *over* agents, not an agent itself.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/t3code` or `docker.io/hambn/t3code` (Quay pending). T3 Code serves a web GUI + WebSocket server on port `3773` and inherits the current agent CLIs from `agentbloat`.

| Variant | Contains | Base | Install | Tags |
|---------|----------|------|---------|-------|
| `ubuntu-browser` (default) | T3 Code + all agentbloat CLIs + Ubuntu toolset + Chromium | `ghcr.io/hambn/agentbloat:ubuntu-browser` | npm | `latest`, `ubuntu-browser` |
| `ubuntu` | T3 Code + all agentbloat CLIs + Ubuntu toolset | `ghcr.io/hambn/agentbloat:ubuntu` | npm | `ubuntu` |
| `alpine-browser` | T3 Code + all agentbloat CLIs + Alpine toolset + Chromium | `ghcr.io/hambn/agentbloat:alpine-browser` | npm | `alpine-browser` |
| `alpine` | T3 Code + all agentbloat CLIs + Alpine toolset | `ghcr.io/hambn/agentbloat:alpine` | npm | `alpine` |

The moving variant tags and `latest` are repointed for every selected rebuild. A base-only refresh or repository edit creates no additional version tag. When the inherited agent CLIs or T3 release changes, the primary image also receives `t3code-stable-v<version>` (or `t3code-nightly-v<version>` for a nightly release). The four profiles keep the matching browser and distribution behavior from `agentbloat`. The images run `t3 serve --host=0.0.0.0 --port=3773` so the published port works behind a reverse proxy or via `ip:3773`.

See the repository's [registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

## Use cases

- **Local GUI over your repo** — [`examples/docker/run.sh`](./examples/docker/run.sh), then open `http://localhost:3773`.
- **Compose service** — [`examples/docker-compose/docker-compose.yml`](./examples/docker-compose/docker-compose.yml) for a persistent local instance.
- **Airgapped host** — [`examples/docker/airgapped.run.sh`](./examples/docker/airgapped.run.sh) loads a saved tar, no registry.
- **Shared cluster instance** — [`examples/kubernetes/deployment.yaml`](./examples/kubernetes/deployment.yaml) Deployment + Service, port-forward to reach it.

## File map

- **images/** — one Dockerfile per variant
  - [`ubuntu-browser/Dockerfile`](./images/ubuntu-browser/Dockerfile) — T3 Code on Ubuntu with Chromium, default
  - [`ubuntu/Dockerfile`](./images/ubuntu/Dockerfile) — T3 Code on Ubuntu without a browser
  - [`alpine-browser/Dockerfile`](./images/alpine-browser/Dockerfile) — T3 Code on Alpine with Chromium
  - [`alpine/Dockerfile`](./images/alpine/Dockerfile) — T3 Code on Alpine without a browser
- **examples/** — one subdir per platform
  - [`docker/`](./examples/docker/) — [`run.sh`](./examples/docker/run.sh), [`airgapped.run.sh`](./examples/docker/airgapped.run.sh)
  - [`docker-compose/`](./examples/docker-compose/) — [`docker-compose.yml`](./examples/docker-compose/docker-compose.yml), [`airgapped.docker-compose.yml`](./examples/docker-compose/airgapped.docker-compose.yml)
  - [`podman/`](./examples/podman/) — [`run.sh`](./examples/podman/run.sh)
  - [`docker-swarm/`](./examples/docker-swarm/) — [`stack.yml`](./examples/docker-swarm/stack.yml)
  - [`kubernetes/`](./examples/kubernetes/) — [`deployment.yaml`](./examples/kubernetes/deployment.yaml)
  - [`helm/`](./examples/helm/) — [`chart/`](./examples/helm/chart/)
- CI: [`.github/workflows/ai-t3code.yml`](../../../.github/workflows/ai-t3code.yml) — detects agent/base/T3 updates and pushes both registries

## Sources

- T3 Code: https://github.com/pingdotgg/t3code
- npm package: https://www.npmjs.com/package/t3
