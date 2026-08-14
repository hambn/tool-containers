# Docker Compose

Open an interactive agentbloat shell:

```sh
docker compose run --rm agentbloat
AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:alpine docker compose run --rm agentbloat
```

The Compose definition mounts the current directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant from its local Dockerfile and requires its
base image and package downloads to be cached or reachable.
