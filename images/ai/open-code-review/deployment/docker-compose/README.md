# Docker Compose

Run a review against the current directory:

```sh
docker compose run --rm open-code-review review
OCR_IMAGE=ghcr.io/hambn/open-code-review:alpine \
  docker compose run --rm open-code-review review
```

The Compose definition mounts the current directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant locally and requires its agentimg base,
the OCR package, and their dependencies to be cached or reachable.
