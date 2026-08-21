# agentbloat

[`agentbloat`](https://github.com/hambn/tool-containers/tree/main/images/ai/agentbloat) bundles the current command-line coding agents on top of the reusable [`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Contents | Base | Moving tags | Agent update tags |
|---------|----------|------|-------------|-------------------|
| `ubuntu-browser` (primary) | all agents, full Ubuntu toolset, headless Chromium | `ghcr.io/hambn/agentimg:ubuntu-browser` | `latest`, `ubuntu-browser` | `codex-v<version>`, `claude-code-v<version>`, etc. |
| `ubuntu` | all agents and full Ubuntu toolset, no browser | `ghcr.io/hambn/agentimg:ubuntu` | `ubuntu` | primary-only tags are not repeated |
| `alpine-browser` | all agents, Alpine toolset, Chromium | `ghcr.io/hambn/agentimg:alpine-browser` | `alpine-browser` | primary-only tags are not repeated |
| `alpine` | all agents and Alpine toolset, no browser | `ghcr.io/hambn/agentimg:alpine` | `alpine` | primary-only tags are not repeated |

Pull moving tags from `ghcr.io/hambn/agentbloat:<tag>` or
`docker.io/hambn/agentbloat:<tag>`. Source edits and `agentimg` base refreshes repoint
only moving tags. A scheduled agent release also repoints those tags and adds a version
tag to the primary `ubuntu-browser` image, such as `claude-code-v1.2.3`.

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

The inherited `agentimg` inventory also provides Git/GitHub/GitLab CLIs, Docker tooling,
Python, Go, shell tools, and optional browser support. Credentials are intentionally
configured at runtime through each upstream tool's supported login flow or environment
variables.

## Use cases

- **Interactive multi-agent workspace** — [`deployment/docker/`](./deployment/docker/).
- **Repeatable local environment** — [`deployment/docker-compose/`](./deployment/docker-compose/).
- **Rootless host** — [`deployment/podman/`](./deployment/podman/).
- **Long-lived cluster workspace** — [`deployment/kubernetes/`](./deployment/kubernetes/) or [`deployment/helm/`](./deployment/helm/).
- **Shared development service** — [`deployment/docker-swarm/`](./deployment/docker-swarm/).

## File map

```text
agentbloat/
├── README.md
├── images/
│   ├── alpine/
│   │   └── Dockerfile
│   ├── alpine-browser/
│   │   └── Dockerfile
│   ├── ubuntu/
│   │   └── Dockerfile
│   └── ubuntu-browser/
│       └── Dockerfile
└── deployment/
    ├── docker/
    │   ├── README.md
    │   ├── airgapped.run.sh
    │   └── run.sh
    ├── docker-compose/
    │   ├── README.md
    │   ├── airgapped.docker-compose.yml
    │   └── docker-compose.yml
    ├── docker-swarm/
    │   ├── README.md
    │   └── stack.yml
    ├── helm/
    │   ├── README.md
    │   └── chart/
    │       ├── Chart.yaml
    │       ├── templates/deployment.yaml
    │       └── values.yaml
    ├── kubernetes/
    │   ├── README.md
    │   └── deployment.yaml
    └── podman/
        ├── README.md
        └── run.sh
```

CI is defined in [`.github/workflows/ai-agentbloat.yml`](../../../.github/workflows/ai-agentbloat.yml).

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
- [agentimg foundation](../../base/agentimg/)
