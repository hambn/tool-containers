# claude-code · Docker Compose

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

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
# WORKSPACE="$PWD" ./compose.sh --env-file "$credentials" run --rm claude
name: claude-code

services:
  claude:
    image: ghcr.io/hambn/claude-code:latest
    container_name: claude-code
    hostname: claude-code
    networks: [claude-code]
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true

networks:
  claude-code:
    name: claude-code
```

### `airgapped.docker-compose.yml`

```yaml
# Offline: build from the repo's Dockerfile instead of pulling a registry image.
# Run with the credential file created in README.md:
#   WORKSPACE="$PWD" ./compose.sh --env-file "$credentials" -f airgapped.docker-compose.yml run --build --rm claude
name: claude-code

services:
  claude:
    build:
      context: ../../images/ubuntu-browser
    image: claude-code:airgapped
    pull_policy: never
    container_name: claude-code
    hostname: claude-code
    networks: [claude-code]
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true

networks:
  claude-code:
    name: claude-code
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm claude-code
```

### Use a pinned image

Edit `image:` in `docker-compose.yml` to any moving tag from the [image table](../../README.md#images), then re-run the helper.
