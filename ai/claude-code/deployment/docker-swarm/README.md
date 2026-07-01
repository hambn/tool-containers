# docker-swarm

Docker Swarm stack. Long-running service on an overlay network, secret via Swarm secrets.

| File | Use |
|------|-----|
| `stack.yml` | `docker stack deploy` a single replica |

```sh
printf '%s' "$ANTHROPIC_API_KEY" | docker secret create claude_code_api_key -
docker stack deploy -c stack.yml claude-code
```

Remove: `docker stack rm claude-code`.

Note: Claude Code is interactive; Swarm runs services detached. This stack suits non-interactive/`-p` runs. For one-shot interactive use, prefer [docker](../docker) or [compose](../docker-compose).
