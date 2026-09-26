# core

Hardened minimal base images on [Wolfi](https://github.com/wolfi-dev),
[Alpine](https://alpinelinux.org/), and [Ubuntu](https://ubuntu.com/): CA certificates,
tzdata, curl, bash, and an unprivileged `nonroot` user. `core` is also the base of
[devbox](../devbox/README.md).

- **Source:** [`tools/base/core/`](https://github.com/hambn/tool-containers/tree/main/tools/base/core)
- **Docs:** [tool-containers.hgh.dev/docs/base/core/](https://tool-containers.hgh.dev/docs/base/core/)

## Contents

- [Images](#images)
- [Hardening](#hardening)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`wolfi`** — CA bundle, tzdata, curl, bash, `nonroot` user
  - Base: `chainguard/wolfi-base`
  - Tags: `wolfi`, `latest`, `wolfi-<YYYYMMDD>-<sha7>`
- **`alpine`** — CA bundle, tzdata, curl, bash, `nonroot` user
  - Base: Alpine
  - Tags: `alpine`, `alpine-<YYYYMMDD>-<sha7>`
- **`ubuntu`** — CA bundle, tzdata, curl, bash, `nonroot` user
  - Base: Ubuntu 24.04
  - Tags: `ubuntu`, `ubuntu-<YYYYMMDD>-<sha7>`

Pull from `ghcr.io/hambn/core:<tag>` or `docker.io/hambn/core:<tag>`. Moving tags
(`wolfi`, `alpine`, `ubuntu`, `latest`) follow `main`; the dated `<variant>-<YYYYMMDD>-<sha7>`
tags are immutable. Base-image digests and the OS package refresh date are pinned in
the [`Dockerfile`](./Dockerfile) `ARG` defaults.

## Hardening

- Runs as `nonroot` (UID/GID 65532) in `/home/nonroot`; the default command is `bash`.
- No `sudo`; every setuid and setgid bit is removed at build time.
- Documentation, man pages, and package caches are removed; the package manager stays
  so derived images can install packages as `USER root`.
- The Ubuntu variant drops the stock `ubuntu` (UID 1000) account.

## Use cases

- Open a throwaway shell with curl and bash with [Docker](examples/docker/).
- Start a derived application image `FROM ghcr.io/hambn/core:wolfi` with
  [Docker](examples/docker/).
- Run a read-only, capability-free shell service with
  [Docker Compose](examples/docker-compose/).

## Sources

- [Wolfi base image](https://images.chainguard.dev/directory/image/wolfi-base/overview)
- [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [Ubuntu container image](https://hub.docker.com/_/ubuntu)
- [curl](https://curl.se/)
