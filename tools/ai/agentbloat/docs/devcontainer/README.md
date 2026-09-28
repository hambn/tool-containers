---
name: Dev Container
description: Open a project inside agentbloat as a Dev Container, with all eight agent CLIs in the editor terminal and the checkout mounted at /workspace.
usecase: Multi-agent workspace inside the editor
keywords: [vs code, devcontainer cli, coding agents]
---

# Run agentbloat with Dev Container

[`devcontainer.json`](./devcontainer.json) opens a project inside
[agentbloat](../../README.md) with any tool that implements the
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

Then choose **Reopen in Container** in VS Code, or run this from the project root:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . zsh -l
```

Run any agent in the terminal and sign in from its prompt. Logins are saved in
`/home/sysadmin` and lost when the container is rebuilt.

## Variables

None are required. To pass an API key from the host to the terminals, add it under
`remoteEnv`, for example
`"remoteEnv": { "OPENAI_API_KEY": "${localEnv:OPENAI_API_KEY}" }`. To pin one build,
set `image` to `ghcr.io/hambn/agentbloat@sha256:<digest>`.

## Workspace

The project folder is mounted at `/workspace`. Because `remoteUser` is set, Linux hosts
rebuild the image with `sysadmin` changed to your UID and GID, so files the agents write
keep your ownership. `--shm-size=1g` gives headless Chromium room in `/dev/shm`.

## Files

- [`devcontainer.json`](./devcontainer.json) sets the image, user, workspace mount, and shared memory size.

## Cleanup

VS Code stops the container when the window closes. With the CLI, run
`docker rm -f <containerId>` with the ID that `devcontainer up` printed.
