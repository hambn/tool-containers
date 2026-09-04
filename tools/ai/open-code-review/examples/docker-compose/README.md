# open-code-review · Docker Compose

Open Code Review is Alibaba's code-review CLI, packaged on the agentimg foundations. This page runs it on Docker Compose with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

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
# WORKSPACE="$PWD" ./compose.sh run --rm open-code-review review
name: open-code-review

services:
  open-code-review:
    image: ${OCR_IMAGE:-ghcr.io/hambn/open-code-review:latest}
    command: ["--help"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [open-code-review]

networks:
  open-code-review:
    name: open-code-review
```

### `airgapped.docker-compose.yml`

```yaml
# WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm open-code-review review
name: open-code-review-airgapped

services:
  open-code-review:
    build:
      context: ../../images/ubuntu-browser
    image: local/open-code-review:ubuntu-browser
    pull_policy: never
    command: ["--help"]
    volumes:
      - ${WORKSPACE:?Set WORKSPACE to an absolute host path}:/workspace
    stdin_open: true
    tty: true
    networks: [open-code-review]

networks:
  open-code-review:
    name: open-code-review-airgapped
```

## More examples

### Point the stack at a different workspace

```bash
WORKSPACE=/srv/projects/my-app ./compose.sh run --rm open-code-review
```

### Use a pinned image

```bash
OCR_IMAGE=ghcr.io/hambn/open-code-review:<tag> ./compose.sh run --rm open-code-review
```
