# claude-code

[Claude Code](https://github.com/anthropics/claude-code) packaged on the reusable
[`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Contents | Base | Moving tags | Claude Code release tag |
|---------|----------|------|-------------|-------------------------|
| `ubuntu-browser` (primary) | Claude Code, Ubuntu tools, headless Chromium | `ghcr.io/hambn/agentimg:ubuntu-browser` | `latest`, `ubuntu-browser` | `cc-v<version>` |
| `ubuntu` | Claude Code and Ubuntu tools | `ghcr.io/hambn/agentimg:ubuntu` | `ubuntu` | primary-only tag is not repeated |
| `alpine-browser` | Claude Code, Alpine tools, Chromium | `ghcr.io/hambn/agentimg:alpine-browser` | `alpine-browser` | primary-only tag is not repeated |
| `alpine` | Claude Code and Alpine tools | `ghcr.io/hambn/agentimg:alpine` | `alpine` | primary-only tag is not repeated |

Pull moving tags from `ghcr.io/hambn/claude-code:<tag>` or
`docker.io/hambn/claude-code:<tag>`. A Claude Code npm release repoints all moving tags
and adds `cc-v<version>` to the primary image. `agentimg` base refreshes and repository
edits repoint moving tags only. See the repository's
[registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

Node.js, npm, and the common development/CI toolchain are inherited from `agentimg`;
the Claude Code images install only the Claude Code package. Runtime credentials remain
external to the image.


## Use cases

- **Interactive local coding** — [`deployment/docker/`](./deployment/docker/).
- **Repeatable local sessions** — [`deployment/docker-compose/`](./deployment/docker-compose/).
- **Rootless development** — [`deployment/podman/`](./deployment/podman/).
- **Cluster batch jobs** — [`deployment/kubernetes/`](./deployment/kubernetes/) or
  [`deployment/helm/`](./deployment/helm/).
- **Shared Swarm jobs** — [`deployment/docker-swarm/`](./deployment/docker-swarm/).

## File map

```text
claude-code/
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
    │       ├── templates/job.yaml
    │       └── values.yaml
    ├── kubernetes/
    │   ├── README.md
    │   └── job.yaml
    └── podman/
        ├── README.md
        └── run.sh
```

CI is defined in [`.github/workflows/ai-claude-code.yml`](../../../.github/workflows/ai-claude-code.yml).

## Sources

- [Claude Code source repository](https://github.com/anthropics/claude-code)
- [Claude Code npm package](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
- [agentimg foundation](../../base/agentimg/)
