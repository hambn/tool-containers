---
name: Docker compose
description: Run devbox as a reusable Docker compose service with the workspace bind-mounted and a persistent home volume for sysadmin.
usecase: Reusable shell with a persistent home
keywords: [persistent home, named volume, zsh]
---

# Run devbox with Docker compose

The `devbox` service runs [devbox](../../README.md) with your workspace mounted and a
named volume for `/home/sysadmin`, so shell history, tool caches, and `~/.kube` survive
between runs. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path,
because Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.

## Open a shell

```bash
WORKSPACE="$PWD" ./compose.sh run --rm devbox
```

The shell starts in `/workspace`.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `DEVBOX_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/devbox:ubuntu-full`; use any [variant](../../README.md#images), or a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. Docker fills the `home` volume from the image
the first time, and keeps it afterwards. Later images do not update it, so remove the
volume to pick up new shell defaults.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) defines the `devbox` service and the `home` volume.

## Cleanup

Remove the containers and the `home` volume:

```bash
WORKSPACE="$PWD" ./compose.sh down --volumes
```
