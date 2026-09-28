---
name: Docker
description: Run the Pi terminal coding agent in Docker, mounting the current directory at /workspace, or from a saved image tarball.
usecase: Interactive coding on a local checkout
keywords: [terminal coding agent, air-gapped, docker save]
---

# pi-agent · Docker

[`run.sh`](./run.sh) runs Pi (`pi`) with the arguments you pass, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- Sign in through Pi's provider login flow, or pass a supported API-key variable with `-e <VAR>` added to the `docker run` command in [`run.sh`](./run.sh).

## Commands

```bash
./run.sh
./airgapped.run.sh pi-agent.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/pi-agent:ubuntu-browser -o pi-agent.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `PI_AGENT_IMAGE` | no | Image for both scripts; defaults to `ghcr.io/hambn/pi-agent:ubuntu-browser`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/pi-agent:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin a digest (`ghcr.io/hambn/pi-agent@sha256:<digest>`) for repeatable runs.
