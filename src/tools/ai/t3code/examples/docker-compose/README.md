# t3code · Docker Compose

The `t3code` service serves the T3 Code web GUI on `http://127.0.0.1:3773`. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and runs `docker compose` from this directory.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- Authenticate the agents from inside the T3 Code UI.

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh up
```

Air-gapped host, after `docker load -i t3code.tar`:

```bash
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml up
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `T3CODE_IMAGE` | no | Image for [`docker-compose.yml`](./docker-compose.yml); defaults to `ghcr.io/hambn/t3code:ubuntu-browser`. |

## Workspace

`WORKSPACE` is bind-mounted at `/workspace`; the container runs as UID 1000.

## Files

- [`compose.sh`](./compose.sh) — validates `WORKSPACE`, then forwards arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) — pulls the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) — uses a pre-loaded image with `pull_policy: never`.

## Cleanup

```bash
WORKSPACE="$PWD" ./compose.sh down
```

## Limitations

- The port is bound to `127.0.0.1`; put an authenticating reverse proxy in front before exposing it further.
- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
