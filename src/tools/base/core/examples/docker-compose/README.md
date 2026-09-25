# core · Docker Compose

Run the hardened [core](../../README.md) base as a locked-down, read-only shell service.

## Prerequisites

- Docker with the Compose v2 plugin

## Commands

```bash
docker compose run --rm shell
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `CORE_VARIANT` | `wolfi` | Image variant: `wolfi`, `alpine`, or `ubuntu` |
| `WORKSPACE` | `.` | Host directory mounted at `/workspace` |

## Workspace

The workspace is bind-mounted at `/workspace`; the root filesystem is read-only and `/tmp`
is a tmpfs. The process runs as UID/GID 65532 with every capability dropped.

## Files

- [`docker-compose.yml`](./docker-compose.yml) — the `shell` service

## Cleanup

```bash
docker compose down
```

## Limitations

- The read-only root filesystem blocks writes outside `/workspace` and `/tmp`; drop
  `read_only` to experiment with package installs (which still need root).
