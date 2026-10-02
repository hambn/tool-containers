---
name: codex
title: Codex CLI
description: OpenAI Codex CLI on the devbox development image, with Ubuntu and Alpine variants and optional headless Chromium.
upstream: https://github.com/openai/codex
order: 3
images: [ghcr.io/hambn/codex, docker.io/hambn/codex]
keywords: [openai, coding agent, devbox, ubuntu, alpine, headless chromium]
---

# Codex CLI

OpenAI's [Codex CLI](https://github.com/openai/codex) on the [devbox](../../base/devbox/)
development image, for running Codex on a local checkout or reviewing changes in CI. The
entrypoint is `codex`, and the container starts in `/workspace` as `sysadmin`
(UID 1000). No credentials are stored in the image.

- **Source:** [`tools/ai/codex/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/codex)
- **Docs:** [tool-containers.hgh.dev/docs/ai/codex/](https://tool-containers.hgh.dev/docs/ai/codex/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here, and the CI recipes use it.
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `codex-<version>`
  - Included software: [Codex CLI](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the local recipes.
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [Codex CLI](#included-software) and the [devbox browser tier](../../base/devbox/#browser)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [Codex CLI](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [Codex CLI](#included-software) and the [devbox browser tier](../../base/devbox/#browser)

Pull `ghcr.io/hambn/codex:<tag>` or `docker.io/hambn/codex:<tag>`. `codex-<version>`
names the Codex npm release in the current `ubuntu` build. All tags move when the image
is rebuilt; pin a digest to keep one build.

## Included software

- **Codex CLI**
  - Command: `codex`
  - Source: npm package `@openai/codex`, version pinned in the [`Dockerfile`](./Dockerfile)

Git, Node.js, Python, Go, the Docker CLI, and the other devbox tools come from the
[devbox full tier](../../base/devbox/#full). The `*-browser` variants add the
[browser tier](../../base/devbox/#browser).

## Use cases

- **Interactive coding on a local checkout** with [Docker](./docs/docker/), including
  hosts that load the image from a saved tar.
- **Repeatable local sessions** with [Docker compose](./docs/docker-compose/), with an
  air-gapped Compose file.
- **Rootless sessions on a workstation** with [Podman](./docs/podman/).
- **Code review in CI** on GitHub pull requests with
  [GitHub Actions](./docs/github-actions/) or on GitLab merge requests with
  [GitLab CI](./docs/gitlab-ci/).

## Sources

- [Codex repository](https://github.com/openai/codex)
- [npm package `@openai/codex`](https://www.npmjs.com/package/@openai/codex)
- [Codex documentation](https://developers.openai.com/codex/)
