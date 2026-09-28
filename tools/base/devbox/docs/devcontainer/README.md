---
name: Dev Container
description: Open a project inside devbox as a Dev Container from VS Code or the devcontainer CLI, with the checkout at /workspace and sysadmin mapped to your UID.
usecase: Editor-attached development container
keywords: [vs code, devcontainer cli, remote development]
---

# Run devbox with Dev Container

[`devcontainer.json`](./devcontainer.json) opens a project inside
[devbox](../../README.md) with any tool that implements the
[Dev Containers specification](https://containers.dev/), such as VS Code or the
`devcontainer` CLI.

## Prerequisites

- Docker, or another engine your Dev Containers tool supports.
- VS Code with the Dev Containers extension, or the CLI:
  `npm install -g @devcontainers/cli`.

## Open the project

Copy the file into the project:

```bash
mkdir -p .devcontainer
cp devcontainer.json .devcontainer/devcontainer.json
```

In VS Code, choose **Reopen in Container**. With the CLI, run from the project root:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . zsh -l
```

To use another variant, change `image`, for example to
`ghcr.io/hambn/devbox:alpine-browser`, or to a digest reference to pin one build. To
pass a host variable into terminals, add it under `remoteEnv`, for example
`"remoteEnv": { "GH_TOKEN": "${localEnv:GH_TOKEN}" }`.

## Workspace

The project folder is mounted at `/workspace`. Because `remoteUser` is set, Linux hosts
rebuild the image with `sysadmin` changed to your UID and GID, so new files keep your
ownership. Shell history and caches in `/home/sysadmin` are lost when the container is
rebuilt.

## Files

- [`devcontainer.json`](./devcontainer.json) sets the image, user, workspace mount, and a 1 GB `/dev/shm` for the browser tier.

## Cleanup

VS Code stops the container when you close the window. With the CLI, remove it with
`docker rm -f <containerId>`, using the ID that `devcontainer up` printed.
