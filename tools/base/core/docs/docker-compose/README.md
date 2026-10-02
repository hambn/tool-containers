---
name: Docker compose
description: Run the hardened core base as a locked-down Compose shell service with a read-only root, a tmpfs /tmp, and every capability dropped.
usecase: Locked-down read-only shell service
keywords: [read-only root, tmpfs, dropped capabilities, nonroot]
---

# Run core with Docker compose

The `shell` service runs [core](../../README.md) with a read-only root filesystem, a
tmpfs at `/tmp`, no capabilities, and `no-new-privileges`. [`compose.sh`](./compose.sh)
checks that `WORKSPACE` is an absolute path, because Compose would resolve a relative
one against this directory, then runs `docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.

## Open a shell

```bash
WORKSPACE="$PWD" ./compose.sh run --rm shell
```

The shell starts in `/workspace`. Only `/workspace` and `/tmp` are writable; remove
`read_only` from [`docker-compose.yml`](./docker-compose.yml) if you need to write
elsewhere.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `CORE_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/core:wolfi`; use the `alpine` or `ubuntu` tag, or a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. The shell runs as UID and GID 65532, so that
UID needs access to the directory.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) defines the `shell` service.
