---
name: Docker
description: Open an interactive devbox Zsh shell on the current directory with Docker, optionally driving the host Docker daemon.
usecase: Interactive development shell on a checkout
keywords: [docker socket, zsh, development shell]
---

# Run devbox with Docker

[`run.sh`](./run.sh) opens a [devbox](../../README.md) shell on the current directory,
or runs one command there. It can also give the shell access to the host's Docker
daemon.

## Prerequisites

- Docker Engine 23 or later.

## Open a shell

```bash
./run.sh                                          # Zsh login shell in /workspace
./run.sh zsh -lc 'go version && node --version'   # one command
```

To build and run containers from inside the shell, mount the host's Docker socket.
This works on the full and browser tiers, which include the Docker CLI:

```bash
DEVBOX_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

The script adds the socket's group to the container so `sysadmin` can use it. Anyone
with the socket has root-equivalent access to the host.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `DEVBOX_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/devbox:ubuntu-full`; use any [variant](../../README.md#images), or a digest reference to pin one build. |
| `DEVBOX_DOCKER_SOCKET` | no | Host Docker socket to mount at `/var/run/docker.sock`. |

## Workspace

The current directory is mounted at `/workspace`. The shell runs as `sysadmin`
(UID 1000), so new files belong to UID 1000 on the host. `--rm` deletes the container,
and everything outside `/workspace`, when you exit.

## Files

- [`run.sh`](./run.sh) runs the image with a 1 GB `/dev/shm` for the browser tier and the optional Docker socket.
