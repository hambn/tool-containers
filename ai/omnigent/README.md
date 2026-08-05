# omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent) is an open-source AI agent
meta-harness packaged on the reusable [`agentbloat`](../agentbloat/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Contents | Base | Moving tags | Omnigent release tag |
|---------|----------|------|-------------|----------------------|
| `ubuntu-browser` (primary) | Omnigent, all agentbloat agents, Ubuntu tools, headless Chromium | `ghcr.io/hambn/agentbloat:ubuntu-browser` | `latest`, `ubuntu-browser` | `omnigent-v<version>` |
| `ubuntu` | Omnigent, all agentbloat agents, Ubuntu tools | `ghcr.io/hambn/agentbloat:ubuntu` | `ubuntu` | primary-only tag is not repeated |
| `alpine-browser` | Omnigent, all agentbloat agents, Alpine tools, Chromium | `ghcr.io/hambn/agentbloat:alpine-browser` | `alpine-browser` | primary-only tag is not repeated |
| `alpine` | Omnigent, all agentbloat agents, Alpine tools | `ghcr.io/hambn/agentbloat:alpine` | `alpine` | primary-only tag is not repeated |

Pull moving tags from `ghcr.io/hambn/omnigent:<tag>` or
`docker.io/hambn/omnigent:<tag>`. Omnigent releases repoint all moving tags and
add `omnigent-v<version>` to the primary image. `agentbloat` base refreshes and
repository edits repoint moving tags only. See the repository's
[registry and tag policy](../../.agents/references/repo/registries-and-tags.md).

Omnigent discovers credentials and harness logins at runtime. No credentials are
stored in the image or deployment files.

## Use cases

- **Interactive local orchestration** — [`deployment/docker/`](./deployment/docker/).
- **Repeatable local sessions** — [`deployment/docker-compose/`](./deployment/docker-compose/).
- **Rootless development** — [`deployment/podman/`](./deployment/podman/).

## File map

```text
omnigent/
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

CI is defined in [`.github/workflows/ai-omnigent.yml`](../../.github/workflows/ai-omnigent.yml).

## Sources

- [Omnigent source repository](https://github.com/omnigent-ai/omnigent)
- [Omnigent documentation](https://omnigent.ai/quickstart/install)
- [Omnigent package on PyPI](https://pypi.org/project/omnigent/)
- [agentbloat foundation](../agentbloat/)
