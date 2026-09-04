# omnigent · Docker Compose

Omnigent is an AI agent meta-harness that drives many agents, packaged on the agentbloat foundations. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh run --rm omnigent
name: omnigent

services:
  omnigent:
    image: ${OMNIGENT_IMAGE:-ghcr.io/hambn/omnigent:latest}
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [omnigent]

networks:
  omnigent:
    name: omnigent
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm omnigent
name: omnigent-airgapped

services:
  omnigent:
    build:
      context: ../../images/ubuntu-browser
    image: local/omnigent:ubuntu-browser
    pull_policy: never
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [omnigent]

networks:
  omnigent:
    name: omnigent-airgapped
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm omnigent
```

### Use a pinned image

```bash
OMNIGENT_IMAGE=ghcr.io/hambn/omnigent:<tag> ./compose.sh run --rm omnigent
```
