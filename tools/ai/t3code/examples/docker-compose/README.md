# t3code · Docker Compose

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh up  → open http://localhost:3773
# Auth the agent from inside the T3 Code UI — no API key env needed.
name: t3code

services:
  t3:
    image: ghcr.io/hambn/t3code:ubuntu-browser
    container_name: t3code
    hostname: t3code
    networks: [t3code]
    ports:
      - "127.0.0.1:3773:3773"
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace

networks:
  t3code:
    name: t3code
```

### `airgapped.docker-compose.yml`

```yaml
# Offline: build from the repo's Dockerfile instead of pulling a registry image.
# Run from this directory:
#   WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml up
name: t3code

services:
  t3:
    build:
      context: ../../images/ubuntu-browser
    image: t3code:airgapped
    pull_policy: build
    container_name: t3code
    hostname: t3code
    networks: [t3code]
    ports:
      - "127.0.0.1:3773:3773"
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace

networks:
  t3code:
    name: t3code
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm t3code
```

### Use a pinned image

Edit `image:` in `docker-compose.yml` to any moving tag from the [image table](../../README.md#images), then re-run the helper.
