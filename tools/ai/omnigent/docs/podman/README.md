---
name: Podman
description: Run Omnigent under rootless Podman on the current directory, keeping file ownership with keep-id and relabeling the mount for SELinux.
usecase: Rootless agent orchestration on a workstation
keywords: [agent harness, rootless, keep-id, selinux]
---

# Run Omnigent with Podman

[`run.sh`](./run.sh) starts [Omnigent](../../README.md) under rootless Podman on the
current directory, passing any arguments to `omnigent`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.
- A model credential, such as `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

## Run Omnigent

`run.sh` passes no environment. Add `-e ANTHROPIC_API_KEY` or `-e OPENAI_API_KEY` to
its `podman run` line, then:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./run.sh
```

Omnigent's settings are removed with the container, and its web UI on port 6767 is not
published.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OMNIGENT_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/omnigent:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files Omnigent writes stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
