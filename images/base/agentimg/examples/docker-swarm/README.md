# agentimg · Docker Swarm

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker Swarm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `stack.yml`

```yaml
# docker stack deploy -c stack.yml agentimg
version: "3.8"

services:
  agentimg:
    image: ghcr.io/hambn/agentimg:latest
    user: "1000:1000"
    cap_drop: [ALL]
    command: ["sleep", "infinity"]
    networks: [agentimg]
    volumes:
      - workspace:/workspace
    deploy:
      replicas: 1
      restart_policy:
        condition: any
      resources:
        limits:
          cpus: "2.0"
          memory: 4G

networks:
  agentimg:
    driver: overlay
    name: agentimg

volumes:
  workspace:
```

## More examples

### Deploy, inspect, and scale

```bash
docker stack deploy -c stack.yml agentimg
docker stack services agentimg
docker service scale agentimg_agentimg=2
docker service logs -f agentimg_agentimg


### Remove the stack

```bash
docker stack rm agentimg
