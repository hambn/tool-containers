# Docker Compose

Open an interactive shell using the published image:

```sh
WORKSPACE="$PWD" docker compose run --rm agentimg
WORKSPACE="$PWD" AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:alpine \
  docker compose run --rm agentimg
```

`docker-compose.yml` mounts the caller's `WORKSPACE` directory at `/workspace`.
`airgapped.docker-compose.yml` builds `ubuntu-browser` locally; its base images and
downloaded packages must already be reachable or cached during that build:

```sh
WORKSPACE="$PWD" docker compose -f airgapped.docker-compose.yml run --rm agentimg
```
