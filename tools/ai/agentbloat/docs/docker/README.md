---
name: Docker
description: Open an agentbloat Zsh shell in Docker with all eight agent CLIs and the current directory at /workspace, or run it from a saved image offline.
usecase: Interactive multi-agent workspace
keywords: [coding agents, zsh, docker socket, air-gapped]
---

# Run agentbloat with Docker

[`run.sh`](./run.sh) opens a Zsh login shell in [agentbloat](../../README.md) with the
current directory mounted at `/workspace`. [`airgapped.run.sh`](./airgapped.run.sh)
does the same from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.

## Open a shell

```bash
./run.sh
cd /workspace
```

The shell starts in `/home/sysadmin`. Run any agent, for example `claude` or `codex`,
and sign in from its prompt. Logins are saved in the home directory and removed with
the container when you exit. To pass an API key instead, add `-e OPENAI_API_KEY` or
another variable to the `docker run` line in `run.sh`.

To let agents run Docker commands, set `AGENTBLOAT_DOCKER_SOCKET` to the host socket.
`run.sh` mounts it at `/var/run/docker.sock` and adds its group:

```bash
AGENTBLOAT_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

Access to the socket gives the container root on the host.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/agentbloat:ubuntu-browser -o agentbloat.tar
```

Copy the tar to the offline host and pass its path first; any remaining arguments
replace the shell command:

```bash
./airgapped.run.sh agentbloat.tar
```

The script loads the tar and runs `AGENTBLOAT_IMAGE` with `--pull=never`. The agents
still need network access to their model providers.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `AGENTBLOAT_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/agentbloat:ubuntu-browser`; set `ghcr.io/hambn/agentbloat@sha256:<digest>` to pin one build. |
| `AGENTBLOAT_DOCKER_SOCKET` | no | Host Docker socket for `run.sh` to mount at `/var/run/docker.sock`. |

## Workspace

The current directory is mounted at `/workspace`. The agents run as `sysadmin`
(UID 1000), so new files belong to UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and opens the shell.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
