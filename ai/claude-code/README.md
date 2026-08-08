# claude-code

[Claude Code](https://github.com/anthropics/claude-code) is Anthropic's agentic coding
CLI, packaged on the reusable [`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/claude-code:<tag>` or
`docker.io/hambn/claude-code:<tag>`. The four profiles match the four `agentimg`
foundations; the browser profiles add headless Chromium. The primary profile is
`ubuntu-browser`.

| Variant | Contents | Base | Install | Owned tags |
|---------|----------|------|---------|------------|
| `ubuntu-browser` (primary) | Claude Code, Node.js, Ubuntu tools, headless Chromium | `ghcr.io/hambn/agentimg:ubuntu-browser` | npm | `latest`, `ubuntu-browser`, `cc-v<version>` on a Claude release |
| `ubuntu` | Claude Code, Node.js, Ubuntu tools | `ghcr.io/hambn/agentimg:ubuntu` | npm | `ubuntu` |
| `alpine-browser` | Claude Code, Node.js, Alpine tools, Chromium | `ghcr.io/hambn/agentimg:alpine-browser` | npm | `alpine-browser` |
| `alpine` | Claude Code, Node.js, Alpine tools | `ghcr.io/hambn/agentimg:alpine` | npm | `alpine` |

Source edits and `agentimg` base refreshes repoint the moving variant tags. A detected
Claude Code package release repoints all moving tags and adds `cc-v<version>` to the
primary image. See the repository's [registry and tag policy](../../.agents/references/repo/registries-and-tags.md).

## Use cases

- **Interactive local coding** — [`deployment/docker/`](./deployment/docker/).
- **Repeatable local sessions** — [`deployment/docker-compose/`](./deployment/docker-compose/).
- **Rootless development** — [`deployment/podman/`](./deployment/podman/).
- **One-shot cluster run** — [`deployment/kubernetes/`](./deployment/kubernetes/) or
  [`deployment/helm/`](./deployment/helm/).
- **Detached non-interactive run** — [`deployment/docker-swarm/`](./deployment/docker-swarm/).

All examples require `ANTHROPIC_API_KEY` at runtime. Credentials are not stored in the
image or deployment files.

## File map

- [`README.md`](./README.md)
- [`images/`](./images/)
  - [`ubuntu-browser/Dockerfile`](./images/ubuntu-browser/Dockerfile) — Ubuntu tools with Chromium (primary)
  - [`ubuntu/Dockerfile`](./images/ubuntu/Dockerfile) — Ubuntu tools without a browser
  - [`alpine-browser/Dockerfile`](./images/alpine-browser/Dockerfile) — Alpine tools with Chromium
  - [`alpine/Dockerfile`](./images/alpine/Dockerfile) — Alpine tools without a browser
- [`deployment/`](./deployment/)
  - [`docker/README.md`](./deployment/docker/README.md)
    - [`run.sh`](./deployment/docker/run.sh)
    - [`airgapped.run.sh`](./deployment/docker/airgapped.run.sh)
  - [`docker-compose/README.md`](./deployment/docker-compose/README.md)
    - [`docker-compose.yml`](./deployment/docker-compose/docker-compose.yml)
    - [`airgapped.docker-compose.yml`](./deployment/docker-compose/airgapped.docker-compose.yml)
  - [`podman/README.md`](./deployment/podman/README.md)
    - [`run.sh`](./deployment/podman/run.sh)
  - [`docker-swarm/README.md`](./deployment/docker-swarm/README.md)
    - [`stack.yml`](./deployment/docker-swarm/stack.yml)
  - [`kubernetes/README.md`](./deployment/kubernetes/README.md)
    - [`job.yaml`](./deployment/kubernetes/job.yaml)
  - [`helm/README.md`](./deployment/helm/README.md)
    - [`chart/Chart.yaml`](./deployment/helm/chart/Chart.yaml)
    - [`chart/values.yaml`](./deployment/helm/chart/values.yaml)
    - [`chart/templates/job.yaml`](./deployment/helm/chart/templates/job.yaml)
- CI: [`.github/workflows/ai-claude-code.yml`](../../.github/workflows/ai-claude-code.yml)

## Sources

- [Claude Code source repository](https://github.com/anthropics/claude-code)
- [Claude Code npm package](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
- [agentimg foundation](../../base/agentimg/)
