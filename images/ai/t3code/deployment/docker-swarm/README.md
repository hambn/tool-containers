# docker-swarm

Docker Swarm stack. Long-running web GUI on an overlay network, published on port `3773`.
Auth the agent from the T3 Code UI.

| File | Use |
|------|-----|
| `stack.yml` | `docker stack deploy` a single replica |

```sh
docker stack deploy -c stack.yml t3code
```

Remove: `docker stack rm t3code`. Reach the GUI on any swarm node at `:3773`.
