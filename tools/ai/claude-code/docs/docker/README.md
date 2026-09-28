---
name: Docker
description: Run Claude Code in Docker on the current directory with your Anthropic API key, or from a saved image tarball on a host with no registry access.
usecase: Interactive coding on a local checkout
keywords: [anthropic api key, air-gapped, docker save]
---

# Run Claude Code with Docker

[`run.sh`](./run.sh) starts [Claude Code](../../README.md) on the current directory,
passing any arguments to `claude`. [`airgapped.run.sh`](./airgapped.run.sh) does the
same from a saved image on a host that cannot pull.

## Prerequisites

- Docker Engine 23 or later.
- An Anthropic API key in `ANTHROPIC_API_KEY`.

## Run Claude Code

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./run.sh                                  # interactive session
./run.sh -p "explain the build scripts"   # print one answer and exit
```

## Run without registry access

On a machine that can pull, save the image:

```bash
docker save ghcr.io/hambn/claude-code:ubuntu-browser -o claude-code.tar
```

Copy the tar to the offline host and pass its path first; the remaining arguments go to
`claude`:

```bash
./airgapped.run.sh claude-code.tar
```

The script loads the tar and runs `CLAUDE_CODE_IMAGE` with `--pull=never`, so set that
variable if you saved a different tag.

## Variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Forwarded to the container; the scripts stop if it is unset. |
| `CLAUDE_CODE_IMAGE` | no | Image both scripts run. Defaults to `ghcr.io/hambn/claude-code:ubuntu-browser`; set `ghcr.io/hambn/claude-code@sha256:<digest>` to pin one build. |

## Workspace

The current directory is mounted at `/workspace`, the image's working directory. Claude
Code runs as `sysadmin` (UID 1000), so new files belong to UID 1000 on the host. Its
settings and session history stay in the container and are removed with it.

## Files

- [`run.sh`](./run.sh) pulls the image if needed and runs it.
- [`airgapped.run.sh`](./airgapped.run.sh) loads a saved tar and runs it without pulling.
