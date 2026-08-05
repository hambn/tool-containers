# Docker Compose

Open Omnigent in the current directory:

```sh
docker compose run --rm omnigent
OMNIGENT_IMAGE=ghcr.io/hambn/omnigent:alpine docker compose run --rm omnigent
```

The offline definition builds the Ubuntu browser variant from its local Dockerfile
and requires its `agentbloat` base image and package downloads to be cached or reachable.
