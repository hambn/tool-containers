---
name: Podman
description: Run the Codex CLI under rootless Podman on the current directory, keeping file ownership with keep-id and relabeling the mount for SELinux.
usecase: Rootless sessions on a workstation
keywords: [rootless, keep-id, selinux, openai api key]
---

# Run Codex CLI with Podman

[`run.sh`](./run.sh) starts [Codex CLI](../../README.md) under rootless Podman on the
current directory, passing any arguments to `codex`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.
- An OpenAI API key in `OPENAI_API_KEY`.

## Run Codex

```bash
export OPENAI_API_KEY=sk-...
./run.sh
```

Codex opens its sign-in screen with the key detected; choose the API key option. The
login is removed with the container when you exit. For `./run.sh exec "..."`, add
`-e CODEX_API_KEY` to the `podman run` line and export the key under that name, since
`codex exec` does not read `OPENAI_API_KEY`.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | Forwarded to the container and offered at the Codex sign-in screen. |
| `CODEX_IMAGE` | no | Image to run. Defaults to `ghcr.io/hambn/codex:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files Codex writes stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
