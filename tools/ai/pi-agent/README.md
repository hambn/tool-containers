---
name: pi-agent
title: Pi Coding Agent
description: Pi, a minimal and extensible terminal coding agent, on the devbox image with Ubuntu and Alpine variants and optional Chromium.
upstream: https://github.com/earendil-works/pi
order: 6
images: [ghcr.io/hambn/pi-agent, docker.io/hambn/pi-agent]
keywords: [terminal coding agent, earendil works, devbox, ubuntu, alpine, headless chromium]
---

# pi-agent

[Pi](https://github.com/earendil-works/pi), a minimal, extensible terminal coding agent, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `pi`.

- **Source:** [`tools/ai/pi-agent/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/pi-agent)
- **Docs:** [tool-containers.hgh.dev/docs/ai/pi-agent/](https://tool-containers.hgh.dev/docs/ai/pi-agent/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Pi coding agent; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [pi-agent](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Pi coding agent; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `pi-agent-<version>`
  - Included software: [pi-agent](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Pi coding agent; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [pi-agent](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Pi coding agent; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [pi-agent](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/pi-agent:<tag>` or `docker.io/hambn/pi-agent:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant), which also carries `pi-agent-<version>` for the pinned Pi npm release. Every tag moves on each rebuild; pin a digest for reproducibility. Earlier `<version>-<variant>` and `<version>` tags are no longer published. The old `pi-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

- **Pi coding agent**
  - Commands: `pi`
  - Source: npm `@earendil-works/pi-coding-agent`, installed with `--ignore-scripts`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Interactive coding on a local checkout** — [`docs/docker/`](./docs/docker/).
- **Rootless sessions on a workstation** — [`docs/podman/`](./docs/podman/).
- **Repeatable local sessions** — [`docs/docker-compose/`](./docs/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`docs/docker/`](./docs/docker/) and [`docs/docker-compose/`](./docs/docker-compose/).
- **Code review in CI** — GitHub Actions in [`docs/github-actions/`](./docs/github-actions/) or GitLab CI in [`docs/gitlab-ci/`](./docs/gitlab-ci/).

## Sources

- [Pi repository](https://github.com/earendil-works/pi)
- [npm package `@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Pi documentation](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs)
