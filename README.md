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

| Tag | Repointed | Example |
|-----|-----------|---------|
| `<variant>`, `latest` | On every build | `devbox:ubuntu-full` |
| `<toolversion>-<variant>`, `<toolversion>` (agents) | No | `codex:<version>-ubuntu` |
| `<variant>-<YYYYMMDD>-<sha7>` (core, devbox, agentbloat) | No | `core:wolfi-<YYYYMMDD>-<sha7>` |

Builds are defined in [`tools/docker-bake.hcl`](./tools/docker-bake.hcl), with every version pin in
[`tools/versions.hcl`](./tools/versions.hcl), and are built and published by
[`.github/workflows/images.yml`](./.github/workflows/images.yml).

**Deprecated:** the `agentimg` repository and the old `claude-code-v*`, `ocr-v*`, and
`<variant>-<sha>` tags are frozen and no longer updated. Migrate
`agentimg:<variant>` to `devbox:<distro>-full`, or to `devbox:<distro>-browser` for
variants with headless Chromium.
