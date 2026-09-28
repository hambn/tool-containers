# tool-containers

Container images for AI coding agents and the development shells they run in, published to GHCR and Docker Hub for developers and CI pipelines. Each tool page lists the image variants and links recipes for Docker, Podman, Kubernetes, CI, and the other platforms it supports.

Repository guidance starts in [`AGENTS.md`](./AGENTS.md) and is implemented as
on-demand [repository skills](./.agents/skills/).

## Catalog

### [AI](./tools/ai/)

| Tool | Description |
|------|-------------|
| [agentbloat](./tools/ai/agentbloat/) | Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, and Pi agent CLIs in one image |
| [Claude Code](./tools/ai/claude-code/) | Anthropic's [Claude Code](https://github.com/anthropics/claude-code) CLI on devbox |
| [Codex CLI](./tools/ai/codex/) | OpenAI's [Codex CLI](https://github.com/openai/codex) on devbox |
| [Omnigent](./tools/ai/omnigent/) | The [Omnigent](https://github.com/omnigent-ai/omnigent) agent meta-harness on agentbloat |
| [Open Code Review](./tools/ai/open-code-review/) | Alibaba's Open Code Review CLI on devbox |
| [Pi Coding Agent](./tools/ai/pi-agent/) | The [Pi](https://github.com/earendil-works/pi) terminal coding agent on devbox |
| [T3 Code](./tools/ai/t3code/) | The [T3 Code](https://github.com/pingdotgg/t3code) web GUI for coding agents on agentbloat |

### [Base](./tools/base/)

| Tool | Description |
|------|-------------|
| [core](./tools/base/core/) | Hardened Wolfi, Alpine, and Ubuntu application bases |
| [devbox](./tools/base/devbox/) | Ubuntu and Alpine development and CI image in lite, full, and browser tiers |

### CI

_None yet._

### Sandboxes

_None yet._

## Images and tags

Every image is published with the same tags to `ghcr.io/hambn/<tool>` and
`docker.io/hambn/<tool>`. Each variant has its own tag, such as `devbox:ubuntu-lite` or
`codex:alpine-browser`, and each tool README lists them.

| Image | `latest` points to | Version tag |
|-------|--------------------|-------------|
| core | `ubuntu` | none |
| devbox | `ubuntu-browser` | none |
| agentbloat | `ubuntu` | none |
| Other AI images | `ubuntu` | `<tool>-<version>` on `ubuntu`, for example `codex:codex-<version>` |

Tags move to each new build. Pin a digest, such as
`ghcr.io/hambn/codex@sha256:<digest>`, when you need the same image every time.

The `agentimg` image and its old tag schemes are no longer published. Replace
`agentimg:<variant>` with `devbox:<distro>-full`, or `devbox:<distro>-browser` if you
used headless Chromium.

## How images are built

Each tool directory holds a `Dockerfile` that pins every version as an `ARG` default,
kept current by Renovate, and a `docker-bake.hcl` that lists its variants. Each image
builds `FROM` its published parent: core, then devbox, then agentbloat. A workflow per
tool, `.github/workflows/<category>-<tool>.yml`, calls the shared
[`tool-image.yml`](./.github/workflows/tool-image.yml) to test, scan, and publish.

Build locally:

```sh
docker build tools/ai/claude-code             # default variant, ubuntu-browser
cd tools/ai/claude-code && docker buildx bake # every variant
docker buildx bake claude-code-alpine         # one variant, from the tool directory
docker buildx bake --print                    # list the variants
```
