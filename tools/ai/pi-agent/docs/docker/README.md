---
name: Docker command
description: Start the Pi coding agent in Docker on your current checkout, signing in interactively or passing an exported model provider API key.
usecase: Interactive coding on a local checkout
keywords: [terminal coding agent, provider login, api key]
---

# Run Pi Coding Agent with Docker command

Run [Pi Coding Agent](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

Run `/login` inside Pi to connect your provider account. For the API key example, export `ANTHROPIC_API_KEY` in your host shell first.

## Sign in interactively

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:ubuntu-browser
```

## Use an Anthropic API key

```bash
docker run -it --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/pi-agent:ubuntu-browser
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
