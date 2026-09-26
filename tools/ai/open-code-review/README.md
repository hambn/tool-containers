# open-code-review

[Open Code Review](https://github.com/alibaba/open-code-review), Alibaba's AI code review CLI, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `ocr`.

- **Source:** [`tools/ai/open-code-review/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/open-code-review)
- **Docs:** [tool-containers.hgh.dev/docs/ai/open-code-review/](https://tool-containers.hgh.dev/docs/ai/open-code-review/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Open Code Review CLI; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>`
  - Included software: [open-code-review](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Open Code Review CLI; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `<version>-ubuntu`
  - Included software: [open-code-review](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Open Code Review CLI; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`, `<version>-alpine-browser`
  - Included software: [open-code-review](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Open Code Review CLI; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`, `<version>-alpine`
  - Included software: [open-code-review](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/open-code-review:<tag>` or `docker.io/hambn/open-code-review:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Open Code Review npm release; version tags are created once and never repointed. The old `ocr-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in. Configure an LLM provider with `ocr config` or its environment variables.

## Included software

- **Open Code Review**
  - Commands: `ocr`
  - Source: npm `@alibaba-group/open-code-review`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Review the current checkout** — `./run.sh review` in [`examples/docker/`](./examples/docker/).
- **Rootless reviews** — [`examples/podman/`](./examples/podman/).
- **Repeatable local reviews** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [Open Code Review repository](https://github.com/alibaba/open-code-review)
- [npm package `@alibaba-group/open-code-review`](https://www.npmjs.com/package/@alibaba-group/open-code-review)
- [Open Code Review documentation](https://open-codereview.ai/docs)
