---
name: Docker
description: Open an interactive agentbloat Zsh shell with every bundled agent CLI in Docker, mounting the current directory at /workspace.
usecase: Interactive multi-agent workspace
keywords: [coding agents, zsh, docker socket, air-gapped]
---

# agentbloat · Docker

[`run.sh`](./run.sh) opens an interactive Zsh login shell with every bundled agent CLI, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- Sign in to each agent CLI inside the shell, or pass its API-key variable with `-e <VAR>` added to the `docker run` command in [`run.sh`](./run.sh).

## Commands

```bash
./run.sh
./airgapped.run.sh agentbloat.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/agentbloat:ubuntu-browser -o agentbloat.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `AGENTBLOAT_IMAGE` | no | Image for both scripts; defaults to `ghcr.io/hambn/agentbloat:ubuntu-browser`. |
| `AGENTBLOAT_DOCKER_SOCKET` | no | Host Docker socket path to mount at `/var/run/docker.sock`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/agentbloat:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin a digest (`ghcr.io/hambn/agentbloat@sha256:<digest>`) for repeatable runs.
