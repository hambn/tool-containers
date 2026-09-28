---
name: t3code
title: T3 Code
description: T3 Code, a web GUI for Codex, Claude Code, and other coding agents, served on port 3773 from the agentbloat image with every agent CLI installed.
upstream: https://github.com/pingdotgg/t3code
order: 7
images: [ghcr.io/hambn/t3code, docker.io/hambn/t3code]
keywords: [web gui, coding agents, agentbloat, codex, claude code, cursor, opencode]
---

# T3 Code

[T3 Code](https://github.com/pingdotgg/t3code) is a web GUI for coding agents. This image
adds it to [agentbloat](../agentbloat/), so Codex, Claude Code, Cursor, OpenCode, and
the other agent CLIs it drives are already installed. The entrypoint is
`t3 serve --host=0.0.0.0 --port=3773`, and the container starts in `/home/sysadmin` as
`sysadmin` (UID 1000). The recipes mount your project at `/workspace`. No credentials
are stored in the image.

- **Source:** [`tools/ai/t3code/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/t3code)
- **Docs:** [tool-containers.hgh.dev/docs/ai/t3code/](https://tool-containers.hgh.dev/docs/ai/t3code/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Pairing and access](#pairing-and-access)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here.
  - Base: [`agentbloat:ubuntu`](../agentbloat/)
  - Tags: `ubuntu`, `latest`, `t3code-<version>`
  - Included software: [T3 Code](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the recipes.
  - Base: [`agentbloat:ubuntu-browser`](../agentbloat/)
  - Tags: `ubuntu-browser`
  - Included software: [T3 Code](#included-software) and the [agentbloat CLIs](../agentbloat/#included-software)

There are no Alpine variants: upstream publishes only glibc builds of the `t3` binary,
which gcompat cannot run. The old `alpine` and `alpine-browser` tags are still in both
registries but are no longer rebuilt.

Pull `ghcr.io/hambn/t3code:<tag>` or `docker.io/hambn/t3code:<tag>`.
`t3code-<version>` names the npm release in the current `ubuntu` build. All tags move
when the image is rebuilt; pin a digest to keep one build.

## Included software

- **T3 Code**
  - Command: `t3`
  - Source: npm packages `t3` and `@t3code/t3-linux-<arch>`, version pinned in the [`Dockerfile`](./Dockerfile)

The agent CLIs and the devbox toolset come from
[agentbloat](../agentbloat/#included-software).

## Pairing and access

Each time the server starts, it prints a one-time token and a pairing URL. The URL
uses the container's own IP address, so from the host open
`http://127.0.0.1:3773/pair#token=<token>` instead. The token expires after five
minutes. For a new one, run this in the container:

```bash
t3 auth pairing create --base-url http://127.0.0.1:3773
```

After pairing, the browser keeps a session cookie. Sign in to each agent from the T3
Code UI.

T3 Code keeps its state in `/home/sysadmin/.t3`, and the agents keep their logins in
the same home directory. None of the recipes mount it, so both last only as long as the
container.

The Browser item in the web interface stays disabled: it needs the T3 Code desktop
client. The headless Chromium in `ubuntu-browser` is for command-line tools.

## Use cases

- **Local GUI over a checkout** with [Docker](./docs/docker/), including hosts that
  load the image from a saved tar.
- **Persistent local instance** with [Docker Compose](./docs/docker-compose/), with an
  air-gapped Compose file.
- **Rootless local instance** with [Podman](./docs/podman/).
- **Shared cluster instance** from plain manifests with [Kubernetes](./docs/kubernetes/)
  or from a Helm chart with [Helm](./docs/helm/).

## Sources

- [T3 Code repository](https://github.com/pingdotgg/t3code)
- [npm package `t3`](https://www.npmjs.com/package/t3)
