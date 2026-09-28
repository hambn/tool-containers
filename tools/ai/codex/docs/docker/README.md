---
name: Docker
description: Run the Codex CLI in Docker on the current directory with your OpenAI API key, or from a saved image tarball on a host with no registry access.
usecase: Interactive coding on a local checkout
keywords: [openai api key, air-gapped, docker save]
---

# Run Codex CLI with Docker

[`run.sh`](./run.sh) starts [Codex CLI](../../README.md) on the current directory,
passing any arguments to `codex`. [`airgapped.run.sh`](./airgapped.run.sh) does the
same from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.
- An OpenAI API key in `OPENAI_API_KEY`.

## Run Codex

```bash
export OPENAI_API_KEY=sk-...
./run.sh                                   # interactive session
./run.sh exec "summarize this repository"  # one-shot task
```

The interactive session opens Codex's sign-in screen with your key already detected;
choose the API key option to continue. Codex saves the login in
`/home/sysadmin/.codex` inside the container, and `--rm` deletes it when you exit, so
you confirm it again on each run.

`codex exec` does not read `OPENAI_API_KEY`. It reads `CODEX_API_KEY`, which the
scripts do not forward, so for non-interactive runs add `-e CODEX_API_KEY` to the
`docker run` line and export the key under that name.

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/codex:ubuntu-browser -o codex.tar
```

Copy `codex.tar` to the offline host and run it from there. The first argument is the
tar path; the rest go to `codex`:

```bash
./airgapped.run.sh codex.tar
```

The script loads the tar and runs `CODEX_IMAGE` with `--pull=never`, so set
`CODEX_IMAGE` if you saved a different tag.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | yes | Forwarded to the container and offered at the Codex sign-in screen. |
| `CODEX_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/codex:ubuntu-browser`; set `ghcr.io/hambn/codex@sha256:<digest>` to pin one build. |

## Workspace

The current directory is mounted at `/workspace`, the image's working directory. Codex
runs as `sysadmin` (UID 1000), so new files belong to UID 1000 on the host.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and runs it.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
