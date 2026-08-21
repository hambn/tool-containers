# Docker Compose

Open an interactive agentbloat shell:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm agentbloat
WORKSPACE="$PWD" AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:alpine \
  ./compose.sh run --rm agentbloat
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose. The
Compose definition mounts that directory at `/workspace`. The
air-gapped definition builds the Ubuntu browser variant from its local Dockerfile and
requires its base image and package downloads to be cached or reachable:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm agentbloat
```
