# t3code · Podman

[`run.sh`](./run.sh) serves the T3 Code web GUI on `http://127.0.0.1:3773` under rootless Podman.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Rootless Podman 4.3 or newer (for `--userns=keep-id:uid=,gid=`).
- Authenticate the agents from inside the T3 Code UI.

## Commands

```bash
./run.sh
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `T3CODE_IMAGE` | no | Image to run; defaults to `ghcr.io/hambn/t3code:ubuntu-browser`. |

## Workspace

The current directory is mounted at `/workspace` with `:Z` so SELinux hosts relabel it. `--userns=keep-id` maps your host user to the image's `sysadmin` (UID 1000), so written files stay owned by you.

## Files

- [`run.sh`](./run.sh) — rootless `podman run` of the published image.

## Cleanup

The container is started with `--rm`. Remove the image with `podman image rm ghcr.io/hambn/t3code:ubuntu-browser`.

## Limitations

- The port is bound to `127.0.0.1`; put an authenticating reverse proxy in front before exposing it further.
- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
