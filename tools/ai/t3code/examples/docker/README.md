# t3code · Docker

[`run.sh`](./run.sh) serves the T3 Code web GUI on `http://127.0.0.1:3773`, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- Authenticate the agents from inside the T3 Code UI.

## Commands

```bash
./run.sh
./airgapped.run.sh t3code.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `T3CODE_IMAGE` | no | Image for [`run.sh`](./run.sh); defaults to `ghcr.io/hambn/t3code:ubuntu-browser`. |
| `T3CODE_DOCKER_SOCKET` | no | Host Docker socket path to mount at `/var/run/docker.sock`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/t3code:ubuntu-browser`.

## Limitations

- The port is bound to `127.0.0.1`; put an authenticating reverse proxy in front before exposing it further.
- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
