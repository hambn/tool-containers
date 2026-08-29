# claude-code · Docker Swarm

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Docker Swarm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

## Files in this directory

### `stack.yml`

```yaml
# Docker Swarm stack. Create the secret, then deploy:
#   printf '%s' "$ANTHROPIC_API_KEY" | docker secret create claude_code_api_key -
#   docker stack deploy -c stack.yml claude-code
# Swarm runs services long-lived; Claude Code reads the key from the mounted secret file.
version: "3.8"

services:
  claude:
    # Moving tag repointed by every Claude Code release; pin claude-code-v<version> to freeze one.
    image: ghcr.io/hambn/claude-code:ubuntu-browser
    user: "1000:1000"
    cap_drop: [ALL]
    hostname: claude-code
    environment:
      # Claude Code reads the key from the file the secret is mounted at.
      ANTHROPIC_API_KEY_FILE: /run/secrets/claude_code_api_key
    secrets:
      - claude_code_api_key
    networks:
      - claude-code
    deploy:
      replicas: 1
      restart_policy:
        condition: any
      resources:
        limits:
          cpus: "1.0"
          memory: 1G

secrets:
  claude_code_api_key:
    external: true

networks:
  claude-code:
    driver: overlay
    name: claude-code
```

## More examples

### Deploy, inspect, and scale

```bash
docker stack deploy -c stack.yml claude-code
docker stack services claude-code
docker service scale claude-code_claude-code=2
docker service logs -f claude-code_claude-code


### Remove the stack

```bash
docker stack rm claude-code
