---
name: codex
title: Codex CLI
description: OpenAI Codex CLI on the devbox development image, with Ubuntu and Alpine variants and optional headless Chromium.
upstream: https://github.com/openai/codex
image: ghcr.io/hambn/codex
keywords: [openai, coding agent, devbox, ubuntu, alpine, headless chromium]
---

# codex

[OpenAI Codex CLI](https://github.com/openai/codex) on the [`devbox`](../../base/devbox/) development image. The entrypoint is `codex`.

- **Source:** [`tools/ai/codex/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/codex)
- **Docs:** [tool-containers.hgh.dev/docs/ai/codex/](https://tool-containers.hgh.dev/docs/ai/codex/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Codex CLI; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [codex](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Codex CLI; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `codex-<version>`
  - Included software: [codex](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Codex CLI; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [codex](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Codex CLI; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [codex](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/codex:<tag>` or `docker.io/hambn/codex:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant), which also carries `codex-<version>` for the pinned Codex npm release. Every tag moves on each rebuild; pin a digest for reproducibility. Earlier `<version>-<variant>` and `<version>` tags are no longer published. The old `codex-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

- **OpenAI Codex CLI**
  - Commands: `codex`
  - Source: npm `@openai/codex`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Interactive coding on a local checkout** — [`docs/docker/`](./docs/docker/).
- **Rootless sessions on a workstation** — [`docs/podman/`](./docs/podman/).
- **Repeatable local sessions** — [`docs/docker-compose/`](./docs/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`docs/docker/`](./docs/docker/) and [`docs/docker-compose/`](./docs/docker-compose/).

## Sources

- [Codex repository](https://github.com/openai/codex)
- [npm package `@openai/codex`](https://www.npmjs.com/package/@openai/codex)
- [Codex documentation](https://developers.openai.com/codex/)
