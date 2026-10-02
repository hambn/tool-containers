---
name: Docker command
description: Open a devbox development shell on your current checkout, run one command, or give the shell access to the host Docker daemon.
usecase: Interactive development shell on a checkout
keywords: [docker socket, zsh, development shell]
---

# Run devbox with Docker command

Run [devbox](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

The 1 GB shared-memory allocation also supports headless Chromium if you select a browser variant.

## Open a shell

```bash
docker run -it --rm \
  --shm-size=1g \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/devbox:ubuntu-full
```

## Check Node.js

```bash
docker run -it --rm \
  --shm-size=1g \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/devbox:ubuntu-full node --version
```

## Use the host Docker daemon

On Linux, mount the host socket and add its group. Socket access gives the container root-equivalent access to the host.

```bash
docker run -it --rm \
  --shm-size=1g \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add "$(stat -c %g /var/run/docker.sock)" \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/devbox:ubuntu-full
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
