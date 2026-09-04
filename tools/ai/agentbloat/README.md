# agentbloat

[`agentbloat`](https://github.com/hambn/tool-containers/tree/main/tools/ai/agentbloat) bundles the current command-line coding agents on top of the reusable [`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** (primary)
  - Contents: all agents, full Ubuntu toolset, headless Chromium
  - Base: `ghcr.io/hambn/agentimg:ubuntu-browser`
  - Moving tags: `latest`, `ubuntu-browser`
  - Agent update tags: `codex-v<version>`, `claude-code-v<version>`, etc.
- **`ubuntu`**
  - Contents: all agents and full Ubuntu toolset, no browser
  - Base: `ghcr.io/hambn/agentimg:ubuntu`
  - Moving tags: `ubuntu`
  - Agent update tags: primary-only tags are not repeated
- **`alpine-browser`**
  - Contents: all agents, Alpine toolset, Chromium
  - Base: `ghcr.io/hambn/agentimg:alpine-browser`
  - Moving tags: `alpine-browser`
  - Agent update tags: primary-only tags are not repeated
- **`alpine`**
  - Contents: all agents and Alpine toolset, no browser
  - Base: `ghcr.io/hambn/agentimg:alpine`
  - Moving tags: `alpine`
  - Agent update tags: primary-only tags are not repeated

Pull moving tags from `ghcr.io/hambn/agentbloat:<tag>` or
`docker.io/hambn/agentbloat:<tag>`. Source edits and `agentimg` base refreshes repoint
only moving tags. A scheduled agent release also repoints those tags and adds a version
tag to the primary `ubuntu-browser` image, such as `claude-code-v1.2.3`. See the
repository's [registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

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

- **Interactive multi-agent workspace** — [`examples/docker/`](./examples/docker/).
- **Repeatable local environment** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless host** — [`examples/podman/`](./examples/podman/).
- **Long-lived cluster workspace** — [`examples/kubernetes/`](./examples/kubernetes/) or [`examples/helm/`](./examples/helm/).
- **Shared development service** — [`examples/docker-swarm/`](./examples/docker-swarm/).

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
└── examples/
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
