---
name: Docker Compose
description: Run the Codex CLI as a Docker Compose service on a host directory you choose, with a second Compose file for hosts that cannot pull images.
usecase: Repeatable local sessions
keywords: [openai api key, air-gapped]
---

# Run Codex CLI with Docker Compose

The `codex` service runs [Codex CLI](../../README.md) on the directory in `WORKSPACE`.
[`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path, because
Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- An OpenAI API key in `OPENAI_API_KEY`.

## Run Codex

```bash
export OPENAI_API_KEY=sk-...
WORKSPACE="$PWD" ./compose.sh run --rm codex
```

Arguments after the service name go to `codex`. The interactive session starts at
Codex's sign-in screen with the key detected; choose the API key option. The login is
saved inside the container and removed with it. For `codex exec`, add
`CODEX_API_KEY: ${CODEX_API_KEY}` to the service's `environment`, since `exec` reads
that variable instead of `OPENAI_API_KEY`.

## Run without registry access

On a connected machine, run `docker save ghcr.io/hambn/codex:ubuntu-browser -o codex.tar`.
On the offline host, load it and use the air-gapped file, which sets
`pull_policy: never`:

```bash
docker load -i codex.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm codex
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | Passed to the container and offered at the Codex sign-in screen. |
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `CODEX_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/codex:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. Codex runs as UID 1000, so new files belong to
UID 1000 on the host.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
