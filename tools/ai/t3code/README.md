# t3code

[T3 Code](https://github.com/pingdotgg/t3code), a web GUI over coding agents, on the [`agentbloat`](../agentbloat/) image so Codex, Claude Code, Cursor, OpenCode, and the other bundled CLIs are ready to drive. The entrypoint is `t3 serve --host=0.0.0.0 --port=3773` and port `3773` is exposed.

- **Source:** [`tools/ai/t3code/`](https://github.com/hambn/tool-containers/tree/main/tools/ai/t3code)
- **Docs:** [tool-containers.hgh.dev/docs/ai/t3code/](https://tool-containers.hgh.dev/docs/ai/t3code/)

## Contents

- [Images](#images)
- [Included software](#included-software)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`ubuntu-browser`** — T3 Code plus every agentbloat CLI; Ubuntu, headless Chromium
  - Base: [`agentbloat:ubuntu-browser`](../agentbloat/)
  - Tags: `ubuntu-browser`
  - Included software: [t3code](#included-software) + [agentbloat](../agentbloat/#included-software)
- **`ubuntu`** — T3 Code plus every agentbloat CLI; Ubuntu, no browser
  - Base: [`agentbloat:ubuntu`](../agentbloat/)
  - Tags: `ubuntu`, `latest`, `t3code-<version>`
  - Included software: [t3code](#included-software) + [agentbloat](../agentbloat/#included-software)

No Alpine variants: upstream publishes only glibc builds of the `t3` binary, which gcompat cannot run.

Pull from `ghcr.io/hambn/t3code:<tag>` or `docker.io/hambn/t3code:<tag>`. Tags are the variant names plus `latest` (`ubuntu`, the lightest Ubuntu variant), which also carries `t3code-<version>` for the pinned T3 Code npm release. Every tag moves on each rebuild; pin a digest for reproducibility. Earlier `<version>-<variant>` and `<version>` tags are no longer published. The old `t3code-stable-v<version>` and `t3code-nightly-v<version>` tags are frozen and deprecated.

The image runs as `sysadmin` (UID 1000) in `/workspace`; credentials are supplied at runtime and never baked in. Authenticate agents from the T3 Code UI; the server itself has no built-in network authentication, so keep it on loopback or behind an authenticating proxy.

The Browser item in T3 Code's served web interface is disabled. It uses a desktop client browser view; the `ubuntu-browser` image's headless Chromium is available to command-line tools but does not enable that interface item. Use the T3 Code desktop client for its Browser view.

## Included software

- **T3 Code**
  - Commands: `t3`
  - Source: npm `t3`
  - Pinned in the [`Dockerfile`](./Dockerfile) `ARG` defaults
- **Everything else** comes from [agentbloat](../agentbloat/#included-software): every agent CLI plus the devbox toolset

## Use cases

- **Local GUI over a checkout** — [`examples/docker/`](./examples/docker/), then open `http://127.0.0.1:3773`.
- **Persistent local instance** — [`examples/docker-compose/`](./examples/docker-compose/) or rootless [`examples/podman/`](./examples/podman/).
- **Shared cluster instance** — Deployment and Service in [`examples/kubernetes/`](./examples/kubernetes/) or the Helm chart in [`examples/helm/`](./examples/helm/).
- **Air-gapped hosts** — the `airgapped.*` files in [`examples/docker/`](./examples/docker/) and [`examples/docker-compose/`](./examples/docker-compose/).

## Sources

- [T3 Code repository](https://github.com/pingdotgg/t3code)
- [npm package `t3`](https://www.npmjs.com/package/t3)
