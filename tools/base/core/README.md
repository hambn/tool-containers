# core

Hardened minimal base images on [Wolfi](https://github.com/wolfi-dev),
[Alpine](https://alpinelinux.org/), and [Ubuntu](https://ubuntu.com/): CA certificates,
tzdata, curl, bash, and an unprivileged `nonroot` user. `core` is also the base of
[devbox](../devbox/README.md).

## Contents

- [Images](#images)
- [Hardening](#hardening)
- [Use cases](#use-cases)
- [File map](#file-map)
- [Sources](#sources)

## Images

| Variant | Base | Contents | Tags |
|---|---|---|---|
| `wolfi` | `chainguard/wolfi-base` | CA bundle, tzdata, curl, bash, `nonroot` user | `wolfi`, `latest`, `wolfi-<YYYYMMDD>-<sha7>` |
| `alpine` | Alpine | CA bundle, tzdata, curl, bash, `nonroot` user | `alpine`, `alpine-<YYYYMMDD>-<sha7>` |
| `ubuntu` | Ubuntu 24.04 | CA bundle, tzdata, curl, bash, `nonroot` user | `ubuntu`, `ubuntu-<YYYYMMDD>-<sha7>` |

Pull from `ghcr.io/hambn/core:<tag>` or `docker.io/hambn/core:<tag>`. Moving tags
(`wolfi`, `alpine`, `ubuntu`, `latest`) follow `main`; the dated `<variant>-<YYYYMMDD>-<sha7>`
tags are immutable. Base-image digests and the OS package refresh date are pinned in
[`versions.hcl`](../../versions.hcl).

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

## File map

- [`README.md`](README.md)
- [`Dockerfile`](Dockerfile)
- `tests/`
  - [`structure.yaml`](tests/structure.yaml)
  - [`structure-ubuntu.yaml`](tests/structure-ubuntu.yaml)
- `examples/`
  - `docker/`
    - [`README.md`](examples/docker/README.md)
    - [`run.sh`](examples/docker/run.sh)
    - [`Dockerfile.example`](examples/docker/Dockerfile.example)
  - `docker-compose/`
    - [`README.md`](examples/docker-compose/README.md)
    - [`docker-compose.yml`](examples/docker-compose/docker-compose.yml)
- [`.github/workflows/images.yml`](../../../.github/workflows/images.yml)

## Sources

- [Wolfi base image](https://images.chainguard.dev/directory/image/wolfi-base/overview)
- [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [Ubuntu container image](https://hub.docker.com/_/ubuntu)
- [curl](https://curl.se/)
