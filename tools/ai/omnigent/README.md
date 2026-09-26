# omnigent

[Omnigent](https://github.com/omnigent-ai/omnigent), an open-source AI agent meta-harness, on the [`agentbloat`](../agentbloat/) image so every bundled agent CLI is available to it. The entrypoint is `omnigent`.

- **Source:** [`tools/ai/omnigent/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/omnigent)
- **Docs:** [tool-containers.hgh.dev/docs/ai/omnigent/](https://tool-containers.hgh.dev/docs/ai/omnigent/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Omnigent plus every agentbloat CLI; Ubuntu, headless Chromium
  - Base: [`agentbloat:ubuntu-browser`](../agentbloat/)
  - Tags: `ubuntu-browser`
  - Included software: [omnigent](#included-software) + [agentbloat](../agentbloat/#included-software)
- **`ubuntu`** — Omnigent plus every agentbloat CLI; Ubuntu, no browser
  - Base: [`agentbloat:ubuntu`](../agentbloat/)
  - Tags: `ubuntu`, `latest`, `omnigent-<version>`
  - Included software: [omnigent](#included-software) + [agentbloat](../agentbloat/#included-software)
- **`alpine-browser`** — Omnigent plus every agentbloat CLI; Alpine, Chromium
  - Base: [`agentbloat:alpine-browser`](../agentbloat/)
  - Tags: `alpine-browser`
  - Included software: [omnigent](#included-software) + [agentbloat](../agentbloat/#included-software)
- **`alpine`** — Omnigent plus every agentbloat CLI; Alpine, no browser
  - Base: [`agentbloat:alpine`](../agentbloat/)
  - Tags: `alpine`
  - Included software: [omnigent](#included-software) + [agentbloat](../agentbloat/#included-software)

Pull from `ghcr.io/hambn/omnigent:<tag>` or `docker.io/hambn/omnigent:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant), which also carries `omnigent-<version>` for the pinned Omnigent PyPI release. Every tag moves on each rebuild; pin a digest for reproducibility. Earlier `<version>-<variant>` and `<version>` tags are no longer published. The old `omnigent-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in. Omnigent lives in a uv tool environment under `/opt/uv-tools/omnigent` with `omni` and `omnigent` launchers in `/usr/local/bin`, usable by any UID. On Alpine its `google-re2` dependency is compiled in a separate build stage, so only the `re2` runtime library ships in the image.

## Included software

- **Omnigent**
  - Commands: `omni`, `omnigent`
  - Source: PyPI `omnigent` in `/opt/uv-tools/omnigent`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [agentbloat](../agentbloat/#included-software): every agent CLI plus the devbox toolset

## Use cases

- **Orchestrate agents over a local checkout** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [Omnigent repository](https://github.com/omnigent-ai/omnigent)
- [PyPI package `omnigent`](https://pypi.org/project/omnigent/)
- [Omnigent documentation](https://omnigent.ai/quickstart/install)
