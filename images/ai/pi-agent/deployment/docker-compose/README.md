# Docker Compose

Run Pi against the current directory:

```sh
WORKSPACE="$PWD" ./compose.sh run --rm pi-agent
WORKSPACE="$PWD" PI_AGENT_IMAGE=ghcr.io/hambn/pi-agent:alpine \
  ./compose.sh run --rm pi-agent --help
```

`compose.sh` rejects a missing or relative `WORKSPACE` before invoking Compose. The
Compose definition mounts that directory at `/workspace`. The air-gapped
definition builds the Ubuntu browser variant locally and requires its agentimg base,
the Pi package, and their dependencies to be cached or reachable:

```sh
WORKSPACE="$PWD" ./compose.sh -f airgapped.docker-compose.yml \
  run --build --rm pi-agent
```
