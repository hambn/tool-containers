# open-code-review · Podman

[`run.sh`](./run.sh) runs the Open Code Review CLI (`ocr`) with the arguments you pass, for example `review` under rootless Podman.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Rootless Podman 4.3 or newer (for `--userns=keep-id:uid=,gid=`).
- Configure an LLM provider with `ocr config` or its supported environment variables, passed with `-e`.

## Commands

```bash
./run.sh
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPEN_CODE_REVIEW_IMAGE` | no | Image to run; defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`. |

## Workspace

The current directory is mounted at `/workspace` with `:Z` so SELinux hosts relabel it. `--userns=keep-id` maps your host user to the image's `sysadmin` (UID 1000), so written files stay owned by you.

## Files

- [`run.sh`](./run.sh) — rootless `podman run` of the published image.

## Cleanup

The container is started with `--rm`. Remove the image with `podman image rm ghcr.io/hambn/open-code-review:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
