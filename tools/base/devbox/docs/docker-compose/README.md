---
name: Docker Compose
description: Run devbox as a reusable Docker Compose service with the workspace bind-mounted and a persistent home volume for sysadmin.
usecase: Reusable shell with a persistent home
keywords: [persistent home, named volume, zsh]
---

# devbox · Docker Compose

Run [devbox](../../README.md) as a reusable Compose service with a persistent home
directory. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and
runs `docker compose` from this directory.

## Prerequisites

- Docker with the Compose v2 plugin

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh run --rm devbox
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `WORKSPACE` | required | Absolute host path mounted at `/workspace` |
| `DEVBOX_IMAGE` | `ghcr.io/hambn/devbox:ubuntu-full` | Image to run; any variant from the [image table](../../README.md#images), or a digest |

## Workspace

`WORKSPACE` is bind-mounted at `/workspace`. The `home` volume keeps `/home/sysadmin`
(shell history, tool caches, `~/.kube`) across runs; Docker seeds it from the image on
first use.

## Files

- [`compose.sh`](./compose.sh) — validates `WORKSPACE`, then forwards arguments to `docker compose`
- [`docker-compose.yml`](./docker-compose.yml) — the `devbox` service and `home` volume

## Cleanup

```bash
WORKSPACE="$PWD" ./compose.sh down --volumes
```

## Limitations

- The `home` volume keeps the dotfiles from the image it was first created with; remove
  it to pick up changed defaults from a newer image.
