# Docker Compose

Open Omnigent in the current directory:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm omnigent
WORKSPACE="$PWD" OMNIGENT_IMAGE=ghcr.io/hambn/omnigent:alpine \
  ./compose.sh run --rm omnigent
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose. The
offline definition builds the Ubuntu browser variant from its local Dockerfile
and requires its `agentbloat` base image and package downloads to be cached or reachable:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm omnigent
```
