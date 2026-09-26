# pi-agent

[Pi](https://github.com/earendil-works/pi), a minimal, extensible terminal coding agent, on the [`devbox`](../../base/devbox/) development image. The entrypoint is `pi`.

- **Source:** [`tools/ai/pi-agent/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/pi-agent)
- **Docs:** [tool-containers.hgh.dev/docs/ai/pi-agent/](https://tool-containers.hgh.dev/docs/ai/pi-agent/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — Pi coding agent; Ubuntu, headless Chromium
  - Base: [`devbox:ubuntu-browser`](../../base/devbox/)
  - Tags: `ubuntu-browser`, `latest`, `<version>-ubuntu-browser`, `<version>`
  - Included software: [pi-agent](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`ubuntu`** — Pi coding agent; Ubuntu, no browser
  - Base: [`devbox:ubuntu-full`](../../base/devbox/)
  - Tags: `ubuntu`, `<version>-ubuntu`
  - Included software: [pi-agent](#included-software) + [devbox full tier](../../base/devbox/#full)
- **`alpine-browser`** — Pi coding agent; Alpine, Chromium
  - Base: [`devbox:alpine-browser`](../../base/devbox/)
  - Tags: `alpine-browser`, `<version>-alpine-browser`
  - Included software: [pi-agent](#included-software) + [devbox browser tier](../../base/devbox/#browser)
- **`alpine`** — Pi coding agent; Alpine, no browser
  - Base: [`devbox:alpine-full`](../../base/devbox/)
  - Tags: `alpine`, `<version>-alpine`
  - Included software: [pi-agent](#included-software) + [devbox full tier](../../base/devbox/#full)

Pull from `ghcr.io/hambn/pi-agent:<tag>` or `docker.io/hambn/pi-agent:<tag>`.
Moving variant tags (and `latest`) repoint on every rebuild. `<version>` is the pinned Pi npm release; version tags are created once and never repointed. The old `pi-v<version>` tags are frozen and deprecated. The package is installed with `--ignore-scripts`.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in.

## Included software

- **Pi coding agent**
  - Commands: `pi`
  - Source: npm `@earendil-works/pi-coding-agent`, installed with `--ignore-scripts`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [devbox](../../base/devbox/#included-software): the full tier, plus the browser tier on `*-browser` variants

## Use cases

- **Interactive coding on a local checkout** — [`examples/docker/`](./examples/docker/).
- **Rootless workstation** — [`examples/podman/`](./examples/podman/).
- **Repeatable local sessions** — [`examples/docker-compose/`](./examples/docker-compose/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [Pi repository](https://github.com/earendil-works/pi)
- [npm package `@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
- [Pi documentation](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/docs)
