# devbox · Docker Compose

Run [devbox](../../README.md) as a reusable Compose service with a persistent home
directory.

## Prerequisites

- Docker with the Compose v2 plugin

## Commands

```bash
WORKSPACE="$PWD" docker compose run --rm devbox
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `WORKSPACE` | required | Absolute host path mounted at `/workspace` |
| `DEVBOX_VARIANT` | `ubuntu-full` | Any variant from the [image table](../../README.md#images) |

## Workspace

`WORKSPACE` is bind-mounted at `/workspace`. The `home` volume keeps `/home/sysadmin`
(shell history, tool caches, `~/.kube`) across runs; Docker seeds it from the image on
first use.

## Files

- [`docker-compose.yml`](./docker-compose.yml) — the `devbox` service and `home` volume

## Cleanup

```bash
docker compose down --volumes
```

## Limitations

- The `home` volume keeps the dotfiles from the image it was first created with; remove
  it to pick up changed defaults from a newer image.
