---
name: Docker command
description: Open an agentbloat shell on your current checkout with every bundled agent CLI, or forward an exported API key with a direct Docker command.
usecase: Interactive multi-agent workspace
keywords: [coding agents, zsh, api key]
---

# Run agentbloat with Docker command

Run [agentbloat](../../README.md) with the current directory mounted at `/workspace`. Choose one example and copy its command.

## Prerequisites

- Docker Engine 23 or later.

Run an agent such as `claude` or `codex` from the shell and sign in. Export `OPENAI_API_KEY` on the host before using the API key example.

## Open a shell

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/agentbloat:ubuntu-browser
```

## Pass an OpenAI API key

```bash
docker run -it --rm \
  -e OPENAI_API_KEY \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/agentbloat:ubuntu-browser
```

## Use the host Docker daemon

On Linux, mount the host socket and add its group. Socket access gives the container root-equivalent access to the host.

```bash
docker run -it --rm \
  --shm-size=1g \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add "$(stat -c %g /var/run/docker.sock)" \
  -v "$PWD:/workspace" \
  -w /workspace \
  ghcr.io/hambn/agentbloat:ubuntu-browser
```

## Workspace and state

The container runs as `sysadmin`, UID 1000, so files it creates in `/workspace` belong to UID 1000 on the host.
Changes in the mounted directory stay on the host. `--rm` removes container settings and logins when the command exits. Replace the image tag with a digest to pin one build.
