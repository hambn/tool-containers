# agentimg · Docker

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
docker run -it --rm \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentimg:latest zsh
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run an interactive agentimg shell on the current directory.
set -euo pipefail

IMAGE="${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}"
docker_options=()
if [[ -n "${AGENTIMG_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$AGENTIMG_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $AGENTIMG_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$AGENTIMG_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$AGENTIMG_DOCKER_SOCKET")"
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
# Offline host. Load agentimg from a local tar and never pull.
# Online prep: docker save ghcr.io/hambn/agentimg:latest -o agentimg.tar
set -euo pipefail

TAR="${1:-agentimg.tar}"
[ -f "$TAR" ] || { echo "missing $TAR" >&2; exit 1; }
docker_options=()
if [[ -n "${AGENTIMG_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$AGENTIMG_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $AGENTIMG_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$AGENTIMG_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$AGENTIMG_DOCKER_SOCKET")"
  )
fi

docker load -i "$TAR"
docker run -it --rm --pull=never \
  "${docker_options[@]}" \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentimg:latest zsh
```

## More examples

### Pin a specific image tag

Every moving tag from the [image table](../../README.md#images) works; override with an environment variable:

```bash
AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:<tag> ./run.sh
```

### One-off non-interactive command

```bash
docker run --rm -v "$PWD:/workspace" ghcr.io/hambn/agentimg:latest zsh -c 'exit'
```

### Give the container access to the Docker socket

The helpers mount the host socket only when you ask for it:

```bash
AGENTIMG_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

### Chromium needs shared memory

The browser-enabled variants run headless Chromium; give the sandbox at least 1 GB of /dev/shm:

```bash
docker run -it --rm --shm-size=1g -v "$PWD:/workspace" ghcr.io/hambn/agentimg:latest
```

### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/agentimg:latest zsh
```
