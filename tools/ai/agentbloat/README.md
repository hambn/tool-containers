# agentbloat

Every current command-line coding agent in one interactive image, built on the [`devbox`](../../base/devbox/) development image. It starts a Zsh login shell and is also the base of [`omnigent`](../omnigent/) and [`t3code`](../t3code/).

- **Source:** [`tools/ai/agentbloat/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/agentbloat)
- **Docs:** [tool-containers.hgh.dev/docs/ai/agentbloat/](https://tool-containers.hgh.dev/docs/ai/agentbloat/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — All agent CLIs; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [agent CLIs](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — All agent CLIs; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`
  - Included software: [agent CLIs](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — All agent CLIs; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [agent CLIs](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — All agent CLIs; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [agent CLIs](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/agentbloat:<tag>` or `docker.io/hambn/agentbloat:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant); every tag moves on each rebuild. Pin a digest for reproducibility. Earlier dated `<variant>-<YYYYMMDD>-<sha7>` tags are no longer published. Old per-agent tags such as `claude-code-v<version>` are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

Every variant pins and installs:

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
  - Source: PyPI `acp-agent` in `/opt/uv-tools`, with `agent-client-protocol` held at a compatible release

Pins live in the [`Dockerfile`](./Dockerfile) `ARG` defaults and are recorded as `io.github.hambn.containers.tool.<name>.version` image labels. Cursor publishes no checksum for its tarball, so that download is pinned by version only. Everything else — Git, GitHub/GitLab CLIs, Docker tooling, Python, Go, Node.js, and the optional browser — comes from [`devbox`](../../base/devbox/).

## Use cases

- **Interactive multi-agent workspace** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local environment** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Long-lived cluster workspace** — [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).

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
