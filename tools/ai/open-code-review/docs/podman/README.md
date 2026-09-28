---
name: Podman
description: Run the Open Code Review CLI under rootless Podman on the current checkout, keeping file ownership with keep-id and relabeling for SELinux.
usecase: Rootless reviews on a workstation
keywords: [ocr review, rootless, keep-id, selinux]
---

# Run Open Code Review with Podman

[`run.sh`](./run.sh) starts [Open Code Review](../../README.md) under rootless Podman on
the current directory, passing any arguments to `ocr`.

## Prerequisites

- Rootless Podman 4.3 or later, for `--userns=keep-id:uid=1000,gid=1000`.
- An API key for an LLM provider `ocr` supports, such as `ANTHROPIC_API_KEY`.

## Review your changes

`run.sh` passes no environment, and the provider settings `ocr` saves in the container
are removed with it. Start a shell with your key instead:

```bash
podman run -it --rm --userns=keep-id:uid=1000,gid=1000 -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace:Z" --entrypoint zsh ghcr.io/hambn/open-code-review:ubuntu-browser
```

Then configure and review inside it:

```bash
ocr config set provider anthropic
ocr config set model <model>
ocr review
```

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPEN_CODE_REVIEW_IMAGE` | no | Image `run.sh` runs. Defaults to `ghcr.io/hambn/open-code-review:ubuntu-browser`; set a digest reference to pin one build. |

## Workspace

The current directory is mounted at `/workspace` with `:Z`, so SELinux hosts relabel it
for the container. `--userns=keep-id` maps your host user to `sysadmin` (UID 1000), so
files the container writes stay owned by you.

## Files

- [`run.sh`](./run.sh) runs the published image with rootless Podman.
