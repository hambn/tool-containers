# codex · Docker Compose

The `codex` service runs the Codex CLI (`codex`) with the arguments you pass. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path and runs `docker compose` from this directory.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- `OPENAI_API_KEY` exported in your shell.

## Commands

```bash
WORKSPACE="$PWD" ./compose.sh run --rm codex
```

Air-gapped host, after `docker load -i codex.tar`:

```bash
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm codex
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | API key forwarded into the container; never stored in the image. |
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `CODEX_IMAGE` | no | Image for [`docker-compose.yml`](./docker-compose.yml); defaults to `ghcr.io/hambn/codex:ubuntu-browser`. |

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
