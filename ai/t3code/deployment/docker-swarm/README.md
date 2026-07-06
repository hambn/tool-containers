# docker-swarm

Docker Swarm stack. Long-running web GUI on an overlay network, published on port `3773`,
agent key via a Swarm secret.

| File | Use |
|------|-----|
| `stack.yml` | `docker stack deploy` a single replica |

```sh
printf '%s' "$ANTHROPIC_API_KEY" | docker secret create t3code_api_key -
docker stack deploy -c stack.yml t3code
```

Remove: `docker stack rm t3code`. Reach the GUI on any swarm node at `:3773`.
