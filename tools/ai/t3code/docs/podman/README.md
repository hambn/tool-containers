---
name: Podman
description: Serve the T3 Code web GUI on 127.0.0.1:3773 under rootless Podman, with the current directory as its workspace and your own file ownership.
usecase: Rootless local instance
keywords: [web gui, rootless, keep-id, selinux]
---

# Run T3 Code with Podman

[`run.sh`](./run.sh) serves [T3 Code](../../README.md) on `http://127.0.0.1:3773` under
rootless Podman, with the current directory mounted at `/workspace`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.

## Run T3 Code

```bash
./run.sh
```

When the server prints its `Token:` line, open
`http://127.0.0.1:3773/pair#token=<token>` to pair your browser. Add `/workspace` as a
project and sign in to an agent from the UI. The token expires after five minutes; run
`podman exec <container> t3 auth pairing create --base-url http://127.0.0.1:3773` for
a new pair URL. The container and its state are removed when you stop it.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `T3CODE_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/t3code:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files the agents write stay owned by you. The port is bound to `127.0.0.1`.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
