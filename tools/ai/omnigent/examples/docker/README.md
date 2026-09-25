# omnigent · Docker

[`run.sh`](./run.sh) runs `omnigent` with the arguments you pass, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- Omnigent discovers provider credentials and harness logins at runtime; pass provider API-key variables with `-e` when needed.

## Commands

```bash
./run.sh
./airgapped.run.sh omnigent.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/omnigent:ubuntu-browser -o omnigent.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OMNIGENT_IMAGE` | no | Image for [`run.sh`](./run.sh); defaults to `ghcr.io/hambn/omnigent:ubuntu-browser`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/omnigent:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
