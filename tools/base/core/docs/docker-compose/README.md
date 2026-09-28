---
name: Docker Compose
description: Run the hardened core base as a locked-down Compose shell service with a read-only root, tmpfs /tmp, and dropped capabilities.
usecase: Locked-down read-only shell service
keywords: [read-only root, tmpfs, dropped capabilities, nonroot]
---

# core · Docker Compose

Run the hardened [core](../../README.md) base as a locked-down, read-only shell service.
[`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and runs
`docker compose` from this directory.

## Prerequisites

- Docker with the Compose v2 plugin

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh run --rm shell
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `CORE_IMAGE` | `ghcr.io/hambn/core:wolfi` | Image to run; use the `alpine` or `ubuntu` tag, or a digest |
| `WORKSPACE` | required | Absolute host path mounted at `/workspace` |

## Workspace

The workspace is bind-mounted at `/workspace`; the root filesystem is read-only and `/tmp`
is a tmpfs. The process runs as UID/GID 65532 with every capability dropped.

## Files

- [`compose.sh`](./compose.sh) — validates `WORKSPACE`, then forwards arguments to `docker compose`
- [`docker-compose.yml`](./docker-compose.yml) — the `shell` service

## Cleanup

```bash
WORKSPACE="$PWD" ./compose.sh down
```

## Limitations

- The read-only root filesystem blocks writes outside `/workspace` and `/tmp`; drop
  `read_only` to experiment with package installs (which still need root).
