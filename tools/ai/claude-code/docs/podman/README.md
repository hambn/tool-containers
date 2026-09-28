---
name: Podman
description: Run Claude Code under rootless Podman on the current directory, keeping file ownership with keep-id and relabeling the mount for SELinux.
usecase: Rootless sessions on a workstation
keywords: [rootless, keep-id, selinux, anthropic api key]
---

# Run Claude Code with Podman

[`run.sh`](./run.sh) starts [Claude Code](../../README.md) under rootless Podman on the
current directory, passing any arguments to `claude`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.
- An Anthropic API key in `ANTHROPIC_API_KEY`.

## Run Claude Code

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./run.sh
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Forwarded to the container; the script stops if it is unset. |
| `CLAUDE_CODE_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/claude-code:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files Claude Code writes stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
