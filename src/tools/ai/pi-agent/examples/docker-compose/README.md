# pi-agent · Docker Compose

The `pi-agent` service runs Pi (`pi`) with the arguments you pass. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and runs `docker compose` from this directory.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- Sign in through Pi's provider login flow, or pass a supported API-key variable with `-e`.

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh run --rm pi-agent
```

Air-gapped host, after `docker load -i pi-agent.tar`:

```bash
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm pi-agent
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `PI_AGENT_IMAGE` | no | Image for [`docker-compose.yml`](./docker-compose.yml); defaults to `ghcr.io/hambn/pi-agent:ubuntu-browser`. |

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

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
