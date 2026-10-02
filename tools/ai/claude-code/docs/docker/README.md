---
name: Docker command
description: Start Claude Code on your current checkout with an exported Anthropic API key, using direct Docker commands for interactive or print mode.
usecase: Interactive coding on a local checkout
keywords: [anthropic api key, interactive session, print mode]
---

# Run Claude Code with Docker command

Run [Claude Code](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

Export `ANTHROPIC_API_KEY` in your host shell before running either example.

## Start an interactive session

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:ubuntu-browser
```

## Print one answer

```bash
docker run --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/claude-code:ubuntu-browser -p "explain the build scripts"
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
