---
name: Docker
description: Open a throwaway shell in the hardened core base with Docker, run a single command in it, or build your own image FROM core.
usecase: Throwaway shell or base for your own image
keywords: [base image, dockerfile, derived image, nonroot]
---

# Run core with Docker

[`run.sh`](./run.sh) opens a shell in [core](../../README.md) with the current
directory mounted at `/workspace`. [`Dockerfile.example`](./Dockerfile.example) shows
core as the base of your own image.

## Prerequisites

- Docker Engine 23 or later.

## Open a shell

```bash
./run.sh
```

Arguments replace the shell, so you can run one command:

```bash
./run.sh curl -fsS https://example.com -o /dev/null -w '%{http_code}\n'
```

## Build your own image

Put an `app.sh` next to [`Dockerfile.example`](./Dockerfile.example), then:

```bash
docker build -f Dockerfile.example -t my-app .
docker run --rm my-app
```

core has no `sudo` and no setuid binaries. To install packages, switch to `USER root`
in your Dockerfile, install them, then switch back with `USER 65532:65532`.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `CORE_IMAGE` | no | Image `run.sh` runs. Defaults to `ghcr.io/hambn/core:wolfi`; use the `alpine` or `ubuntu` tag, or `ghcr.io/hambn/core@sha256:<digest>` to pin one build. |

## Workspace

`run.sh` mounts the current directory at `/workspace` and starts there. The container
runs as `nonroot` (UID and GID 65532), so that UID must be able to read the directory,
and write to it if your command writes.

## Files

- [`run.sh`](./run.sh) opens a shell or runs one command.
- [`Dockerfile.example`](./Dockerfile.example) builds a minimal image from core.
