# claude-code · Podman

[`run.sh`](./run.sh) runs Claude Code (`claude`) with the arguments you pass under rootless Podman.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Rootless Podman 4.3 or newer (for `--userns=keep-id:uid=,gid=`).
- `ANTHROPIC_API_KEY` exported in your shell.

## Commands

```bash
./run.sh
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | API key forwarded into the container; never stored in the image. |
| `CLAUDE_CODE_IMAGE` | no | Image to run; defaults to `ghcr.io/hambn/claude-code:ubuntu-browser`. |

## Workspace

The current directory is mounted at `/workspace` with `:Z` so SELinux hosts relabel it. `--userns=keep-id` maps your host user to the image's `sysadmin` (UID 1000), so written files stay owned by you.

## Files

- [`run.sh`](./run.sh) — rootless `podman run` of the published image.

## Cleanup

The container is started with `--rm`. Remove the image with `podman image rm ghcr.io/hambn/claude-code:ubuntu-browser`.

## Limitations

- Moving tags such as `ubuntu-browser` are repointed on every rebuild; pin `<version>-<variant>` or a digest for repeatable runs.
