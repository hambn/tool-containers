---
name: Docker
description: Serve the T3 Code web GUI on 127.0.0.1:3773 in Docker with the current directory as its workspace, or from a saved image tarball offline.
usecase: Local GUI over a checkout
keywords: [web gui, port 3773, air-gapped]
---

# Run T3 Code with Docker

[`run.sh`](./run.sh) serves [T3 Code](../../README.md) on `http://127.0.0.1:3773` with
the current directory mounted at `/workspace`. [`airgapped.run.sh`](./airgapped.run.sh)
does the same from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.

## Run T3 Code

```bash
./run.sh
```

The server prints a `Token:` line when it is ready. Open
`http://127.0.0.1:3773/pair#token=<token>` to pair your browser, then add
`/workspace` as a project and sign in to an agent from the UI. The printed pairing URL
uses the container's IP address, which the host may not reach. Press Ctrl-C to stop
the server; the container, T3 Code's state, and the agent logins are removed with it.

The token expires after five minutes. To pair later, run
`docker exec <container> t3 auth pairing create --base-url http://127.0.0.1:3773`
with the container ID from `docker ps`, and open the `Pair URL` it prints.

To let agents run Docker commands, set `T3CODE_DOCKER_SOCKET` to the host socket.
`run.sh` mounts it at `/var/run/docker.sock` and adds its group:

```bash
T3CODE_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

Access to the socket gives the container root on the host.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar
```

Copy the tar to the offline host and pass its path:

```bash
./airgapped.run.sh t3code.tar
```

The script loads the tar and runs `T3CODE_IMAGE` with `--pull=never`. It does not
support `T3CODE_DOCKER_SOCKET`.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `T3CODE_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/t3code:ubuntu-browser`; set `ghcr.io/hambn/t3code@sha256:<digest>` to pin one build. |
| `T3CODE_DOCKER_SOCKET` | no | Host Docker socket for `run.sh` to mount at `/var/run/docker.sock`. |

## Workspace

The current directory is mounted at `/workspace`. T3 Code and its agents run as
`sysadmin` (UID 1000), so new files belong to UID 1000 on the host. The port is bound
to `127.0.0.1`; put an authenticating reverse proxy in front before you expose it
further.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and serves T3 Code on port 3773.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
