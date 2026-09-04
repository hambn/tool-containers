# omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent) is an open-source AI agent
meta-harness packaged on the reusable [`agentbloat`](../agentbloat/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** (primary)
  - Contents: Omnigent, all agentbloat agents, Ubuntu tools, headless Chromium
  - Base: `ghcr.io/hambn/agentbloat:ubuntu-browser`
  - Moving tags: `latest`, `ubuntu-browser`
  - Omnigent release tag: `omnigent-v<version>`
- **`ubuntu`**
  - Contents: Omnigent, all agentbloat agents, Ubuntu tools
  - Base: `ghcr.io/hambn/agentbloat:ubuntu`
  - Moving tags: `ubuntu`
  - Omnigent release tag: primary-only tag is not repeated
- **`alpine-browser`**
  - Contents: Omnigent, all agentbloat agents, Alpine tools, Chromium
  - Base: `ghcr.io/hambn/agentbloat:alpine-browser`
  - Moving tags: `alpine-browser`
  - Omnigent release tag: primary-only tag is not repeated
- **`alpine`**
  - Contents: Omnigent, all agentbloat agents, Alpine tools
  - Base: `ghcr.io/hambn/agentbloat:alpine`
  - Moving tags: `alpine`
  - Omnigent release tag: primary-only tag is not repeated

Pull moving tags from `ghcr.io/hambn/omnigent:<tag>` or
`docker.io/hambn/omnigent:<tag>`. Omnigent releases repoint all moving tags and
add `omnigent-v<version>` to the primary image. `agentbloat` base refreshes and
repository edits repoint moving tags only. See the repository's
[registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

Omnigent discovers credentials and harness logins at runtime. No credentials are
stored in the image or deployment files.

## Use cases

- **Interactive local orchestration** — [`examples/docker/`](./examples/docker/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless development** — [`examples/podman/`](./examples/podman/).

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
└── examples/
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

CI is defined in [`.github/workflows/ai-omnigent.yml`](../../../.github/workflows/ai-omnigent.yml).

## Sources

- [Omnigent source repository](https://github.com/omnigent-ai/omnigent)
- [Omnigent documentation](https://omnigent.ai/quickstart/install)
- [Omnigent package on PyPI](https://pypi.org/project/omnigent/)
- [agentbloat foundation](../agentbloat/)
