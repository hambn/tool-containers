---
name: Docker Compose
description: Run Omnigent as a Docker Compose service on a host directory you choose, with a second Compose file for hosts that cannot pull images.
usecase: Repeatable local orchestration sessions
keywords: [agent harness, air-gapped]
---

# Run Omnigent with Docker Compose

The `omnigent` service runs [Omnigent](../../README.md) on the directory in
`WORKSPACE`. [`compose.sh`](./compose.sh) checks that `WORKSPACE` is an absolute path,
because Compose would resolve a relative one against this directory, then runs
`docker compose` here.

## Prerequisites

- Docker Engine with the Compose v2 plugin.
- A model credential, such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

## Run Omnigent

The Compose files pass no environment. Forward your key with `-e`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
WORKSPACE="$PWD" ./compose.sh run --rm -e ANTHROPIC_API_KEY omnigent
```

Arguments after the service name go to `omnigent`, for example `omnigent codex`.
Omnigent's settings in `/home/sysadmin/.omnigent` are removed with the container, and
its web UI on port 6767 is not published.

## Run without registry access

On a connected machine, run `docker save ghcr.io/hambn/omnigent:ubuntu-browser -o omnigent.tar`.
On the offline host, load it and use the air-gapped file, which sets
`pull_policy: never`:

```bash
docker load -i omnigent.tar
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm \
  -e ANTHROPIC_API_KEY omnigent
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `WORKSPACE` | yes | Absolute host path mounted at `/workspace`. |
| `OMNIGENT_IMAGE` | no | Image for both Compose files. Defaults to `ghcr.io/hambn/omnigent:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

`WORKSPACE` is mounted at `/workspace`. Omnigent runs as UID 1000, so new files belong
to UID 1000 on the host.

## Files

- [`compose.sh`](./compose.sh) validates `WORKSPACE` and passes its arguments to `docker compose`.
- [`docker-compose.yml`](./docker-compose.yml) runs the published image.
- [`airgapped.docker-compose.yml`](./airgapped.docker-compose.yml) runs a loaded image and never pulls.
