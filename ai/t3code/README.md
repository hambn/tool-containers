# t3code

[T3 Code](https://github.com/pingdotgg/t3code) — a minimal web GUI for coding agents (Codex, Claude, Cursor, OpenCode) — in a container. It's a GUI *over* agents, not an agent itself.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/t3code` or `docker.io/hambn/t3code` (Quay pending). T3 Code serves a web GUI + WebSocket server on port `3773`.

| Variant | Contains | Base | Install | Tags |
|---------|----------|------|---------|-------|
| `node-slim-standard` (default) | T3 Code + git, **bring your own agent** | `node:22-slim` | npm | `latest`, `node-slim-standard`, `node-slim-standard-<version>-<base-sha>` |
| `node-slim-agents` | + Claude Code, Codex, OpenCode + dev toolchain (ssh, python, build tools, jq, ripgrep, tmux, …) | `node:22-slim` | npm | `node-slim-agents`, `node-slim-agents-<version>-<base-sha>` |
| `node-slim-agents-dind` | + a full Docker engine (docker-in-docker) so the agent can build/run containers | `node:22-slim` | npm | `node-slim-agents-dind`, `node-slim-agents-dind-<version>-<base-sha>` |

`<version>` is the pinned upstream `t3` release. `<base-sha>` is the first 12 chars of the base image digest — the `<variant>-<version>-<base-sha>` tag is immutable and content-addressed; `latest`/`<variant>` are mutable and re-point on every rebuild. Debian slim (glibc) base — `t3` pulls in native `node-pty`, which is compiled at build time (build tools purged from `standard` after). `node-slim-standard` is the GUI alone; `node-slim-agents` is the runnable batteries-included image (T3 Code has no agent built in); `node-slim-agents-dind` adds Docker and must run `--privileged`. Auth the agent from inside the T3 Code UI — no API-key env needed. The images run `t3 --hostname=0.0.0.0` (t3 otherwise binds `127.0.0.1`), so the published port works behind a reverse proxy or via `ip:3773`.

## Use cases

- **Local GUI over your repo** — [`deployment/docker/run.sh`](./deployment/docker/run.sh), then open `http://localhost:3773`.
- **Compose service** — [`deployment/docker-compose/docker-compose.yml`](./deployment/docker-compose/docker-compose.yml) for a persistent local instance.
- **Airgapped host** — [`deployment/docker/airgapped.run.sh`](./deployment/docker/airgapped.run.sh) loads a saved tar, no registry.
- **Shared cluster instance** — [`deployment/kubernetes/deployment.yaml`](./deployment/kubernetes/deployment.yaml) Deployment + Service, port-forward to reach it.

## File map

- **images/** — one Dockerfile per variant
  - [`node-slim-standard/Dockerfile`](./images/node-slim-standard/Dockerfile) — t3 GUI + git (Node Debian slim), default, bring your own agent
  - [`node-slim-agents/Dockerfile`](./images/node-slim-agents/Dockerfile) — t3 + Claude Code/Codex/OpenCode + dev toolchain
  - [`node-slim-agents-dind/Dockerfile`](./images/node-slim-agents-dind/Dockerfile) — + Docker engine (docker-in-docker), boots dockerd via [`entrypoint.sh`](./images/node-slim-agents-dind/entrypoint.sh)
- **deployment/** — one subdir per platform
  - [`docker/`](./deployment/docker/) — [`run.sh`](./deployment/docker/run.sh), [`airgapped.run.sh`](./deployment/docker/airgapped.run.sh), [`dind.run.sh`](./deployment/docker/dind.run.sh)
  - [`docker-compose/`](./deployment/docker-compose/) — [`docker-compose.yml`](./deployment/docker-compose/docker-compose.yml), [`airgapped.docker-compose.yml`](./deployment/docker-compose/airgapped.docker-compose.yml)
  - [`podman/`](./deployment/podman/) — [`run.sh`](./deployment/podman/run.sh)
  - [`docker-swarm/`](./deployment/docker-swarm/) — [`stack.yml`](./deployment/docker-swarm/stack.yml)
  - [`kubernetes/`](./deployment/kubernetes/) — [`deployment.yaml`](./deployment/kubernetes/deployment.yaml)
  - [`helm/`](./deployment/helm/) — [`chart/`](./deployment/helm/chart/)
- CI: [`.github/workflows/ai-t3code.yml`](../../.github/workflows/ai-t3code.yml) — builds every variant, pushes all registries

## Sources

- T3 Code: https://github.com/pingdotgg/t3code
- npm package: https://www.npmjs.com/package/t3
