# tool-containers

Docker images for many purposes — AI agents, CI builders, sandboxes, and more. Each image is a self-contained "tool" inside a category, with multiple build variants and per-platform deployment recipes, published to GHCR and Docker Hub.

Repository guidance starts in [`AGENTS.md`](./AGENTS.md) and is implemented as
on-demand [repository skills](./.agents/skills/).

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [codex](./src/tools/ai/codex/) | [OpenAI Codex CLI](https://github.com/openai/codex) on devbox |
| [agentbloat](./src/tools/ai/agentbloat/) | Current Codex, Claude, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi agent CLIs on devbox |
| [open-code-review](./src/tools/ai/open-code-review/) | Alibaba Open Code Review CLI on devbox |
| [pi-agent](./src/tools/ai/pi-agent/) | [Pi](https://github.com/earendil-works/pi) coding agent on devbox |
| [omnigent](./src/tools/ai/omnigent/) | [Omnigent](https://github.com/omnigent-ai/omnigent) AI agent meta-harness on agentbloat |
| [claude-code](./src/tools/ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI on devbox |
| [t3code](./src/tools/ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents on agentbloat |

### base

| Tool | Description |
|------|-------------|
| [core](./src/tools/base/core/) | Hardened Alpine, Ubuntu, and Wolfi application bases |
| [devbox](./src/tools/base/devbox/) | Interactive development and CI image in lite, full, and browser tiers |

### ci

_None yet._

### sandboxes

_None yet._

## Images and tags

Every image is published under the same tags to `ghcr.io/hambn/<repo>` and
`docker.io/hambn/<repo>`, where `<repo>` is the tool name. Each tool README lists its
variants.

| Tag | Repointed | Example |
|-----|-----------|---------|
| `<variant>`, `latest` | On every build | `devbox:ubuntu-full` |
| `<toolversion>-<variant>`, `<toolversion>` (agents) | No | `codex:<version>-ubuntu` |
| `<variant>-<YYYYMMDD>-<sha7>` (core, devbox, agentbloat) | No | `core:wolfi-<YYYYMMDD>-<sha7>` |

Builds are defined in [`src/tools/docker-bake.hcl`](./src/tools/docker-bake.hcl), with every version pin in
[`src/tools/versions.hcl`](./src/tools/versions.hcl), and are built and published by
[`.github/workflows/images.yml`](./.github/workflows/images.yml).

## Local builds

Run these commands from the repository root. Docker Buildx reads the same Dockerfiles,
named contexts, dependency targets, arguments, tags and variants as CI. Go is not
required for a local image build.

```sh
docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl --print all
docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl core-alpine
docker buildx bake -f src/tools/docker-bake.hcl -f src/tools/versions.hcl codex-ubuntu-browser
```

Replace the final name with any published target shown by `--print all`. For a local
image with a separate tag, add `--load --set core-alpine.tags=local/core:alpine`.
Targets such as `codex-ubuntu-browser` need Bake because their Dockerfiles use
named `target:` contexts.

The `core` Dockerfile can also be built directly. Its `FROM` arguments come from
[`src/tools/versions.hcl`](./src/tools/versions.hcl); update this command when those
pins change:

```sh
docker build --target core \
  --build-arg DISTRO=alpine \
  --build-arg OS_REFRESH=2026-09-25 \
  --build-arg ALPINE_IMAGE=docker.io/library/alpine:3.24@sha256:294b683cb724975bec92580e1e685676bd4b50bda910ddb8c51d4cabeaec77e6 \
  --build-arg UBUNTU_IMAGE=docker.io/library/ubuntu:24.04@sha256:008173c23f95b170204355c12626cb5a965d779a7e1283b09e9cffbb1bf33ca3 \
  --build-arg WOLFI_IMAGE=docker.io/chainguard/wolfi-base:latest@sha256:fac38d12efdb4bf43ac9e599a31db10a27ad5dd71e5f1618790962eda8d66180 \
  -f src/tools/base/core/Dockerfile -t local/core:alpine src/tools/base/core
```

**Deprecated:** the `agentimg` repository and the old `claude-code-v*`, `ocr-v*`, and
`<variant>-<sha>` tags are frozen and no longer updated. Migrate
`agentimg:<variant>` to `devbox:<distro>-full`, or to `devbox:<distro>-browser` for
variants with headless Chromium.
