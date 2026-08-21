# Docker Compose

Run a review against the current directory:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm open-code-review review
WORKSPACE="$PWD" OCR_IMAGE=ghcr.io/hambn/open-code-review:alpine \
  ./compose.sh run --rm open-code-review review
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose. The
Compose definition mounts that directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant locally and requires its agentimg base,
the OCR package, and their dependencies to be cached or reachable:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml \
  run --build --rm open-code-review review
```
