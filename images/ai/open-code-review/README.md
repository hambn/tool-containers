# open-code-review

[`Open Code Review`](https://github.com/alibaba/open-code-review) is Alibaba's AI-powered code review CLI, packaged on the reusable [`agentimg`](../../base/agentimg/) images.

## Contents

- [Images](#images)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** (primary)
  - Contents: OCR, Ubuntu tools, headless Chromium
  - Base: `ghcr.io/hambn/agentimg:ubuntu-browser`
  - Moving tags: `latest`, `ubuntu-browser`
  - OCR release tag: `ocr-v<version>`
- **`ubuntu`**
  - Contents: OCR, Ubuntu tools
  - Base: `ghcr.io/hambn/agentimg:ubuntu`
  - Moving tags: `ubuntu`
  - OCR release tag: primary-only tag is not repeated
- **`alpine-browser`**
  - Contents: OCR, Alpine tools, Chromium
  - Base: `ghcr.io/hambn/agentimg:alpine-browser`
  - Moving tags: `alpine-browser`
  - OCR release tag: primary-only tag is not repeated
- **`alpine`**
  - Contents: OCR, Alpine tools
  - Base: `ghcr.io/hambn/agentimg:alpine`
  - Moving tags: `alpine`
  - OCR release tag: primary-only tag is not repeated

Pull moving tags from `ghcr.io/hambn/open-code-review:<tag>` or
`docker.io/hambn/open-code-review:<tag>`. OCR package updates repoint all moving tags
and add `ocr-v<version>` to the primary image. `agentimg` base refreshes and source edits
repoint moving tags only. See the repository's [registry and tag policy](../../../.agents/skills/container-images/references/registries-and-tags.md).

## Use cases

- **Review the current workspace** — [`examples/docker/`](./examples/docker/) with `./run.sh review`.
- **Repeatable local reviews** — [`examples/docker-compose/`](./examples/docker-compose/) with `docker compose run --rm open-code-review review`.
- **Rootless review environment** — [`examples/podman/`](./examples/podman/) with `./run.sh review`.

The CLI reads the mounted repository and requires an LLM provider configured through its
supported `ocr config` flow or runtime environment variables. No credentials are stored
in the image or deployment files.

## File map

```text
open-code-review/
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

CI is defined in [`.github/workflows/ai-open-code-review.yml`](../../../.github/workflows/ai-open-code-review.yml).

## Sources

- [Open Code Review source repository](https://github.com/alibaba/open-code-review)
- [Open Code Review npm package](https://www.npmjs.com/package/@alibaba-group/open-code-review)
- [Open Code Review documentation](https://open-codereview.ai/docs)
- [agentimg foundation](../../base/agentimg/)
