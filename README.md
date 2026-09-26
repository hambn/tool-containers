# tool-containers

Docker images for many purposes — AI agents, CI builders, sandboxes, and more. Each image is a self-contained "tool" inside a category, with multiple build variants and per-platform deployment recipes, published to GHCR and Docker Hub.

Repository guidance starts in [`AGENTS.md`](./AGENTS.md) and is implemented as
on-demand [repository skills](./.agents/skills/).

## Catalog

### ai

| Tool | Description |
|-------|-------------|
| [codex](./tools/ai/codex/) | [OpenAI Codex CLI](https://github.com/openai/codex) on devbox |
| [agentbloat](./tools/ai/agentbloat/) | Current Codex, Claude, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi agent CLIs on devbox |
| [open-code-review](./tools/ai/open-code-review/) | Alibaba Open Code Review CLI on devbox |
| [pi-agent](./tools/ai/pi-agent/) | [Pi](https://github.com/earendil-works/pi) coding agent on devbox |
| [omnigent](./tools/ai/omnigent/) | [Omnigent](https://github.com/omnigent-ai/omnigent) AI agent meta-harness on agentbloat |
| [claude-code](./tools/ai/claude-code/) | [Claude Code](https://github.com/anthropics/claude-code) CLI on devbox |
| [t3code](./tools/ai/t3code/) | [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents on agentbloat |

### base

| Tool | Description |
|------|-------------|
| [core](./tools/base/core/) | Hardened Alpine, Ubuntu, and Wolfi application bases |
| [devbox](./tools/base/devbox/) | Interactive development and CI image in lite, full, and browser tiers |

### ci

_None yet._

### sandboxes

_None yet._

## Images and tags

Every image is published under the same tags to `ghcr.io/hambn/<repo>` and
`docker.io/hambn/<repo>`, where `<repo>` is the tool name. Each tool README lists its
variants.

- **Base images** (core, devbox): one tag per variant, plus `latest` on the largest
  variant, e.g. `devbox:ubuntu-lite`, `devbox:latest` (= `ubuntu-browser`).
- **Interactive images** (agents and other tools): one tag per variant, plus `latest`
  and `<tool>-<version>` on the lightest Ubuntu variant, e.g. `codex:ubuntu-browser`,
  `codex:latest`, `codex:codex-<version>`.

Every tag moves to the newest build; pin a digest for reproducibility.

Each tool directory is self-contained: its `Dockerfile` pins every version as an `ARG`
default (updated by Renovate), its `docker-bake.hcl` lists the variants, and each image
builds `FROM` its published parent. Every tool has its own workflow,
`.github/workflows/<category>-<tool>.yml`, calling the shared
[`.github/workflows/tool-image.yml`](./.github/workflows/tool-image.yml) to test, scan, and publish.
To build locally:

```sh
docker build tools/ai/claude-code             # default variant
cd tools/ai/claude-code && docker buildx bake # every variant
docker buildx bake claude-code-alpine         # one variant (from the tool directory)
docker buildx bake --print                    # show the variants
```

**Deprecated:** the `agentimg` repository and the old `claude-code-v*`, `ocr-v*`, and
`<variant>-<sha>` tags are frozen and no longer updated. Migrate
`agentimg:<variant>` to `devbox:<distro>-full`, or to `devbox:<distro>-browser` for
variants with headless Chromium.
