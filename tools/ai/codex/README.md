# codex

[OpenAI Codex CLI](https://github.com/openai/codex) packaged on the reusable
[`agentimg`](../../base/agentimg/) foundations.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** (primary)
  - Contents: Codex, Ubuntu tools, headless Chromium
  - Base: `ghcr.io/hambn/agentimg:ubuntu-browser`
  - Moving tags: `latest`, `ubuntu-browser`
  - Codex release tag: `codex-v<version>`
- **`ubuntu`**
  - Contents: Codex and Ubuntu tools
  - Base: `ghcr.io/hambn/agentimg:ubuntu`
  - Moving tags: `ubuntu`
  - Codex release tag: primary-only tag is not repeated
- **`alpine-browser`**
  - Contents: Codex, Alpine tools, Chromium
  - Base: `ghcr.io/hambn/agentimg:alpine-browser`
  - Moving tags: `alpine-browser`
  - Codex release tag: primary-only tag is not repeated
- **`alpine`**
  - Contents: Codex and Alpine tools
  - Base: `ghcr.io/hambn/agentimg:alpine`
  - Moving tags: `alpine`
  - Codex release tag: primary-only tag is not repeated

Pull moving tags from `ghcr.io/hambn/codex:<tag>` or
`docker.io/hambn/codex:<tag>`. A Codex npm release repoints all moving tags and adds
`codex-v<version>` to the primary image. `agentimg` base refreshes and repository edits
repoint moving tags only. See the repository's [registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

The deployment examples require `OPENAI_API_KEY` at runtime; credentials are not baked
into the image.

## Use cases

- **Interactive local coding** — [`examples/docker/`](./examples/docker/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Rootless development** — [`examples/podman/`](./examples/podman/).

## File map

```text
codex/
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

CI is defined in [`.github/workflows/ai-codex.yml`](../../../.github/workflows/ai-codex.yml).

## Sources

- [OpenAI Codex CLI source repository](https://github.com/openai/codex)
- [OpenAI Codex npm package](https://www.npmjs.com/package/@openai/codex)
- [Codex documentation](https://developers.openai.com/codex/)
- [agentimg foundation](../../base/agentimg/)
