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
| `ubuntu-browser` (primary) | Claude Code, Ubuntu tools, headless Chromium | `ghcr.io/hambn/agentimg:ubuntu-browser` | `latest`, `ubuntu-browser` | `claude-code-v<version>` |
| `ubuntu` | Claude Code and Ubuntu tools | `ghcr.io/hambn/agentimg:ubuntu` | `ubuntu` | primary-only tag is not repeated |
| `alpine-browser` | Claude Code, Alpine tools, Chromium | `ghcr.io/hambn/agentimg:alpine-browser` | `alpine-browser` | primary-only tag is not repeated |
| `alpine` | Claude Code and Alpine tools | `ghcr.io/hambn/agentimg:alpine` | `alpine` | primary-only tag is not repeated |

Pull moving tags from `ghcr.io/hambn/claude-code:<tag>` or
`docker.io/hambn/claude-code:<tag>`. A Claude Code npm release repoints all moving tags
and adds `claude-code-v<version>` to the primary image. `agentimg` base refreshes and repository
edits repoint moving tags only. See the repository's
[registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

Node.js, npm, and the common development/CI toolchain are inherited from `agentimg`;
the Claude Code images install only the Claude Code package. Runtime credentials remain
external to the image.


## Use cases

- **Interactive local coding** — [`examples/docker/`](./examples/docker/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless development** — [`examples/podman/`](./examples/podman/).
- **Cluster batch jobs** — [`examples/kubernetes/`](./examples/kubernetes/) or
  [`examples/helm/`](./examples/helm/).
- **Shared Swarm jobs** — [`examples/docker-swarm/`](./examples/docker-swarm/).

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
