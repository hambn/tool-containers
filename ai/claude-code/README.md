# claude-code

[Claude Code](https://github.com/anthropics/claude-code) CLI in a container — Anthropic's agentic coding tool, no local Node needed.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from any registry: `ghcr.io/hambn/claude-code` · `docker.io/hambn/claude-code` · `quay.io/hambn/claude-code`. Variants are named by what's inside, not the base.

| Variant | Contains | Base | Tags |
|---------|----------|------|------|
| `minimal` (default) | Claude Code + git/ripgrep | `node:22-alpine` | `latest`, `<version>`, `<version>-<date>` |

`<version>` is the pinned npm release (e.g. `1.2.3`, immutable). `<version>-<date>` is a traceable rebuild. Every image also gets a `sha-<gitsha>` tag.

<!-- test scope: single alpine variant to validate the pipeline end-to-end. standard/full return once green. -->


## Use cases

- **Local agent run** — [`deployment/docker/run.sh`](./deployment/docker/run.sh) against your repo.
- **CI step** — run as a pipeline job.
- **Airgapped host** — [`deployment/docker/airgapped.run.sh`](./deployment/docker/airgapped.run.sh) loads a saved tar, no registry.
- **k8s batch job** — [`deployment/kubernetes/job.yaml`](./deployment/kubernetes/job.yaml) for one-shot cluster runs.

## File map

- **images/** — one Dockerfile per variant
  - [`minimal/Dockerfile`](./images/minimal/Dockerfile) — claude + git/ripgrep (alpine), default
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
- Docs: https://docs.anthropic.com/en/docs/claude-code
