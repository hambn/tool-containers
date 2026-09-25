# workspace · Docker

workspace is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/workspace:ubuntu-24.04-full zsh
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run an interactive workspace shell on the current directory.
set -euo pipefail

IMAGE="${WORKSPACE_IMAGE:-ghcr.io/hambn/workspace:ubuntu-24.04-full}"
docker_options=()
if [[ -n "${WORKSPACE_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$WORKSPACE_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $WORKSPACE_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$WORKSPACE_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$WORKSPACE_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  "$IMAGE" zsh "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Load workspace from a local tar and never pull.
# Online prep: docker save ghcr.io/hambn/workspace:ubuntu-24.04-full -o workspace.tar
set -euo pipefail

TAR="${1:-workspace.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker_options=()
if [[ -n "${WORKSPACE_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$WORKSPACE_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $WORKSPACE_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$WORKSPACE_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$WORKSPACE_DOCKER_SOCKET")"
  )
fi

docker load -i "$TAR"
docker run -it --rm --pull=never \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/workspace:ubuntu-24.04-full zsh
```

## More examples

### Pin a specific image tag

Every moving tag from the [image table](../../README.md#images) works; override with an environment variable:

```bash
WORKSPACE_IMAGE=ghcr.io/hambn/workspace:<tag> ./run.sh
```

### One-off non-interactive command

```bash
docker run --rm -v "$PWD:/workspace" ghcr.io/hambn/workspace:ubuntu-24.04-full zsh -c 'exit'
```

### Give the container access to the Docker socket

The helpers mount the host socket only when you ask for it:

```bash
WORKSPACE_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

### Chromium needs shared memory

The browser-enabled variants run headless Chromium; give the sandbox at least 1 GB of /dev/shm:

```bash
docker run -it --rm --shm-size=1g -v "$PWD:/workspace" ghcr.io/hambn/workspace:ubuntu-24.04-full
```

### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/workspace:ubuntu-24.04-full zsh
```
