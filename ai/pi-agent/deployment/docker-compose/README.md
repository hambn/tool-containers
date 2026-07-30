# Docker Compose

Run Pi against the current directory:

```sh
docker compose run --rm pi-agent
PI_AGENT_IMAGE=ghcr.io/hambn/pi-agent:alpine \
  docker compose run --rm pi-agent --help
```

The Compose definition mounts the current directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant locally and requires its agentimg base,
the Pi package, and their dependencies to be cached or reachable.
