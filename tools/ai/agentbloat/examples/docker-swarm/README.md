# agentbloat · Docker Swarm

agentbloat bundles the current Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi coding-agent CLIs in one image. This page runs it on Docker Swarm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `stack.yml`

```yaml
# docker stack deploy -c stack.yml agentbloat
version: "3.8"

services:
  agentbloat:
    image: ghcr.io/hambn/agentbloat:latest
    user: "1000:1000"
    cap_drop: [ALL]
    command: ["sleep", "infinity"]
    networks: [agentbloat]
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
  agentbloat:
    driver: overlay
    name: agentbloat

volumes:
  workspace:
```

## More examples

### Deploy, inspect, and scale

```bash
docker stack deploy -c stack.yml agentbloat
docker stack services agentbloat
docker service scale agentbloat_agentbloat=2
docker service logs -f agentbloat_agentbloat
```

### Remove the stack

```bash
docker stack rm agentbloat
```
