# Docker Compose

Open an interactive shell using the published image:

```sh
docker compose run --rm agentimg
AGENTIMG_IMAGE=ghcr.io/hambn/agentimg:alpine docker compose run --rm agentimg
```

`docker-compose.yml` mounts the current directory at `/workspace`.
`airgapped.docker-compose.yml` builds `ubuntu-browser` locally; its base images and
downloaded packages must already be reachable or cached during that build.
