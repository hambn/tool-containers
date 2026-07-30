# pi-agent

[Pi](https://github.com/earendil-works/pi) is a minimal, extensible terminal coding
agent packaged on the reusable [`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Contents | Base | Moving tags | Pi release tag |
|---------|----------|------|-------------|----------------|
| `ubuntu-browser` (primary) | Pi, Ubuntu tools, headless Chromium | `ghcr.io/hambn/agentimg:ubuntu-browser` | `latest`, `ubuntu-browser` | `pi-v<version>` |
| `ubuntu` | Pi and Ubuntu tools | `ghcr.io/hambn/agentimg:ubuntu` | `ubuntu` | primary-only tag is not repeated |
| `alpine-browser` | Pi, Alpine tools, Chromium | `ghcr.io/hambn/agentimg:alpine-browser` | `alpine-browser` | primary-only tag is not repeated |
| `alpine` | Pi and Alpine tools | `ghcr.io/hambn/agentimg:alpine` | `alpine` | primary-only tag is not repeated |

Pull moving tags from `ghcr.io/hambn/pi-agent:<tag>` or
`docker.io/hambn/pi-agent:<tag>`. Pi package updates repoint all moving tags and add
`pi-v<version>` to the primary image. `agentimg` base refreshes and repository edits
repoint moving tags only. See the repository's [registry and tag policy](../../.agents/references/repo/registries-and-tags.md).

Pi can authenticate through its provider login flow or supported runtime API-key
environment variables. No credentials are stored in the image or deployment files.

## Use cases

- **Interactive local coding** — [`deployment/docker/`](./deployment/docker/).
- **Repeatable local sessions** — [`deployment/docker-compose/`](./deployment/docker-compose/).
- **Rootless development** — [`deployment/podman/`](./deployment/podman/).

## File map

```text
pi-agent/
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
    └── podman/
        ├── README.md
        └── run.sh
```

CI is defined in [`.github/workflows/ai-pi-agent.yml`](../../.github/workflows/ai-pi-agent.yml).

## Sources

- [Pi source repository](https://github.com/earendil-works/pi)
- [Pi npm package](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Pi documentation](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs)
- [agentimg foundation](../../base/agentimg/)
