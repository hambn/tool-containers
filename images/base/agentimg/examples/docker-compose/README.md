# agentimg · Docker Compose

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `compose.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

case "${WORKSPACE:-}" in
  /*) ;;
  "") echo "Set WORKSPACE to an absolute host path." >&2; exit 2 ;;
  *) echo "WORKSPACE must be an absolute host path: $WORKSPACE" >&2; exit 2 ;;
esac

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$script_dir"
exec docker compose "$@"
```

### `docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh run --rm agentimg
name: agentimg

services:
  agentimg:
    image: ${AGENTIMG_IMAGE:-ghcr.io/hambn/agentimg:latest}
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [agentimg]

networks:
  agentimg:
    name: agentimg
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm agentimg
name: agentimg-airgapped

services:
  agentimg:
    build:
      context: ../../images/ubuntu-browser
    image: local/agentimg:ubuntu-browser
    pull_policy: never
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [agentimg]

networks:
  agentimg:
    name: agentimg-airgapped
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm agentimg
```

### Use a pinned image

```bash
AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:<tag> ./compose.sh run --rm agentimg
```
