# workspace · Docker Swarm

workspace is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Docker Swarm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `stack.yml`

```yaml
# docker stack deploy -c stack.yml workspace
version: "3.8"

services:
  workspace:
    image: ghcr.io/hambn/workspace:ubuntu-24.04-full
    user: "1000:1000"
    cap_drop: [ALL]
    command: ["sleep", "infinity"]
    networks: [workspace]
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
  workspace:
    driver: overlay
    name: workspace

volumes:
  workspace:
```

## More examples

### Deploy, inspect, and scale

```bash
docker stack deploy -c stack.yml workspace
docker stack services workspace
docker service scale workspace_workspace=2
docker service logs -f workspace_workspace
```

### Remove the stack

```bash
docker stack rm workspace
```
