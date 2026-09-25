# agentbloat

Every current command-line coding agent in one interactive image, built on the [`devbox`](../../base/devbox/) development image. It starts a Zsh login shell and is also the base of [`omnigent`](../omnigent/) and [`t3code`](../t3code/).

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `ubuntu-browser` | [`devbox:ubuntu-browser`](../../base/devbox/) | All agent CLIs; Ubuntu, headless Chromium | `ubuntu-browser`, `latest`, `ubuntu-browser-<YYYYMMDD>-<sha7>` |
| `ubuntu` | [`devbox:ubuntu-full`](../../base/devbox/) | All agent CLIs; Ubuntu, no browser | `ubuntu`, `ubuntu-<YYYYMMDD>-<sha7>` |
| `alpine-browser` | [`devbox:alpine-browser`](../../base/devbox/) | All agent CLIs; Alpine, Chromium | `alpine-browser`, `alpine-browser-<YYYYMMDD>-<sha7>` |
| `alpine` | [`devbox:alpine-full`](../../base/devbox/) | All agent CLIs; Alpine, no browser | `alpine`, `alpine-<YYYYMMDD>-<sha7>` |

Pull from `ghcr.io/hambn/agentbloat:<tag>` or `docker.io/hambn/agentbloat:<tag>`.
agentbloat is a base image: moving variant tags (and `latest`) repoint on every rebuild, and `<variant>-<YYYYMMDD>-<sha7>` tags identify one build and are never repointed. Old per-agent tags such as `claude-code-v<version>` are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

Every variant pins and installs:

| CLI | Commands | Source |
|---|---|---|
| OpenAI Codex | `codex` | npm `@openai/codex` |
| Claude Code | `claude` | npm `@anthropic-ai/claude-code` |
| Cursor Agent | `cursor-agent`, `agent` | Cursor release tarball in `/opt/cursor-agent` |
| xAI Grok | `grok` | npm `@xai-official/grok` |
| OpenCode | `opencode` | npm `opencode-ai` |
| GitHub Copilot | `copilot` | npm `@github/copilot` |
| Gemini CLI | `gemini` | npm `@google/gemini-cli` |
| Pi | `pi` | npm `@earendil-works/pi-coding-agent` |
| ACP Agent | `acp-agent` | PyPI `acp-agent` in `/opt/uv-tools`, with `agent-client-protocol` held at a compatible release |

Pins live in [`versions.hcl`](../../versions.hcl) and are recorded as `io.github.hambn.containers.tool.<name>.version` image labels. Cursor publishes no checksum for its tarball, so that download is pinned by version only. Everything else — Git, GitHub/GitLab CLIs, Docker tooling, Python, Go, Node.js, and the optional browser — comes from [`devbox`](../../base/devbox/).

## Use cases

- **Interactive multi-agent workspace** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local environment** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Long-lived cluster workspace** — [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).

## File map

- [`Dockerfile`](./Dockerfile)
- [`README.md`](./README.md)
- [`examples/`](./examples/)
  - [`docker-compose/`](./examples/docker-compose/)
    - [`README.md`](./examples/docker-compose/README.md)
    - [`airgapped.docker-compose.yml`](./examples/docker-compose/airgapped.docker-compose.yml)
    - [`compose.sh`](./examples/docker-compose/compose.sh)
    - [`docker-compose.yml`](./examples/docker-compose/docker-compose.yml)
  - [`docker/`](./examples/docker/)
    - [`README.md`](./examples/docker/README.md)
    - [`airgapped.run.sh`](./examples/docker/airgapped.run.sh)
    - [`run.sh`](./examples/docker/run.sh)
  - [`helm/`](./examples/helm/)
    - [`chart/`](./examples/helm/chart/)
      - [`templates/`](./examples/helm/chart/templates/)
        - [`deployment.yaml`](./examples/helm/chart/templates/deployment.yaml)
      - [`Chart.yaml`](./examples/helm/chart/Chart.yaml)
      - [`values.yaml`](./examples/helm/chart/values.yaml)
    - [`README.md`](./examples/helm/README.md)
  - [`kubernetes/`](./examples/kubernetes/)
    - [`README.md`](./examples/kubernetes/README.md)
    - [`deployment.yaml`](./examples/kubernetes/deployment.yaml)
  - [`podman/`](./examples/podman/)
    - [`README.md`](./examples/podman/README.md)
    - [`run.sh`](./examples/podman/run.sh)
- [`tests/`](./tests/)
  - [`structure-alpine.yaml`](./tests/structure-alpine.yaml)
  - [`structure.yaml`](./tests/structure.yaml)
- [`.github/workflows/images.yml`](../../../../.github/workflows/images.yml) — builds, tests, and publishes every variant

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
