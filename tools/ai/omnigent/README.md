---
name: omnigent
title: Omnigent
description: Omnigent, the open-source meta-harness that runs Claude Code, Codex, Pi and other agents in one session, on the agentbloat image with every CLI.
upstream: https://github.com/omnigent-ai/omnigent
order: 4
images: [ghcr.io/hambn/omnigent, docker.io/hambn/omnigent]
keywords: [agent meta-harness, multi-agent, agent orchestration, coding agents, agentbloat]
---

# Omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent) is an open-source meta-harness: one
session can drive Claude Code, Codex, Pi, OpenCode and other agents. This image adds it
to [agentbloat](../agentbloat/), so the agent CLIs it launches are already installed.
The entrypoint is `omnigent`, and the container starts in `/workspace` as `sysadmin`
(UID 1000). No credentials are stored in the image.

- **Source:** [`tools/ai/omnigent/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/omnigent)
- **Docs:** [tool-containers.hgh.dev/docs/ai/omnigent/](https://tool-containers.hgh.dev/docs/ai/omnigent/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here.
  - Base: [`agentbloat:ubuntu`](../agentbloat/)
  - Tags: `ubuntu`, `latest`, `omnigent-<version>`
  - Included software: [Omnigent](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the recipes.
  - Base: [`agentbloat:ubuntu-browser`](../agentbloat/)
  - Tags: `ubuntu-browser`
  - Included software: [Omnigent](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`agentbloat:alpine`](../agentbloat/)
  - Tags: `alpine`
  - Included software: [Omnigent](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`agentbloat:alpine-browser`](../agentbloat/)
  - Tags: `alpine-browser`
  - Included software: [Omnigent](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)

Pull `ghcr.io/hambn/omnigent:<tag>` or `docker.io/hambn/omnigent:<tag>`.
`omnigent-<version>` names the PyPI release in the current `ubuntu` build. All tags
move when the image is rebuilt; pin a digest to keep one build.

## Included software

- **Omnigent**
  - Commands: `omnigent`, `omni`
  - Source: PyPI package `omnigent`, version pinned in the [`Dockerfile`](./Dockerfile)

Omnigent is installed as a uv tool in `/opt/uv-tools/omnigent`, with its launchers in
`/usr/local/bin` so any UID can run them. On Alpine, its `google-re2` dependency is
compiled in a build stage and only the `re2` runtime library ships. The agent CLIs come
from [agentbloat](../agentbloat/#included-software); tmux and bubblewrap, which
Omnigent's terminal wrappers use, come from the [devbox full tier](../../base/devbox/#full).

## Use cases

- **Orchestrate agents over a local checkout** with [Docker](./docs/docker/), including
  hosts that load the image from a saved tar.
- **Repeatable local orchestration sessions** with
  [Docker Compose](./docs/docker-compose/), with an air-gapped Compose file.
- **Rootless agent orchestration on a workstation** with [Podman](./docs/podman/).

## Sources

- [Omnigent repository](https://github.com/omnigent-ai/omnigent)
- [PyPI package `omnigent`](https://pypi.org/project/omnigent/)
- [Omnigent install guide](https://omnigent.ai/quickstart/install)
