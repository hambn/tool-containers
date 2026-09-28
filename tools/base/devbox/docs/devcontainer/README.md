---
name: Dev Container
description: Open a project inside devbox as a Dev Container from VS Code or the devcontainer CLI, with the checkout at /workspace and sysadmin mapped to your UID.
usecase: Editor-attached development container
keywords: [vs code, devcontainer cli, remote development]
---

# devbox · Dev Container

[`devcontainer.json`](./devcontainer.json) opens a project inside [devbox](../../README.md)
with any tool that implements the [Dev Containers specification](https://containers.dev/),
such as VS Code or the `devcontainer` CLI.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker, or another engine your Dev Containers tool supports.
- VS Code with the Dev Containers extension, or the CLI: `npm install -g @devcontainers/cli`.

## Commands

Copy the file into the project you want to open:

```bash
mkdir -p .devcontainer
cp devcontainer.json .devcontainer/devcontainer.json
```

Then choose **Reopen in Container** in VS Code, or use the CLI from the project root:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . zsh -l
```

To use another variant, change `image`, for example to `ghcr.io/hambn/devbox:alpine-browser`.

## Variables

None. To pass a host variable into terminals, add it under `remoteEnv`, for example
`"remoteEnv": { "GH_TOKEN": "${localEnv:GH_TOKEN}" }`.

## Workspace

The project folder is bind-mounted at `/workspace`. Because `remoteUser` is set, Linux
hosts rebuild the image with `sysadmin` changed to your UID and GID, so files you create
keep your ownership. The Dev Containers tool replaces the image command with its own
keep-alive process.

## Files

- [`devcontainer.json`](./devcontainer.json) — image, user, workspace mount, and shared memory size

## Cleanup

VS Code stops the container when the window closes. With the CLI, remove it with
`docker rm -f <containerId>`, using the `containerId` that `devcontainer up` printed.

## Limitations

- `/home/sysadmin` lives in the container; rebuilding it discards shell history and tool caches.
- `ubuntu-full` is a moving tag; pin a digest (`ghcr.io/hambn/devbox@sha256:<digest>`) for repeatable environments.
