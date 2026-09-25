# devbox · Docker

Open an interactive [devbox](../../README.md) shell on the current directory, optionally
driving the host Docker daemon from inside it.

## Prerequisites

- Docker 24 or later

## Commands

Interactive Zsh login shell with the current directory at `/workspace`:

```bash
./run.sh
```

One-off command:

```bash
./run.sh zsh -lc 'go version && node --version'
```

Use the host Docker daemon from inside the container (full and browser tiers):

```bash
DEVBOX_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

## Variables

| Variable | Default | Purpose |
|---|---|---|
| `DEVBOX_VARIANT` | `ubuntu-full` | Any variant from the [image table](../../README.md#images) |
| `DEVBOX_DOCKER_SOCKET` | unset | Host Docker socket to mount; its group is added to the container |

## Workspace

[`run.sh`](./run.sh) bind-mounts the current directory at `/workspace` and starts there.
The shell runs as `sysadmin` (UID/GID 1000); files it creates on the host are owned by
UID 1000.

## Files

- [`run.sh`](./run.sh) — interactive shell, one-off command, optional Docker socket

## Cleanup

The container is removed on exit (`--rm`).

## Limitations

- Mounting the Docker socket grants root-equivalent access to the host.
- `--shm-size=1g` is set for headless Chromium in the browser tier.
