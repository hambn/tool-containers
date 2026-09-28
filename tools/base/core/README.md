---
name: core
title: core
description: Hardened minimal base images on Wolfi, Alpine, and Ubuntu with CA certificates, tzdata, curl, bash, and an unprivileged nonroot user.
order: 1
images: [ghcr.io/hambn/core, docker.io/hambn/core]
keywords: [base image, wolfi, alpine, ubuntu, nonroot, hardened]
---

# core

Minimal base images on [Wolfi](https://github.com/wolfi-dev),
[Alpine](https://alpinelinux.org/), and [Ubuntu](https://ubuntu.com/) for building
applications that run as an unprivileged user. Each holds CA certificates, tzdata,
curl, bash, and a `nonroot` user, and nothing else. core is also the base of
[devbox](../devbox/).

- **Source:** [`tools/base/core/`](https://github.com/hambn/tool-containers/tree/main/tools/base/core)
- **Docs:** [tool-containers.hgh.dev/docs/base/core/](https://tool-containers.hgh.dev/docs/base/core/)

## Contents

- [Images](#images)
- [Hardening](#hardening)
- [Use cases](#use-cases)
- [Sources](#sources)

## Images

- **`wolfi`**: Wolfi, a glibc distribution built for containers. `docker build` builds
  this variant by default.
  - Base: `chainguard/wolfi-base`
  - Tags: `wolfi`
- **`alpine`**: Alpine 3.24.
  - Base: `alpine:3.24`
  - Tags: `alpine`
- **`ubuntu`**: Ubuntu 24.04, for software that needs glibc and apt. `latest` points
  here.
  - Base: `ubuntu:24.04`
  - Tags: `ubuntu`, `latest`

Pull `ghcr.io/hambn/core:<tag>` or `docker.io/hambn/core:<tag>`. All tags move when the
image is rebuilt; pin a digest to keep one build. The [`Dockerfile`](./Dockerfile) pins
each upstream base by digest and holds the date that forces an OS package refresh.

## Hardening

- Runs as `nonroot` (UID and GID 65532) in `/home/nonroot`. The default command is
  `bash`.
- Has no `sudo`, and the build clears every setuid and setgid bit.
- Removes documentation, man pages, and package caches. The package manager stays, so
  a derived image can install packages as `USER root`.
- On Ubuntu, removes the stock `ubuntu` account (UID 1000).

## Use cases

- **Throwaway shell or base for your own image** with [Docker](./docs/docker/): run curl
  and bash in a disposable container, or build `FROM ghcr.io/hambn/core:wolfi`.
- **Locked-down read-only shell service** with [Docker Compose](./docs/docker-compose/).

## Sources

- [Wolfi base image](https://images.chainguard.dev/directory/image/wolfi-base/overview)
- [Alpine Linux container image](https://hub.docker.com/_/alpine)
- [Ubuntu container image](https://hub.docker.com/_/ubuntu)
- [curl](https://curl.se/)
