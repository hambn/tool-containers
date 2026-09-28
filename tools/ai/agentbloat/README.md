---
name: agentbloat
title: agentbloat
description: Codex, Claude Code, Cursor Agent, Gemini CLI, Copilot, and three more coding-agent CLIs in one interactive devbox shell, for Ubuntu or Alpine.
order: 1
images: [ghcr.io/hambn/agentbloat, docker.io/hambn/agentbloat]
keywords: [coding agents, codex, claude code, cursor agent, gemini cli, github copilot, opencode, grok]
---

# agentbloat

Eight command-line coding agents in one interactive image, built on the
[devbox](../../base/devbox/) development image, for trying agents side by side or
switching between them in one project. It is also the base of [Omnigent](../omnigent/)
and [T3 Code](../t3code/). The image starts a Zsh login shell in `/home/sysadmin` as
`sysadmin` (UID 1000); the recipes mount your project at `/workspace`. No credentials
are stored in the image.

- **Source:** [`tools/ai/agentbloat/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/agentbloat)
- **Docs:** [tool-containers.hgh.dev/docs/ai/agentbloat/](https://tool-containers.hgh.dev/docs/ai/agentbloat/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu`**: Ubuntu 24.04 without a browser. `latest` points here.
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`
  - Included software: [agent CLIs](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`ubuntu-browser`**: Ubuntu 24.04 with headless Chromium, the default in the recipes.
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [agent CLIs](#included-software) and the [devbox browser tier](../../base/devbox/#browser)
- **`alpine`**: Alpine 3.24 without a browser.
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [agent CLIs](#included-software) and the [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`**: Alpine 3.24 with Chromium.
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [agent CLIs](#included-software) and the [devbox browser tier](../../base/devbox/#browser)

Pull `ghcr.io/hambn/agentbloat:<tag>` or `docker.io/hambn/agentbloat:<tag>`. agentbloat
has no version tag, because it bundles several tools. All tags move when the image is
rebuilt; pin a digest to keep one build.

## Included software

Every variant installs the same versions, pinned in the [`Dockerfile`](./Dockerfile):

- **OpenAI Codex**
  - Commands: `codex`
  - Source: npm `@openai/codex`
- **Claude Code**
  - Commands: `claude`
  - Source: npm `@anthropic-ai/claude-code`
- **Cursor Agent**
  - Commands: `cursor-agent`, `agent`
  - Source: Cursor release tarball in `/opt/cursor-agent`
- **xAI Grok**
  - Commands: `grok`
  - Source: npm `@xai-official/grok`
- **OpenCode**
  - Commands: `opencode`
  - Source: npm `opencode-ai`
- **GitHub Copilot**
  - Commands: `copilot`
  - Source: npm `@github/copilot`
- **Gemini CLI**
  - Commands: `gemini`
  - Source: npm `@google/gemini-cli`
- **Pi**
  - Commands: `pi`
  - Source: npm `@earendil-works/pi-coding-agent`
- **ACP Agent**
  - Commands: `acp-agent`
  - Source: PyPI `acp-agent` in `/opt/uv-tools`, with `agent-client-protocol` held at a release compatible with the distro Python packages

Cursor publishes no checksum for its tarball, so that download is pinned by version
only. Git, the GitHub and GitLab CLIs, the Docker CLI, Python, Go, and Node.js come
from the [devbox full tier](../../base/devbox/#full); the `*-browser` variants add the
[browser tier](../../base/devbox/#browser).

## Use cases

- **Interactive multi-agent workspace** with [Docker](./docs/docker/).
- **Repeatable local multi-agent workspace** with
  [Docker Compose](./docs/docker-compose/).
- **Rootless multi-agent workstation** with [Podman](./docs/podman/).
- **Long-lived cluster workspace** from plain manifests with
  [Kubernetes](./docs/kubernetes/) or from a Helm chart with [Helm](./docs/helm/).
- **Multi-agent workspace inside the editor** with
  [Dev Container](./docs/devcontainer/).

## Sources

- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Claude Code](https://github.com/anthropics/claude-code)
- [Cursor CLI](https://docs.cursor.com/en/cli/installation)
- [xAI Grok CLI package](https://www.npmjs.com/package/@xai-official/grok)
- [OpenCode](https://opencode.ai)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [Pi coding agent](https://github.com/earendil-works/pi)
- [ACP Agent CLI](https://pypi.org/project/acp-agent/) and the [ACP Registry](https://agentclientprotocol.com/get-started/registry)
