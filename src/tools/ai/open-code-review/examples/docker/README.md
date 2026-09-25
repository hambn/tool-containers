# open-code-review · Docker

[`run.sh`](./run.sh) runs the Open Code Review CLI (`ocr`) with the arguments you pass, for example `review`, mounting the current directory at `/workspace`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker Engine 23 or newer.
- Configure an LLM provider with `ocr config` or its supported environment variables, passed with `-e`.

## Commands

```bash
./run.sh
./airgapped.run.sh open-code-review.tar
```

For an air-gapped host, save the image on a connected machine first:

```bash
docker save ghcr.io/hambn/open-code-review:ubuntu-browser -o open-code-review.tar
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPEN_CODE_REVIEW_IMAGE` | no | Image for [`run.sh`](./run.sh); defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`. |

## Workspace

The current directory is bind-mounted at `/workspace` and the container runs as `sysadmin` (UID 1000), so files it writes are owned by UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) — pull and run the published image.
- [`airgapped.run.sh`](./airgapped.run.sh) — `docker load` a saved tar and run with `--pull=never`.

## Cleanup

Containers are started with `--rm`. Remove the image with `docker image rm ghcr.io/hambn/open-code-review:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
