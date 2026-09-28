---
name: Dev Container
description: Open a project inside agentbloat as a Dev Container, with every bundled agent CLI in the editor terminal and the checkout mounted at /workspace.
usecase: Multi-agent workspace inside the editor
keywords: [vs code, devcontainer cli, coding agents]
---

# agentbloat · Dev Container

[`devcontainer.json`](./devcontainer.json) opens a project inside agentbloat with any tool
that implements the [Dev Containers specification](https://containers.dev/), such as VS
Code or the `devcontainer` CLI. Every bundled agent CLI is on the terminal `PATH`.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Docker, or another engine your Dev Containers tool supports.
- VS Code with the Dev Containers extension, or the CLI: `npm install -g @devcontainers/cli`.
- Sign in to each agent CLI in the container terminal, or forward its API key as shown
  under [Variables](#variables).

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

## Variables

None are required. To forward an API key from the host into terminals, add it under
`remoteEnv`, for example `"remoteEnv": { "OPENAI_API_KEY": "${localEnv:OPENAI_API_KEY}" }`.
`remoteEnv` keeps the value out of the container's own environment.

## Workspace

The project folder is bind-mounted at `/workspace`. Because `remoteUser` is set, Linux
hosts rebuild the image with `sysadmin` changed to your UID and GID, so files the agents
write keep your ownership.

## Files

- [`devcontainer.json`](./devcontainer.json) — image, user, workspace mount, and shared memory size

## Cleanup

VS Code stops the container when the window closes. With the CLI, remove it with
`docker rm -f <containerId>`, using the `containerId` that `devcontainer up` printed.

## Limitations

- Agent sign-ins are stored under `/home/sysadmin` in the container and are lost when it is rebuilt.
- `ubuntu-browser` is a moving tag; pin a digest (`ghcr.io/hambn/agentbloat@sha256:<digest>`) for repeatable environments.
