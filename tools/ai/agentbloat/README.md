# agentbloat

[`agentbloat`](https://github.com/hambn/tool-containers/tree/main/tools/ai/agentbloat) bundles the current command-line coding agents on top of the reusable [`workspace`](../../dev/workspace/) foundations.

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

Pull from `ghcr.io/hambn/agentbloat:<tag>` or `docker.io/hambn/agentbloat:<tag>`.
Moving tags name the tested operating-system profile. Each successful build also has an immutable `<profile>-b<run-id>-<attempt>` tag. Pin a digest for deployments.

| Tag | Contents | Base |
|---|---|---|
| `ubuntu-24.04` | agentbloat on Ubuntu 24.04 | `workspace:ubuntu-24.04-core` |
| `ubuntu-24.04-browser` | Agent bundle and headless Chromium | `agentbloat:ubuntu-24.04` |

## Included software


Every variant installs the latest resolved versions of:

- OpenAI Codex CLI (`codex`)
- Claude Code (`claude`)
- Cursor Agent (`agent` and `cursor-agent`)
- xAI Grok CLI (`grok`)
- OpenCode (`opencode`)
- GitHub Copilot CLI (`copilot`)
- Gemini CLI (`gemini`)
- Pi coding agent (`pi`)
- `acp-agent`, a CLI for browsing, searching, and running agents from the official ACP Registry

The neutral workspace core provides Git, Bash, Python, Go, Node.js, and uv. The browser profile adds headless Chromium. Credentials are intentionally
configured at runtime through each upstream tool's supported login flow or environment
variables.

## Use cases

- **Interactive multi-agent workspace** — [`examples/docker/`](./examples/docker/).
- **Repeatable local environment** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless host** — [`examples/podman/`](./examples/podman/).
- **Long-lived cluster workspace** — [`examples/kubernetes/`](./examples/kubernetes/) or [`examples/helm/`](./examples/helm/).
- **Shared development service** — [`examples/docker-swarm/`](./examples/docker-swarm/).

## File map

- [`examples/`](examples/)
  - [`docker/`](examples/docker/)
    - [`README.md`](examples/docker/README.md)
    - [`airgapped.run.sh`](examples/docker/airgapped.run.sh)
    - [`run.sh`](examples/docker/run.sh)
  - [`docker-compose/`](examples/docker-compose/)
    - [`README.md`](examples/docker-compose/README.md)
    - [`airgapped.docker-compose.yml`](examples/docker-compose/airgapped.docker-compose.yml)
    - [`compose.sh`](examples/docker-compose/compose.sh)
    - [`docker-compose.yml`](examples/docker-compose/docker-compose.yml)
  - [`docker-swarm/`](examples/docker-swarm/)
    - [`README.md`](examples/docker-swarm/README.md)
    - [`stack.yml`](examples/docker-swarm/stack.yml)
  - [`helm/`](examples/helm/)
    - [`chart/`](examples/helm/chart/)
      - [`templates/`](examples/helm/chart/templates/)
        - [`deployment.yaml`](examples/helm/chart/templates/deployment.yaml)
      - [`Chart.yaml`](examples/helm/chart/Chart.yaml)
      - [`values.yaml`](examples/helm/chart/values.yaml)
    - [`README.md`](examples/helm/README.md)
  - [`kubernetes/`](examples/kubernetes/)
    - [`README.md`](examples/kubernetes/README.md)
    - [`deployment.yaml`](examples/kubernetes/deployment.yaml)
  - [`podman/`](examples/podman/)
    - [`README.md`](examples/podman/README.md)
    - [`run.sh`](examples/podman/run.sh)
- [`images/`](images/)
  - [`ubuntu-24.04/`](images/ubuntu-24.04/)
    - [`Dockerfile`](images/ubuntu-24.04/Dockerfile)
  - [`ubuntu-24.04-browser/`](images/ubuntu-24.04-browser/)
    - [`Dockerfile`](images/ubuntu-24.04-browser/Dockerfile)
- [`README.md`](README.md)
- [Shared image publisher](../../../.github/workflows/publish-images.yml)

## Sources

- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Claude Code](https://github.com/anthropics/claude-code)
- [Cursor CLI](https://docs.cursor.com/en/cli/installation)
- [xAI Grok CLI package](https://www.npmjs.com/package/@xai-official/grok)
- [OpenCode](https://opencode.ai)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli)
- [Gemini CLI](https://github.com/google-gemini/gemini-cli)
- [ACP Registry](https://agentclientprotocol.com/get-started/registry)
- [ACP Agent CLI](https://pypi.org/project/acp-agent/)
- [Pi coding agent](https://github.com/earendil-works/pi)
- [workspace foundation](../../dev/workspace/)
