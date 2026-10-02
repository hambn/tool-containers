---
name: Docker compose
description: Run Claude Code as a Docker compose service on a host directory you choose, with a second Compose file for hosts that cannot pull images.
usecase: Repeatable local sessions
keywords: [anthropic api key, air-gapped]
---

# Run Claude Code with Docker compose

The `claude` service runs [Claude Code](../../README.md) on the directory in
`WORKSPACE`. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path,
because Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- An Anthropic API key in `ANTHROPIC_API_KEY`.

## Run Claude Code

```bash
export ANTHROPIC_API_KEY=sk-ant-...
WORKSPACE="$PWD" ./compose.sh run --rm claude
```

Arguments after the service name go to `claude`, for example
`./compose.sh run --rm claude -p "list the TODOs"`.

## Run without registry access

On a connected machine, run
`docker save ghcr.io/hambn/claude-code:ubuntu-browser -o claude-code.tar`. On the
offline host, load it and use the air-gapped file, which sets `pull_policy: never`:

```bash
docker load -i claude-code.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm claude
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Passed to the container; Compose stops if it is unset. |
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `CLAUDE_CODE_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/claude-code:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. Claude Code runs as UID 1000, so new files
belong to UID 1000 on the host.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
