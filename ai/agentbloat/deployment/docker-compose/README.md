# Docker Compose

Open an interactive agentbloat shell:

```sh
WORKSPACE="$PWD" docker compose run --rm agentbloat
WORKSPACE="$PWD" AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:alpine \
  docker compose run --rm agentbloat
```

The Compose definition mounts the caller's `WORKSPACE` directory at `/workspace`. The
air-gapped definition builds the Ubuntu browser variant from its local Dockerfile and
requires its base image and package downloads to be cached or reachable:

```sh
WORKSPACE="$PWD" docker compose -f airgapped.docker-compose.yml run --rm agentbloat
```
