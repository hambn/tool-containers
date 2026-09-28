---
name: claude-code
title: Claude Code
description: Anthropic's Claude Code CLI on the devbox development image, with Ubuntu and Alpine variants and optional headless Chromium.
upstream: https://github.com/anthropics/claude-code
order: 2
images: [ghcr.io/hambn/claude-code, docker.io/hambn/claude-code]
keywords: [anthropic, coding agent, devbox, ubuntu, alpine, headless chromium]
---

# Claude Code

Anthropic's [Claude Code](https://github.com/anthropics/claude-code) on the
[devbox](../../base/devbox/) development image, for interactive coding on a local
checkout, one-shot runs in a cluster, and pull request review in CI. The entrypoint is
`claude`, and the container starts in `/workspace` as `sysadmin` (UID 1000). No
credentials are stored in the image.

- **Source:** [`tools/ai/claude-code/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/claude-code)
- **Docs:** [tool-containers.hgh.dev/docs/ai/claude-code/](https://tool-containers.hgh.dev/docs/ai/claude-code/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here, and the CI recipes use it.
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `claude-code-<version>`
  - Included software: [Claude Code](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the local recipes.
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [Claude Code](#included-software) and the [devbox browser tier](../../base/devbox/#browser)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [Claude Code](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [Claude Code](#included-software) and the [devbox browser tier](../../base/devbox/#browser)

Pull `ghcr.io/hambn/claude-code:<tag>` or `docker.io/hambn/claude-code:<tag>`.
`claude-code-<version>` names the Claude Code npm release in the current `ubuntu`
build. All tags move when the image is rebuilt; pin a digest to keep one build.

## Included software

- **Claude Code**
  - Command: `claude`
  - Source: npm package `@anthropic-ai/claude-code`, version pinned in the [`Dockerfile`](./Dockerfile)

Git, Node.js, Python, Go, the Docker CLI, and the other devbox tools come from the
[devbox full tier](../../base/devbox/#full). The `*-browser` variants add the
[browser tier](../../base/devbox/#browser).

## Use cases

- **Interactive coding on a local checkout** with [Docker](./docs/docker/), including
  hosts that load the image from a saved tar.
- **Repeatable local sessions** with [Docker Compose](./docs/docker-compose/), with an
  air-gapped Compose file.
- **Rootless sessions on a workstation** with [Podman](./docs/podman/).
- **One-shot review in a cluster** from plain manifests with
  [Kubernetes](./docs/kubernetes/) or from a Helm chart with [Helm](./docs/helm/).
- **Code review in CI** on GitHub pull requests with
  [GitHub Actions](./docs/github-actions/) or on GitLab merge requests with
  [GitLab CI](./docs/gitlab-ci/).

## Sources

- [Claude Code repository](https://github.com/anthropics/claude-code)
- [npm package `@anthropic-ai/claude-code`](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
