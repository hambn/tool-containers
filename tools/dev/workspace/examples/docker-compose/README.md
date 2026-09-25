# workspace · Docker Compose

workspace is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh run --rm workspace
name: workspace

services:
  workspace:
    image: ${WORKSPACE_IMAGE:-ghcr.io/hambn/workspace:ubuntu-24.04-full}
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [workspace]

networks:
  workspace:
    name: workspace
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --rm workspace
name: workspace-airgapped

services:
  workspace:
    image: ghcr.io/hambn/workspace:ubuntu-24.04-full
    pull_policy: never
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [workspace]

networks:
  workspace:
    name: workspace-airgapped
```

Before using the air-gapped Compose file, save `ghcr.io/hambn/workspace:ubuntu-24.04-full` on a connected host with `docker save`, then transfer and `docker load` the tar on the offline host. Compose uses the loaded tag and never pulls.

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm workspace
```

### Use a pinned image

```bash
WORKSPACE_IMAGE=ghcr.io/hambn/workspace:<tag> ./compose.sh run --rm workspace
```
