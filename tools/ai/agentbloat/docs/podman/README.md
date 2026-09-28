---
name: Podman
description: Open an agentbloat Zsh shell with every agent CLI under rootless Podman, keeping file ownership with keep-id and relabeling for SELinux.
usecase: Rootless multi-agent workstation
keywords: [coding agents, rootless, keep-id, selinux]
---

# Run agentbloat with Podman

[`run.sh`](./run.sh) opens a Zsh login shell in [agentbloat](../../README.md) under
rootless Podman, with the current directory mounted at `/workspace`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.

## Open a shell

```bash
./run.sh
cd /workspace
```

Run any agent and sign in from its prompt. To pass an API key instead, add
`-e OPENAI_API_KEY` or another variable to the `podman run` line in `run.sh`. Logins
are removed with the container when you exit.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `AGENTBLOAT_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/agentbloat:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files the agents write stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
