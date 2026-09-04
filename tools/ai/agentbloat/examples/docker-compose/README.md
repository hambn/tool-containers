# agentbloat · Docker Compose

agentbloat bundles the current Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi coding-agent CLIs in one image. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh run --rm agentbloat
name: agentbloat

services:
  agentbloat:
    image: ${AGENTBLOAT_IMAGE:-ghcr.io/hambn/agentbloat:latest}
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [agentbloat]

networks:
  agentbloat:
    name: agentbloat
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm agentbloat
name: agentbloat-airgapped

services:
  agentbloat:
    build:
      context: ../../images/ubuntu-browser
    image: local/agentbloat:ubuntu-browser
    pull_policy: never
    command: ["zsh", "-l"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [agentbloat]

networks:
  agentbloat:
    name: agentbloat-airgapped
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm agentbloat
```

### Use a pinned image

```bash
AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:<tag> ./compose.sh run --rm agentbloat
```
