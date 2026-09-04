# t3code · Docker Swarm

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Docker Swarm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `stack.yml`

```yaml
# Docker Swarm stack. Deploy:
#   docker stack deploy -c stack.yml t3code
# Long-lived web GUI published on port 3773; auth the agent from the T3 Code UI.
version: "3.8"

services:
  t3:
    image: ghcr.io/hambn/t3code:ubuntu-browser
    user: "1000:1000"
    cap_drop: [ALL]
    hostname: t3code
    ports:
      - "3773:3773"
    networks:
      - t3code
    deploy:
      replicas: 1
      restart_policy:
        condition: any
      resources:
        limits:
          cpus: "2.0"
          memory: 2G

networks:
  t3code:
    driver: overlay
    name: t3code
```

## More examples

### Deploy, inspect, and scale

```bash
docker stack deploy -c stack.yml t3code
docker stack services t3code
docker service scale t3code_t3code=2
docker service logs -f t3code_t3code
```

### Remove the stack

```bash
docker stack rm t3code
```
