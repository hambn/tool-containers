---
name: Podman
description: Run the Pi terminal coding agent under rootless Podman on the current directory, mapping your host user to sysadmin with keep-id.
usecase: Rootless sessions on a workstation
keywords: [terminal coding agent, rootless, keep-id, selinux]
---

# Run Pi Coding Agent with Podman

[`run.sh`](./run.sh) starts [Pi](../../README.md) under rootless Podman on the current
directory, passing any arguments to `pi`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.
- An account or API key for a model provider Pi supports.

## Run Pi

```bash
./run.sh
```

Run `/login` inside Pi to connect a provider; the login is removed with the container.
To use an environment key, add `-e ANTHROPIC_API_KEY` (or another provider's variable)
to the `podman run` line in [`run.sh`](./run.sh).

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `PI_AGENT_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/pi-agent:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files Pi writes stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
