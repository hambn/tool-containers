# pi-agent · Docker Compose

Pi is a coding agent from Earendil Works, packaged on the agentimg foundations. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh run --rm pi-agent
name: pi-agent

services:
  pi-agent:
    image: ${PI_AGENT_IMAGE:-ghcr.io/hambn/pi-agent:latest}
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [pi-agent]

networks:
  pi-agent:
    name: pi-agent
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm pi-agent
name: pi-agent-airgapped

services:
  pi-agent:
    build:
      context: ../../images/ubuntu-browser
    image: local/pi-agent:ubuntu-browser
    pull_policy: never
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [pi-agent]

networks:
  pi-agent:
    name: pi-agent-airgapped
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm pi-agent
```

### Use a pinned image

```bash
PI_AGENT_IMAGE=ghcr.io/hambn/pi-agent:<tag> ./compose.sh run --rm pi-agent
```
