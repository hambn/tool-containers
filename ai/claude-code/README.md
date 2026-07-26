# claude-code

[Claude Code](https://github.com/anthropics/claude-code) CLI in a container — Anthropic's agentic coding tool, no local Node needed.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/claude-code` or `docker.io/hambn/claude-code` (Quay pending). Variants are named by what's inside — base is folded into the name here because it changes runtime behavior (Node present or not), not for its own sake.

| Variant | Contains | Base | Install | Tags |
|---------|----------|------|---------|-------|
| `node-alpine-minimal` (default) | Claude Code + git/ripgrep | `node:22-alpine` | npm | `latest`, `node-alpine-minimal`, `node-alpine-minimal-<version>-<base-sha>` |
| `node-alpine-full` | + ssh, curl, python, build tools, jq | `node:22-alpine` | npm | `node-alpine-full`, `node-alpine-full-<version>-<base-sha>` |
| `alpine-minimal` | Claude Code native binary, **no Node.js** | `alpine:3.21` | native binary | `alpine-minimal`, `alpine-minimal-<version>-<base-sha>` |
| `claude-code-gitlab` | + GitLab `glab` MCP, Git LFS, SSH, Python, build tools, jq | `node:22-alpine` | npm + official `glab` CLI | `claude-code-gitlab`, `claude-code-gitlab-<version>-<base-sha>` |

`<version>` is the pinned upstream release (e.g. `1.2.3`). `<base-sha>` is the first 12 chars of the base image digest — the `<variant>-<version>-<base-sha>` tag is immutable and content-addressed; `latest`/`<variant>` are mutable and re-point on every rebuild. `alpine-minimal` is smallest (~362 MB, no Node runtime); `node-alpine-full` is the batteries-included toolchain (~1 GB).


## Use cases

- **Local agent run** — [`deployment/docker/run.sh`](./deployment/docker/run.sh) against your repo.
- **CI step** — run as a pipeline job.
- **Airgapped host** — [`deployment/docker/airgapped.run.sh`](./deployment/docker/airgapped.run.sh) loads a saved tar, no registry.
- **k8s batch job** — [`deployment/kubernetes/job.yaml`](./deployment/kubernetes/job.yaml) for one-shot cluster runs.

## File map

- **images/** — one Dockerfile per variant
  - [`node-alpine-minimal/Dockerfile`](./images/node-alpine-minimal/Dockerfile) — npm claude + git/ripgrep (Node Alpine), default
  - [`node-alpine-full/Dockerfile`](./images/node-alpine-full/Dockerfile) — npm claude + ssh/curl/python/build tools/jq (Node Alpine)
  - [`alpine-minimal/Dockerfile`](./images/alpine-minimal/Dockerfile) — native claude binary, no Node.js (bare Alpine)
  - [`claude-code-gitlab/Dockerfile`](./images/claude-code-gitlab/Dockerfile) — Claude Code + GitLab `glab` MCP server and CI toolchain
- **deployment/** — one subdir per platform
  - [`docker/`](./deployment/docker/) — [`run.sh`](./deployment/docker/run.sh), [`airgapped.run.sh`](./deployment/docker/airgapped.run.sh)
  - [`docker-compose/`](./deployment/docker-compose/) — [`docker-compose.yml`](./deployment/docker-compose/docker-compose.yml), [`airgapped.docker-compose.yml`](./deployment/docker-compose/airgapped.docker-compose.yml)
  - [`podman/`](./deployment/podman/) — [`run.sh`](./deployment/podman/run.sh)
  - [`docker-swarm/`](./deployment/docker-swarm/) — [`stack.yml`](./deployment/docker-swarm/stack.yml)
  - [`kubernetes/`](./deployment/kubernetes/) — [`job.yaml`](./deployment/kubernetes/job.yaml)
  - [`helm/`](./deployment/helm/) — [`chart/`](./deployment/helm/chart/)
- CI: [`.github/workflows/ai-claude-code.yml`](../../.github/workflows/ai-claude-code.yml) — builds every variant, pushes all registries

## Sources

- Claude Code: https://github.com/anthropics/claude-code
- npm package: https://www.npmjs.com/package/@anthropic-ai/claude-code
- GitLab CLI: https://gitlab.com/gitlab-org/cli
- GitLab MCP: https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/
- Docs: https://docs.anthropic.com/en/docs/claude-code
