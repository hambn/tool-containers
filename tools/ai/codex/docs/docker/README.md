---
name: Docker command
description: Start Codex CLI on your checkout with an exported OpenAI API key, or run a single task using a copyable Docker command.
usecase: Interactive coding on a local checkout
keywords: [openai api key, interactive session, one-shot task]
---

# Run Codex CLI with Docker command

Run [Codex CLI](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

Export `OPENAI_API_KEY` for the interactive example, or `CODEX_API_KEY` for the one-task example. Choose the API key option on the interactive sign-in screen.

## Start an interactive session

```bash
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:ubuntu-browser
```

## Run one task

```bash
docker run --rm \
  -e CODEX_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/codex:ubuntu-browser exec "summarize this repository"
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
