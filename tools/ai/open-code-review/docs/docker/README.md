---
name: Docker command
description: Review a checkout with Open Code Review in Docker, using a named settings volume to keep provider configuration between direct commands.
usecase: Review the current checkout
keywords: [ocr review, llm provider, persistent configuration]
---

# Run Open Code Review with Docker command

Run [Open Code Review](../../README.md) against the current checkout. Each command mounts the checkout at `/workspace` and keeps provider settings in a named volume.

## Prerequisites

- Docker Engine 23 or later.
- A Git checkout and an exported `ANTHROPIC_API_KEY` for the examples below.

## Configure the provider

```bash
docker run --rm \
  -v ocr-config:/home/sysadmin/.opencodereview \
  ghcr.io/hambn/open-code-review:ubuntu-browser config set provider anthropic
```

## Configure the model

Replace `<model>` with the model you want to use:

```bash
docker run --rm \
  -v ocr-config:/home/sysadmin/.opencodereview \
  ghcr.io/hambn/open-code-review:ubuntu-browser config set model "<model>"
```

## Review your changes

After configuring the provider and model, review staged, unstaged, and untracked changes:

```bash
docker run --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v ocr-config:/home/sysadmin/.opencodereview \
  ghcr.io/hambn/open-code-review:ubuntu-browser review
```

## Review a branch

```bash
docker run --rm \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v ocr-config:/home/sysadmin/.opencodereview \
  ghcr.io/hambn/open-code-review:ubuntu-browser review --from main --to HEAD
```

## Workspace and state

`ocr` runs as `sysadmin`, UID 1000. The current directory must be a Git repository. The `ocr-config` volume keeps provider settings between runs; API keys come from the host environment. Replace the image tag with a digest to pin one build.

For other providers and their variables, see the upstream [configuration reference](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/en/configuration.md).

## Cleanup

Remove saved provider settings when you no longer need them:

```bash
docker volume rm ocr-config
```
