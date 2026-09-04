# t3code · Docker

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Docker with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Quick start

```bash
docker run -it --rm \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser
```

## Files in this directory

### `run.sh`

```bash
#!/usr/bin/env bash
# Run T3 Code web GUI on the current directory, reachable at http://localhost:3773.
# Uses the Ubuntu browser-enabled agentbloat image, which bundles the current coding agents.
set -euo pipefail

docker_options=()
if [[ -n "${T3CODE_DOCKER_SOCKET:-}" ]]; then
  [[ -S "$T3CODE_DOCKER_SOCKET" ]] || {
    echo "not a Docker socket: $T3CODE_DOCKER_SOCKET" >&2
    exit 1
  }
  docker_options+=(
    --volume "$T3CODE_DOCKER_SOCKET:/var/run/docker.sock"
    --group-add "$(stat -c %g "$T3CODE_DOCKER_SOCKET")"
  )
fi

docker run -it --rm \
  "${docker_options[@]}" \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
```

### `airgapped.run.sh`

```bash
#!/usr/bin/env bash
# Offline host. Loads image from a local tar, never pulls.
# Prep on an online host: docker save ghcr.io/hambn/t3code:ubuntu-browser -o t3code.tar
set -euo pipefail

TAR="${1:-t3code.tar}"
if [ "$#" -gt 0 ]; then shift; fi
[ -f "$TAR" ] || { echo "missing $TAR — docker save it on an online host first" >&2; exit 1; }

docker load -i "$TAR"
docker run -it --rm \
  --pull=never \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser "$@"
```

## More examples

### Pin a specific image tag

Edit `run.sh` (or copy it) and replace the image reference with any moving tag from the [image table](../../README.md#images):

```bash
docker run -it --rm -v "$PWD:/workspace" ghcr.io/hambn/t3code:ubuntu-browser
```

### One-off non-interactive command

```bash
docker run --rm -v "$PWD:/workspace" ghcr.io/hambn/t3code:ubuntu-browser --help
```

### Give the container access to the Docker socket

The helpers mount the host socket only when you ask for it:

```bash
T3CODE_DOCKER_SOCKET=/var/run/docker.sock ./run.sh
```

### Chromium needs shared memory

The browser-enabled variants run headless Chromium; give the sandbox at least 1 GB of /dev/shm:

```bash
docker run -it --rm --shm-size=1g -p 127.0.0.1:3773:3773 -v "$PWD:/workspace" ghcr.io/hambn/t3code:ubuntu-browser
```

### Constrain resources

```bash
docker run -it --rm \
  --cpus=2 \
  --memory=4g \
  --memory-swap=4g \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser
```
