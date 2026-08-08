# Docker Compose

Run a review against the current directory:

```sh
WORKSPACE="$PWD" docker compose run --rm open-code-review review
WORKSPACE="$PWD" OCR_IMAGE=ghcr.io/hambn/open-code-review:alpine \
  docker compose run --rm open-code-review review
```

The Compose definition mounts the caller's `WORKSPACE` directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant locally and requires its agentimg base,
the OCR package, and their dependencies to be cached or reachable:

```sh
WORKSPACE="$PWD" docker compose -f airgapped.docker-compose.yml \
  run --rm open-code-review review
```
