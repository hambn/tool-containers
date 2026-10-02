---
name: Docker command
description: Run Omnigent on your current checkout with an exported model provider key, using direct Docker commands for a session or a specific agent.
usecase: Orchestrate agents over a local checkout
keywords: [agent harness, anthropic api key, terminal session]
---

# Run Omnigent with Docker command

Run [Omnigent](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

Export `ANTHROPIC_API_KEY` in your host shell. For another provider, replace the environment flag with its variable, such as `-e OPENAI_API_KEY`. Omnigent offers the credentials it finds on first run. These examples use the terminal session.

## Start a session

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/omnigent:ubuntu-browser
```

## Start Claude Code

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/omnigent:ubuntu-browser claude
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
