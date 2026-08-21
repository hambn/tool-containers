# Docker Compose

Open an interactive shell using the published image:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm agentimg
WORKSPACE="$PWD" AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:alpine \
  ./compose.sh run --rm agentimg
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose.
`docker-compose.yml` mounts that directory at `/workspace`.
`airgapped.docker-compose.yml` builds `ubuntu-browser` locally; its base images and
downloaded packages must already be reachable or cached during that build:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml run --build --rm agentimg
```
