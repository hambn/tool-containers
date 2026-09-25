# agentbloat · Podman

[`run.sh`](./run.sh) opens an interactive Zsh login shell with every bundled agent CLI under rootless Podman.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Rootless Podman 4.3 or newer (for `--userns=keep-id:uid=,gid=`).
- Sign in to each agent CLI inside the shell, or pass its API-key variable with `-e`.

## Commands

```bash
./run.sh
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `AGENTBLOAT_IMAGE` | no | Image to run; defaults to `ghcr.io/hambn/agentbloat:ubuntu-browser`. |

## Workspace

The current directory is mounted at `/workspace` with `:Z` so SELinux hosts relabel it. `--userns=keep-id` maps your host user to the image's `sysadmin` (UID 1000), so written files stay owned by you.

## Files

- [`run.sh`](./run.sh) — rootless `podman run` of the published image.

## Cleanup

The container is started with `--rm`. Remove the image with `podman image rm ghcr.io/hambn/agentbloat:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin a `<variant>-<YYYYMMDD>-<sha7>` tag or a digest for repeatable runs.
