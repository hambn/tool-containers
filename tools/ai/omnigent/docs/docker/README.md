---
name: Docker
description: Run Omnigent in Docker on the current directory with your model API key, or from a saved image tarball on a host that cannot pull images.
usecase: Orchestrate agents over a local checkout
keywords: [agent harness, air-gapped, docker save]
---

# Run Omnigent with Docker

[`run.sh`](./run.sh) runs [Omnigent](../../README.md) on the current directory, passing
any arguments to `omnigent`. [`airgapped.run.sh`](./airgapped.run.sh) does the same
from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.
- A model credential, such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

## Run Omnigent

On first run, Omnigent offers the model credentials it finds in the environment.
`run.sh` passes none, so add `-e ANTHROPIC_API_KEY` or `-e OPENAI_API_KEY` to its
`docker run` line, then:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./run.sh                 # pick a model and start a session
./run.sh claude          # start a session in one agent, here Claude Code
```

Omnigent keeps its settings and history in `/home/sysadmin/.omnigent`, which is
removed with the container. Its web UI listens on port 6767 inside the container;
`run.sh` publishes no ports, so use the terminal session.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/omnigent:ubuntu-browser -o omnigent.tar
```

Copy the tar to the offline host and pass its path first; the remaining arguments go to
`omnigent`:

```bash
./airgapped.run.sh omnigent.tar
```

The script loads the tar and runs `OMNIGENT_IMAGE` with `--pull=never`. The agents
still need network access to their model providers.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OMNIGENT_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/omnigent:ubuntu-browser`; set `ghcr.io/hambn/omnigent@sha256:<digest>` to pin one build. |

## Workspace

The current directory is mounted at `/workspace`, the image's working directory.
Omnigent and the agents it starts run as `sysadmin` (UID 1000), so new files belong to
UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and runs `omnigent` with your arguments.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
