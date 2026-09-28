---
name: Docker Compose
description: Open an agentbloat Zsh shell with every agent CLI as a Docker Compose service on a host directory, with an air-gapped Compose file.
usecase: Repeatable local multi-agent workspace
keywords: [coding agents, zsh, air-gapped]
---

# Run agentbloat with Docker Compose

The `agentbloat` service opens a Zsh login shell in [agentbloat](../../README.md) with
the directory in `WORKSPACE` mounted at `/workspace`. [`compose.sh`](./compose.sh)
checks that `WORKSPACE` is an absolute path, because Compose would resolve a relative
one against this directory, then runs `docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.

## Open a shell

```bash
WORKSPACE="$PWD" ./compose.sh run --rm agentbloat
```

The shell starts in `/home/sysadmin`; run `cd /workspace`, then any agent. Sign in from
the agent's prompt, or forward an API key with `-e`, for example
`./compose.sh run --rm -e OPENAI_API_KEY agentbloat`. Logins are removed with the
container.

## Run without registry access

On a connected machine, run `docker save ghcr.io/hambn/agentbloat:ubuntu-browser -o agentbloat.tar`.
On the offline host, load it and use the air-gapped file, which sets
`pull_policy: never`:

```bash
docker load -i agentbloat.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm agentbloat
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `AGENTBLOAT_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/agentbloat:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. The agents run as UID 1000, so new files belong
to UID 1000 on the host.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
