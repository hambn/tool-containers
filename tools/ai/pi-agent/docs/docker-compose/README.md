---
name: Docker compose
description: Run the Pi terminal coding agent as a Docker compose service on a host directory you choose, with a Compose file for hosts that cannot pull.
usecase: Repeatable local sessions
keywords: [terminal coding agent, air-gapped]
---

# Run Pi Coding Agent with Docker compose

The `pi-agent` service runs [Pi](../../README.md) on the directory in `WORKSPACE`.
[`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path, because
Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- An account or API key for a model provider Pi supports.

## Run Pi

```bash
WORKSPACE="$PWD" ./compose.sh run --rm pi-agent
```

Run `/login` inside Pi to connect a provider; the login is removed with the container.
To pass a key from your shell, add `-e ANTHROPIC_API_KEY` (or another provider's
variable) before the service name.

## Run without registry access

On a connected machine, run
`docker save ghcr.io/hambn/pi-agent:ubuntu-browser -o pi-agent.tar`. On the offline
host, load it and use the air-gapped file, which sets `pull_policy: never`:

```bash
docker load -i pi-agent.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm pi-agent
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `PI_AGENT_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/pi-agent:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. Pi runs as UID 1000, so new files belong to
UID 1000 on the host.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
