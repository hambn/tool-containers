# claude-code

[Claude Code](https://github.com/anthropics/claude-code), Anthropic's coding agent CLI, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `claude`.

- **Source:** [`tools/ai/claude-code/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/claude-code)
- **Docs:** [tool-containers.hgh.dev/docs/ai/claude-code/](https://tool-containers.hgh.dev/docs/ai/claude-code/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Claude Code; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`
  - Included software: [claude-code](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Claude Code; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `latest`, `claude-code-<version>`
  - Included software: [claude-code](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Claude Code; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`
  - Included software: [claude-code](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Claude Code; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`
  - Included software: [claude-code](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/claude-code:<tag>` or `docker.io/hambn/claude-code:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant), which also carries `claude-code-<version>` for the pinned Claude Code npm release. Every tag moves on each rebuild; pin a digest for reproducibility. Earlier `<version>-<variant>` and `<version>` tags are no longer published. The old `claude-code-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

- **Claude Code**
  - Commands: `claude`
  - Source: npm `@anthropic-ai/claude-code`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/) or rootless [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **One-shot review in a cluster** — Kubernetes Job in [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [Claude Code repository](https://github.com/anthropics/claude-code)
- [npm package `@anthropic-ai/claude-code`](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)
