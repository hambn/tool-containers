---
name: Docker
description: Run the Pi terminal coding agent in Docker on the current directory, or load a saved image tarball on a host with no registry access.
usecase: Interactive coding on a local checkout
keywords: [terminal coding agent, air-gapped, docker save]
---

# Run Pi Coding Agent with Docker

[`run.sh`](./run.sh) starts [Pi](../../README.md) on the current directory, passing any
arguments to `pi`. [`airgapped.run.sh`](./airgapped.run.sh) does the same from a saved
image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.
- An account or API key for a model provider Pi supports.

## Run Pi

```bash
./run.sh
```

The scripts pass no credentials. Inside Pi, run `/login` to connect a subscription or
API key; Pi saves it in the container, and `--rm` deletes it when you exit. To use an
environment key instead, add `-e ANTHROPIC_API_KEY` (or `-e OPENAI_API_KEY`,
`-e GEMINI_API_KEY`) to the `docker run` line in [`run.sh`](./run.sh) and export it.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/pi-agent:ubuntu-browser -o pi-agent.tar
```

Copy the tar to the offline host and pass its path first; the remaining arguments go to
`pi`:

```bash
./airgapped.run.sh pi-agent.tar
```

The script loads the tar and runs `PI_AGENT_IMAGE` with `--pull=never`, so set that
variable if you saved a different tag.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `PI_AGENT_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/pi-agent:ubuntu-browser`; set `ghcr.io/hambn/pi-agent@sha256:<digest>` to pin one build. |

## Workspace

The current directory is mounted at `/workspace`, the image's working directory. Pi runs
as `sysadmin` (UID 1000), so new files belong to UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and runs it.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
