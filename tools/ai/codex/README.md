# codex

[OpenAI Codex CLI](https://github.com/openai/codex) on the [`devbox`](../../base/devbox/) development image. The entrypoint is `codex`.

- **Source:** [`tools/ai/codex/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/codex)
- **Docs:** [tool-containers.hgh.dev/docs/ai/codex/](https://tool-containers.hgh.dev/docs/ai/codex/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Codex CLI; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>`
  - Included software: [codex](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Codex CLI; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `<version>-ubuntu`
  - Included software: [codex](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Codex CLI; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`, `<version>-alpine-browser`
  - Included software: [codex](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Codex CLI; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`, `<version>-alpine`
  - Included software: [codex](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/codex:<tag>` or `docker.io/hambn/codex:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Codex npm release; version tags are created once and never repointed. The old `codex-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

- **OpenAI Codex CLI**
  - Commands: `codex`
  - Source: npm `@openai/codex`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [Codex repository](https://github.com/openai/codex)
- [npm package `@openai/codex`](https://www.npmjs.com/package/@openai/codex)
- [Codex documentation](https://developers.openai.com/codex/)
