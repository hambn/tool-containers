---
name: pi-agent
title: Pi Coding Agent
description: Pi, a minimal and extensible terminal coding agent, on the devbox image with Ubuntu and Alpine variants and optional Chromium.
upstream: https://github.com/earendil-works/pi
order: 6
images: [ghcr.io/hambn/pi-agent, docker.io/hambn/pi-agent]
keywords: [terminal coding agent, earendil works, devbox, ubuntu, alpine, headless chromium]
---

# Pi Coding Agent

[Pi](https://github.com/earendil-works/pi), a small terminal coding agent that you extend
with your own tools and prompts, on the [devbox](../../base/devbox/) development image.
Pi works with Anthropic, OpenAI, Google, and other model providers. The entrypoint is
`pi`, and the container starts in `/workspace` as `sysadmin` (UID 1000). No credentials
are stored in the image.

- **Source:** [`tools/ai/pi-agent/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/pi-agent)
- **Docs:** [tool-containers.hgh.dev/docs/ai/pi-agent/](https://tool-containers.hgh.dev/docs/ai/pi-agent/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here, and the CI recipes use it.
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `pi-agent-<version>`
  - Included software: [Pi](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the local recipes.
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [Pi](#included-software) and the [devbox browser tier](../../base/devbox/#browser)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [Pi](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [Pi](#included-software) and the [devbox browser tier](../../base/devbox/#browser)

Pull `ghcr.io/hambn/pi-agent:<tag>` or `docker.io/hambn/pi-agent:<tag>`.
`pi-agent-<version>` names the Pi npm release in the current `ubuntu` build. All tags
move when the image is rebuilt; pin a digest to keep one build.

## Included software

- **Pi**
  - Command: `pi`
  - Source: npm package `@earendil-works/pi-coding-agent`, installed with
    `--ignore-scripts` and pinned in the [`Dockerfile`](./Dockerfile)

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

- [Pi repository](https://github.com/earendil-works/pi)
- [npm package `@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Pi documentation](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs)
- [Pi provider setup](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)
