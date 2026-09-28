---
name: Docker
description: Run the OpenAI Codex CLI in Docker with OPENAI_API_KEY, mounting the current directory at /workspace or loading a saved tarball.
usecase: Interactive coding on a local checkout
keywords: [openai api key, air-gapped, docker save]
---

# codex · Docker

[`run.sh`](./run.sh) runs the Codex CLI (`codex`) with the arguments you pass, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- `OPENAI_API_KEY` exported in your shell.

## Commands

```bash
./run.sh
./airgapped.run.sh codex.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/codex:ubuntu-browser -o codex.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | API key forwarded into the container; never stored in the image. |
| `CODEX_IMAGE` | no | Image for both scripts; defaults to `ghcr.io/hambn/codex:ubuntu-browser`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/codex:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin a digest (`ghcr.io/hambn/codex@sha256:<digest>`) for repeatable runs.
