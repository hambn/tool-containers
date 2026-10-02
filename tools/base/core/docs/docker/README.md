---
name: Docker command
description: Open a shell in the hardened core image on your current directory or run curl directly, with copyable Docker commands and no launcher script.
usecase: Throwaway shell or base for your own image
keywords: [base image, nonroot, curl]
---

# Run core with Docker command

Run [core](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

core runs as `nonroot`, UID and GID 65532. That user must be able to read the mounted directory and write there if your command writes.

## Open a shell

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/core:wolfi
```

## Make an HTTP request

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/core:wolfi curl -fsS https://example.com
```

## Workspace and state

The container starts in `/workspace`.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.

## Build your own image

Put your `app.sh` next to [`Dockerfile.example`](./Dockerfile.example), then build it:

```bash
docker build -f Dockerfile.example -t my-app .
```

Run the result:

```bash
docker run --rm my-app
```

core has no `sudo`. Install packages as `USER root` in your Dockerfile, then switch back to `USER 65532:65532`.

## Files

- [`Dockerfile.example`](./Dockerfile.example) builds a minimal image from core.
